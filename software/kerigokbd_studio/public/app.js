import { availableKeyboards, loadLayout } from "./layout/layout-loader.js";
import { loadDefaults } from "./layout/defaults-loader.js";
import { KeymapStore } from "./state/keymap-store.js";
import { SyncEngine } from "./state/sync-engine.js";
import { renderKeyboardView } from "./render/keyboard-view.js";
import { renderLayerTabs } from "./render/layer-tabs.js";
import { renderConnectionBar } from "./render/connection-bar.js";
import { HidTransport } from "./hid/hid-transport.js";
import { renderKeyPicker, renderKeyPickerNotice } from "./render/key-picker.js";
import { renderDraftBar } from "./render/draft-bar.js";
import { renderDeviceActions, renderEditActions, renderExportDialog, renderConfirmDialog } from "./render/toolbar.js";
import { renderModeAction } from "./render/mode-action.js";
import { renderCheatSheet } from "./render/cheat-sheet.js";
import { renderLayerToggles } from "./render/layer-toggles.js";
import { renderPngExportControls } from "./render/png-export-controls.js";
import { formatKeymapCSource } from "./export/c-source-writer.js";
import { renderElementToCanvas, canvasToPngBlob, downloadBlob, copyBlobToClipboard } from "./export/png-export.js";
import { layerIndexBySymbol } from "./keycodes/keycode-registry.js";
import { decode, holdLayerOf, withHoldLayer, wrapModsOf, withMods, isEmptyMods, NO_MODS } from "./keycodes/keycode-codec.js";
import { momentaryLayer } from "./keycodes/keycode-values.js";
import { formatKeycodeToken } from "./export/c-source-writer.js";
import { keycodeSummary, layerName } from "./keycodes/keycode-format.js";

const requiredElement = (selector) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Required element is missing: ${selector}`);
  return element;
};

const elements = {
  keyboardName: requiredElement("#editor-title"),
  layoutVersion: requiredElement("#layout-version"),
  keyboardSelect: requiredElement("#keyboard-select"),
  connectionStatus: requiredElement("#connection-status"),
  connectionToggle: requiredElement("#connection-toggle"),
  connectionInfo: requiredElement("#connection-info"),
  modeAction: requiredElement("#mode-action"),
  editView: requiredElement("#edit-view"),
  layerTabs: requiredElement("#layer-tabs"),
  keyboardView: requiredElement("#keyboard-view"),
  draftBar: requiredElement("#draft-bar"),
  draftPanel: requiredElement("#draft-panel"),
  keyPicker: requiredElement("#key-picker"),
  cheatSheetContainer: requiredElement("#cheat-sheet-container"),
  cheatSheetView: requiredElement("#cheat-sheet-view"),
  cheatLegendNumsItem: requiredElement("#cheat-legend-nums-item"),
  cheatLegendFuncItem: requiredElement("#cheat-legend-func-item"),
  cheatLegendExtraItem: requiredElement("#cheat-legend-extra-item"),
  cheatLegendMouseItem: requiredElement("#cheat-legend-mouse-item"),
  iconLegendMouseGroup: requiredElement("#legend-group-mouse"),
  iconLegendTrackpadGroup: requiredElement("#legend-group-trackpad"),
  cheatGuideNums: requiredElement("#cheat-guide-nums"),
  cheatGuideFunc: requiredElement("#cheat-guide-func"),
  cheatGuideExtra: requiredElement("#cheat-guide-extra"),
  cheatGuideMouse: requiredElement("#cheat-guide-mouse"),
  layerToggles: requiredElement("#layer-toggles"),
  pngExportButtons: requiredElement("#png-export-buttons"),
  pngExportStatus: requiredElement("#png-export-status"),
  deviceActions: requiredElement("#device-actions"),
  deviceActionStatus: requiredElement("#device-action-status"),
  modeSettingsGroups: document.querySelectorAll(".settings-group[data-mode]"),
  editActions: requiredElement("#edit-actions"),
  dialogRoot: requiredElement("#dialog-root"),
};

const store = new KeymapStore();
const syncEngine = new SyncEngine(store);
let pickerCategory = "letters_numbers";
let deviceBusy = false;
let viewMode = "cheatSheet"; // "cheatSheet" (default landing) | "edit"
let draftStatus = "";
let draftListOpen = false;
// While choosing a swap partner (交換): the key to swap, as { layer, keyIndex }.
let swapSource = null;
// The picker's 長押し action ({type: "none" | "lt" | "mt" | "mo", layer, mods}) and
// 同時押し modifiers, re-derived from the selected key's value whenever a
// different key is selected. The two are mutually exclusive: QMK can't
// encode LT()/MT() and a mods wrap in one keycode.
const NO_HOLD = Object.freeze({ type: "none", layer: null, mods: NO_MODS });
let pickerHold = NO_HOLD;
let pickerWithMods = { ...NO_MODS };

/** The picker's 長押し / 同時押し state that describes an existing keycode. */
function pickerWrapOf(value) {
  if (value === undefined) return { hold: NO_HOLD, withMods: { ...NO_MODS } };
  const layer = holdLayerOf(value);
  if (layer !== null) return { hold: { ...NO_HOLD, type: "lt", layer }, withMods: { ...NO_MODS } };
  const descriptor = decode(value);
  if (descriptor.kind === "momentaryLayer") return { hold: { ...NO_HOLD, type: "mo", layer: descriptor.layer }, withMods: { ...NO_MODS } };
  const { mods, mode } = wrapModsOf(value);
  if (mode === "tap") return { hold: { ...NO_HOLD, type: "mt", mods }, withMods: { ...NO_MODS } };
  return { hold: NO_HOLD, withMods: mods };
}
// The Any tab's expression text, seeded from the selected key's value (and
// re-seeded when that value changes, unless the person has edited the text).
let pickerAnyText = "";
let pickerAnySeed = "";
let pickerSelectionId = null;
// Per-layer show/hide for the cheat sheet.
const cheatSheetVisibility = { nums: true, func: true, extra: true, mouse: true };

/**
 * One layer's keycode, per key index, preferring the live value read from
 * the device but falling back to the firmware-flashed default so the cheat
 * sheet is still useful before a device is ever connected. Returns
 * undefined for a layer this keyboard/layout doesn't have at all.
 */
function cheatSheetLayerKeycodes(layerSymbol) {
  const layerIndex = layerIndexBySymbol(layerSymbol);
  if (layerIndex < 0 || layerIndex >= store.layout.layerCount) return undefined;
  const live = store.layers[layerIndex];
  const defaults = store.defaults?.layers?.[layerIndex];
  if (!live && !defaults) return undefined;
  return store.layout.keys.map((_, keyIndex) => live?.[keyIndex] ?? defaults?.[keyIndex]);
}

function populateKeyboardSelect() {
  elements.keyboardSelect.replaceChildren(
    ...availableKeyboards().map(({ id, keyboard }) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = keyboard;
      return option;
    }),
  );
}

function selectKeyboard(keyboardId) {
  swapSource = null;
  store.setLayout(keyboardId, loadLayout(keyboardId), loadDefaults(keyboardId));
}

async function changeKeyboard() {
  const keyboardId = elements.keyboardSelect.value;
  if (store.drafts.size && !(await confirmDiscardDrafts("キーボードを切り替え"))) {
    elements.keyboardSelect.value = store.keyboardId;
    return;
  }
  selectKeyboard(keyboardId);
}

/**
 * Shows a styled Yes/No popup (see toolbar.js's renderConfirmDialog) in
 * #dialog-root and resolves true/false once the person picks an answer,
 * clicks the backdrop (= cancel), or closes it -- the async equivalent of
 * window.confirm, but styled like the rest of this app instead of the
 * browser's own dialog chrome.
 */
function confirmDialog(options) {
  return new Promise((resolve) => {
    const close = (result) => {
      elements.dialogRoot.replaceChildren();
      resolve(result);
    };
    elements.dialogRoot.replaceChildren();
    renderConfirmDialog(elements.dialogRoot, options, () => close(true), () => close(false));
  });
}

/**
 * Asks before an action that would throw away staged (unwritten) edits;
 * resolves true right away when there are none.
 */
function confirmDiscardDrafts(actionLabel) {
  if (!store.drafts.size) return Promise.resolve(true);
  return confirmDialog({
    heading: "未書き込みの変更を破棄",
    message: `実機に書き込んでいない変更が${store.drafts.size}件あります。破棄して${actionLabel}ますか？`,
    confirmLabel: "破棄する",
    danger: true,
  });
}

/**
 * Connecting a device whose keymap differs from what the editor shows (e.g.
 * the other half of a split keyboard, after editing the first half): let
 * the person keep the editor's keymap as drafts to write to this device.
 */
syncEngine.onKeymapMismatch = async (diffCount) => {
  const keep = await confirmDialog({
    heading: "接続した実機のキーマップが異なります",
    message: `エディタに表示中のキーマップと、接続した実機のキーマップが${diffCount}キー分異なります。`
      + "エディタの内容を残すと、差分を「未書き込みの変更」として保持し、「実機に書き込む」でこの実機に反映できます(左右のキーマップをそろえる場合など)。",
    confirmLabel: "エディタの内容を残す",
    cancelLabel: "実機の値を読み込む",
  });
  if (keep) {
    viewMode = "edit";
    draftStatus = `接続前のキーマップとの差分${diffCount}件を未書き込みの変更として保持しています。「実機に書き込む」でこの実機に反映します。`;
  } else {
    draftStatus = "";
  }
  return keep;
};

/**
 * The draft bar's 実機に書き込む is always pressable, so every outcome --
 * including "nothing to do" -- is reported, both in the draft bar and in
 * the デバイス group's status line.
 */
async function writeDrafts() {
  if (deviceBusy) return;
  const report = (message) => {
    draftStatus = message;
    elements.deviceActionStatus.textContent = message;
    render();
  };
  if (store.connectionState !== "connected") {
    report("実機に接続してから書き込んでください。");
    return;
  }
  if (!store.drafts.size) {
    report("書き込む変更はありません。キーの割り当てを変更してから押してください。");
    return;
  }
  deviceBusy = true;
  report("書き込み中…");
  try {
    const count = await syncEngine.writeDrafts(report);
    report(`${count}件の変更を実機に書き込みました。`);
  } catch (error) {
    console.error(error);
    report(error.message);
  } finally {
    deviceBusy = false;
    render();
  }
}

async function discardDrafts() {
  if (!(await confirmDiscardDrafts("元に戻し"))) return;
  draftStatus = "";
  store.clearDrafts();
}

async function reloadFromDevice() {
  if (!(await confirmDiscardDrafts("実機から再読込し"))) return;
  store.clearDrafts();
  await runDeviceAction(() => syncEngine.reloadAllLayers(), "実機から再読込しています…");
}

/** Stages a picked value for the selected key -- nothing is written until 実機に書き込む. */
function startSwap() {
  swapSource = { layer: store.activeLayer, keyIndex: store.selectedKeyIndex };
  store.setSelectedKeyIndex(null);
}

function cancelSwap() {
  swapSource = null;
  render();
}

/** Keyboard click: finishes a pending swap, else toggles the selection. */
function clickKey(keyIndex) {
  if (!swapSource) {
    // Clicking the selected key again deselects it.
    store.setSelectedKeyIndex(keyIndex === store.selectedKeyIndex ? null : keyIndex);
    return;
  }
  const source = swapSource;
  swapSource = null;
  if (source.layer === store.activeLayer && source.keyIndex === keyIndex) {
    render(); // clicking the source again cancels
    return;
  }
  store.swapKeys(source, { layer: store.activeLayer, keyIndex });
  store.setSelectedKeyIndex(keyIndex);
}

function stageSelectedKey(value) {
  draftStatus = "";
  store.setDraft(store.activeLayer, store.selectedKeyIndex, value);
}

/**
 * A value picked from the grids / layer actions / Any. Afterwards the
 * 長押し / 同時押し rows follow the new value (e.g. MO -> a plain key clears
 * MO), except while an LT/MT is still being set up (no layer / modifier
 * chosen yet), so that choice isn't lost.
 */
function pickSelectedKey(value) {
  const settingUp = (pickerHold.type === "lt" && pickerHold.layer === null)
    || (pickerHold.type === "mt" && isEmptyMods(pickerHold.mods));
  if (!settingUp) ({ hold: pickerHold, withMods: pickerWithMods } = pickerWrapOf(value));
  stageSelectedKey(value);
}

/**
 * 長押し row, type switch: なし unwraps an existing LT/MT back to its tap
 * key right away; LT/MT just reveal their layer chips / modifier checkboxes
 * (keeping the current layer or modifiers if the key already is one) -- the
 * key only changes once a layer is chosen or a modifier ticked.
 */
function selectHoldType(type) {
  const current = store.effectiveKeycodeAt(store.activeLayer, store.selectedKeyIndex);
  const existing = pickerWrapOf(current).hold;
  if (type === "none") {
    pickerHold = NO_HOLD;
    rewrapSelectedKey((value) => (existing.type === "none" ? null : withHoldLayer(value, null)));
    return;
  }
  pickerHold = existing.type === type ? existing : { ...NO_HOLD, type };
  render();
}

/**
 * Layer chip: for LT rewraps the tap key right away (Space + "Num" ->
 * LT(Num, Space)); for MO the key becomes MO(layer), dropping its tap key.
 */
function selectHoldLayer(layer) {
  const type = pickerHold.type === "mo" ? "mo" : "lt";
  pickerHold = { ...NO_HOLD, type, layer };
  pickerWithMods = { ...NO_MODS };
  rewrapSelectedKey((current) => (type === "mo" ? momentaryLayer(layer) : withHoldLayer(current, layer)));
}

/** MT checkboxes: e.g. A + Ctrl -> LCTL_T(KC_A); unticking all leaves the bare key. */
function changeHoldMods(mods) {
  pickerHold = { ...NO_HOLD, type: "mt", mods };
  pickerWithMods = { ...NO_MODS };
  rewrapSelectedKey((current) => withMods(current, mods, "tap"));
}

/** 同時押し checkboxes: e.g. PSCR + Alt -> LALT(KC_PSCR); drops any LT/MT. */
function changeWithMods(mods) {
  pickerWithMods = mods;
  if (mods.ctrl || mods.shift || mods.alt || mods.gui) pickerHold = NO_HOLD;
  rewrapSelectedKey((current) => withMods(current, mods, "with"));
}

function rewrapSelectedKey(rewrap) {
  const current = store.effectiveKeycodeAt(store.activeLayer, store.selectedKeyIndex);
  const rewrapped = current === undefined ? null : rewrap(current);
  if (rewrapped !== null && rewrapped !== current) stageSelectedKey(rewrapped);
  else render();
}

/** Update-to-latest only writes the layers main defines; say so when the device has more. */
function extraLayersNote() {
  const written = store.defaults.layers.length;
  if (!(store.layerCount > written)) return "";
  const last = store.layerCount - 1;
  return `実機のレイヤー${written === last ? written : `${written}〜${last}`}は変更されません。`;
}

async function updateToLatestLayout() {
  if (deviceBusy || store.connectionState !== "connected") return;
  if (store.pendingKeys.size) {
    elements.deviceActionStatus.textContent = "キーの書き込み完了後に再試行してください。";
    return;
  }
  deviceBusy = true;
  render();
  const progress = (message) => { elements.deviceActionStatus.textContent = message; };
  try {
    // store.defaults is this editor's own bundled copy of main's
    // default/keymap.c (scripts/build_defaults.py, loaded locally at
    // startup) -- the same data already shown in the cheat sheet before any
    // device connects, so there's nothing to fetch over the network.
    const confirmed = await confirmDialog({
      heading: "GitHub最新版レイアウトに更新",
      message: `現在のキーマップ${draftsNote()}が削除されて、mainの最新版（${store.defaults.layoutVersion}）に置き換わります。${extraLayersNote()}更新しますか？`,
      confirmLabel: "更新する",
      danger: true,
    });
    if (!confirmed) {
      progress("更新をキャンセルしました。");
      return;
    }
    store.clearDrafts();
    await syncEngine.updateToLatest(store.defaults.layers, progress);
    progress(`最新版 ${store.defaults.layoutVersion} への更新が完了しました。`);
  } catch (error) {
    progress(error.message);
  } finally {
    deviceBusy = false;
    render();
  }
}

async function resetToFirmwareDefaults() {
  const confirmed = await confirmDialog({
    heading: "ファームウェア初期状態にリセット",
    message: `現在のキーマップ${draftsNote()}が削除されて、ファームウェア書き込み時のレイアウトに元に戻ります。リセットしますか？`,
    confirmLabel: "リセットする",
    danger: true,
  });
  if (!confirmed) return;
  store.clearDrafts();
  await runDeviceAction(() => syncEngine.resetToFirmwareDefaults(), "ファームウェア初期状態に戻しています…");
}

const draftsNote = () => (store.drafts.size ? `（未書き込みの変更${store.drafts.size}件を含む）` : "");

async function runDeviceAction(action, message) {
  if (deviceBusy || store.connectionState !== "connected") return;
  if (store.pendingKeys.size) {
    elements.deviceActionStatus.textContent = "キーの書き込み完了後に再試行してください。";
    return;
  }
  deviceBusy = true;
  render();
  elements.deviceActionStatus.textContent = message;
  try {
    await action();
    elements.deviceActionStatus.textContent = "完了しました。";
  } catch (error) {
    elements.deviceActionStatus.textContent = error.message;
  } finally {
    deviceBusy = false;
    render();
  }
}

/**
 * Builds the offscreen "poster" version of the cheat sheet for PNG export:
 * the same .editor-card styling (padding, rounded corners, shadow) the page
 * itself uses, plus the keyboard name/layout version header stripped out of
 * the on-page layout -- so the exported image is self-describing rather
 * than a bare key grid with no keyboard/version label.
 */
function buildPngExportCard() {
  const card = document.createElement("div");
  card.className = "editor-card png-export-card";
  const paneStyle = getComputedStyle(elements.cheatSheetContainer.closest(".editor-card"));
  const horizontalPadding = parseFloat(paneStyle.paddingLeft) + parseFloat(paneStyle.paddingRight);
  card.style.width = `${elements.cheatSheetContainer.getBoundingClientRect().width + horizontalPadding}px`;

  const heading = document.createElement("div");
  heading.className = "section-heading";
  const title = document.createElement("h1");
  title.textContent = elements.keyboardName.textContent;
  const version = document.createElement("p");
  version.className = "layout-version";
  version.textContent = elements.layoutVersion.textContent;
  heading.append(title, version);

  const content = elements.cheatSheetContainer.cloneNode(true);
  content.hidden = false;
  content.removeAttribute("id");
  content.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));

  card.append(heading, content);
  return card;
}

/**
 * Rasterizes the current cheat sheet to PNG and hands the resulting blob to
 * `perform` (copy to clipboard, or trigger a download), reporting progress
 * and errors through the status line next to the PNG buttons.
 */
async function runPngExport({ perform, successMessage, errorMessage }) {
  elements.pngExportStatus.textContent = "PNGを生成しています…";
  // A page-background "stage" padded around the card, just enough for the
  // card's own drop shadow to fall off into instead of being clipped
  // exactly at the card's edge (which would read as an odd flat line) --
  // not a wide frame of empty space around the actual content.
  // The off-screen positioning goes on a separate outer wrapper, never on
  // the stage itself: renderElementToCanvas clones whatever element it's
  // given verbatim, and a cloned `position: fixed; left: -9999px` would
  // carry its offset into the exported image too, rendering blank.
  const stage = document.createElement("div");
  stage.style.padding = "16px";
  stage.style.background = "#f3f0e8";
  stage.append(buildPngExportCard());
  const offscreen = document.createElement("div");
  offscreen.style.position = "fixed";
  offscreen.style.top = "0";
  offscreen.style.left = "-9999px";
  offscreen.append(stage);
  document.body.append(offscreen);
  try {
    const canvas = await renderElementToCanvas(stage, { background: "#f3f0e8" });
    const blob = await canvasToPngBlob(canvas);
    await perform(blob);
    elements.pngExportStatus.textContent = successMessage;
  } catch (error) {
    console.error(error);
    elements.pngExportStatus.textContent = errorMessage;
  } finally {
    offscreen.remove();
  }
}

function render() {
  elements.keyboardName.textContent = `${store.layout.keyboard} Keymap${viewMode === "edit" ? " Editor" : ""}`;
  elements.layoutVersion.textContent = store.defaults?.layoutVersion ? `Layout ${store.defaults.layoutVersion}` : "";

  renderConnectionBar({
    status: elements.connectionStatus,
    toggle: elements.connectionToggle,
    info: elements.connectionInfo,
  }, store, {
    onConnect: () => syncEngine.connect().catch((error) => console.error(error)),
    onDisconnect: () => syncEngine.disconnect().catch((error) => console.error(error)),
  });

  renderModeAction(elements.modeAction, { mode: viewMode }, (mode) => {
    viewMode = mode;
    render();
  });
  // Each mode only shows its own settings groups (デバイス is shared).
  elements.modeSettingsGroups.forEach((group) => {
    group.hidden = group.dataset.mode !== viewMode;
  });
  elements.editView.hidden = viewMode !== "edit";
  elements.cheatSheetContainer.hidden = viewMode !== "cheatSheet";

  renderLayerToggles(
    elements.layerToggles,
    { visibility: cheatSheetVisibility, showMouseToggle: Boolean(store.layout.trackpad) },
    (key, checked) => {
      cheatSheetVisibility[key] = checked;
      render();
    },
  );
  elements.cheatLegendNumsItem.hidden = !cheatSheetVisibility.nums;
  elements.cheatLegendFuncItem.hidden = !cheatSheetVisibility.func;
  elements.cheatLegendExtraItem.hidden = !cheatSheetVisibility.extra;
  elements.cheatLegendMouseItem.hidden = !store.layout.trackpad || !cheatSheetVisibility.mouse;
  // Mouse click/move keycodes (MS_BTN*, KG_MSL/D/U/R, KG_MWLL/D/U/R) live on
  // the Fn layer on every keyboard, trackpad or not -- only the Trackpad
  // group's scroll/zoom modes are specific to the trackpad-only Auto Mouse
  // layer, so that's the sole group gated on store.layout.trackpad.
  elements.iconLegendMouseGroup.hidden = false;
  elements.iconLegendTrackpadGroup.hidden = !store.layout.trackpad;
  // The sample-key legend image's own corner labels follow the exact same
  // visibility rules as the text legend items above.
  elements.cheatGuideNums.hidden = elements.cheatLegendNumsItem.hidden;
  elements.cheatGuideFunc.hidden = elements.cheatLegendFuncItem.hidden;
  elements.cheatGuideExtra.hidden = elements.cheatLegendExtraItem.hidden;
  elements.cheatGuideMouse.hidden = elements.cheatLegendMouseItem.hidden;

  const layerCount = Math.min(store.layerCount ?? 0, store.layout.layerCount);

  if (viewMode === "cheatSheet") {
    renderCheatSheet(elements.cheatSheetView, {
      layout: store.layout,
      main: cheatSheetLayerKeycodes("KGL_MAIN"),
      nums: cheatSheetVisibility.nums ? cheatSheetLayerKeycodes("KGL_NUM") : undefined,
      func: cheatSheetVisibility.func ? cheatSheetLayerKeycodes("KGL_FUN") : undefined,
      extra: cheatSheetVisibility.extra ? cheatSheetLayerKeycodes("KGL_EXT") : undefined,
      mouse: store.layout.trackpad && cheatSheetVisibility.mouse ? cheatSheetLayerKeycodes("KGL_AM") : undefined,
    });
  }

  renderPngExportControls(elements.pngExportButtons, {
    onCopy: () => runPngExport({
      successMessage: "PNGをクリップボードにコピーしました",
      errorMessage: "PNGのコピーに失敗しました",
      perform: async (blob) => copyBlobToClipboard(blob),
    }),
    onDownload: () => runPngExport({
      successMessage: "PNGをダウンロードしました",
      errorMessage: "PNGのダウンロードに失敗しました",
      perform: async (blob) => downloadBlob(blob, `${store.keyboardId ?? store.layout.id}-keymap.png`),
    }),
  });

  renderLayerTabs(elements.layerTabs, {
    layerCount,
    activeLayer: store.activeLayer,
    hasDrafts: (layerIndex) => store.layerHasDrafts(layerIndex),
  }, (layerIndex) => {
    store.setActiveLayer(layerIndex);
  });

  renderKeyboardView(
    elements.keyboardView,
    {
      layout: store.layout,
      keycodes: store.layout.keys.map((_, keyIndex) => store.effectiveKeycodeAt(store.activeLayer, keyIndex)),
      selectedKeyIndex: store.selectedKeyIndex,
      swapSourceIndex: swapSource?.layer === store.activeLayer ? swapSource.keyIndex : null,
      isPending: (row, col) => store.isPending(store.activeLayer, row, col),
      isChangedFromLatest: (keyIndex) => store.isChangedFromLatest(store.activeLayer, keyIndex),
      isDraft: (keyIndex) => store.hasDraft(store.activeLayer, keyIndex),
    },
    clickKey,
  );

  renderDraftBar({ bar: elements.draftBar, panel: elements.draftPanel }, {
    drafts: store.draftEntries().map((draft) => ({
      ...draft,
      row: store.layout.keys[draft.keyIndex].matrix[0],
      col: store.layout.keys[draft.keyIndex].matrix[1],
      liveValue: store.keycodeAt(draft.layer, draft.keyIndex),
    })),
    busy: deviceBusy,
    status: draftStatus,
    listOpen: draftListOpen,
  }, {
    onToggleList: () => {
      draftListOpen = !draftListOpen;
      render();
    },
    onWrite: writeDrafts,
    onDiscard: discardDrafts,
    onRevertKey: (layer, keyIndex) => {
      draftStatus = "";
      store.clearDraft(layer, keyIndex);
    },
    onSelectKey: (layer, keyIndex) => {
      store.setActiveLayer(layer);
      store.setSelectedKeyIndex(keyIndex);
    },
  });

  if (viewMode === "edit" && store.selectedKeyIndex !== null && store.connectionState === "connected") {
    const layer = store.activeLayer;
    const keyIndex = store.selectedKeyIndex;
    const selectionId = `${store.keyboardId},${layer},${keyIndex}`;
    const current = store.effectiveKeycodeAt(layer, keyIndex);
    if (selectionId !== pickerSelectionId) {
      pickerSelectionId = selectionId;
      ({ hold: pickerHold, withMods: pickerWithMods } = pickerWrapOf(current));
      pickerAnyText = pickerAnySeed = "";
    }
    const seed = current === undefined ? "" : formatKeycodeToken(current);
    if (pickerAnyText === pickerAnySeed) pickerAnyText = seed;
    pickerAnySeed = seed;
    const [row, col] = store.layout.keys[keyIndex].matrix;
    renderKeyPicker(
      elements.keyPicker,
      {
        layerCount,
        activeCategory: pickerCategory,
        hold: pickerHold,
        withMods: pickerWithMods,
        anyText: pickerAnyText,
        selection: {
          layer, row, col,
          liveValue: store.keycodeAt(layer, keyIndex),
          draftValue: store.hasDraft(layer, keyIndex) ? store.effectiveKeycodeAt(layer, keyIndex) : undefined,
        },
      },
      {
        onPickValue: pickSelectedKey,
        onSelectHoldType: selectHoldType,
        onSelectHoldLayer: selectHoldLayer,
        onChangeHoldMods: changeHoldMods,
        onChangeWithMods: changeWithMods,
        onChangeAnyText: (text) => { pickerAnyText = text; },
        onRevertKey: () => store.clearDraft(layer, keyIndex),
        onStartSwap: startSwap,
        onSelectCategory: (category) => {
          pickerCategory = category;
          render();
        },
        onClose: () => store.setSelectedKeyIndex(null),
      },
    );
  } else {
    pickerSelectionId = null;
    if (swapSource && store.connectionState !== "connected") swapSource = null;
    if (swapSource) {
      const [row, col] = store.layout.keys[swapSource.keyIndex].matrix;
      const value = keycodeSummary(store.effectiveKeycodeAt(swapSource.layer, swapSource.keyIndex));
      renderKeyPickerNotice(elements.keyPicker, {
        message: `${layerName(swapSource.layer)} / row ${row}, col ${col}（${value}）と交換するキーをクリックしてください。レイヤーを切り替えて別のレイヤーのキーとも交換できます。`,
        actionLabel: "交換を中止 (Esc)",
        onAction: cancelSwap,
        secondary: true,
      });
    } else if (store.connectionState !== "connected") {
      renderKeyPickerNotice(elements.keyPicker, {
        message: "実機に接続すると、キーの割り当てを編集できます。",
        actionLabel: HidTransport.isSupported() && store.connectionState !== "connecting" ? "実機に接続" : null,
        onAction: () => syncEngine.connect().catch((error) => console.error(error)),
      });
    } else {
      renderKeyPickerNotice(elements.keyPicker, {
        message: "キーボード上のキーをクリックすると、ここで割り当てを変更できます。変更は「実機に書き込む」を押すまで実機に反映されません。",
      });
    }
  }

  renderDeviceActions(elements.deviceActions, { connected: store.connectionState === "connected" }, {
    onReload: reloadFromDevice,
  });

  renderEditActions(elements.editActions, { connected: store.connectionState === "connected" }, {
    onExport: () => {
      const source = formatKeymapCSource({ layers: store.layers, layoutMacroName: store.layout.layoutName });
      elements.dialogRoot.replaceChildren();
      renderExportDialog(elements.dialogRoot, source, () => elements.dialogRoot.replaceChildren());
    },
    onUpdateLatest: updateToLatestLayout,
    onReset: resetToFirmwareDefaults,
  });

  elements.keyboardSelect.disabled = deviceBusy;
  document.querySelector(".editor-shell").setAttribute("aria-busy", String(deviceBusy));
  if (deviceBusy) {
    document.querySelectorAll(".editor-shell button, .editor-shell input, .editor-shell select").forEach((control) => {
      control.disabled = true;
    });
  }
}

store.addEventListener("change", render);

// Pressing anywhere outside the keys, the picker, the staged-edit controls
// or a dialog deselects the key being edited. Captured on pointerdown, so
// the check sees the DOM before any click handler re-renders it.
const KEEP_SELECTION_AREAS = ".editor-key, #key-picker, #draft-bar, #draft-panel, #dialog-root";
// ...and, while choosing a swap partner, cancels the swap -- except on the
// layer tabs, which pick the partner's layer.
const KEEP_SWAP_AREAS = `${KEEP_SELECTION_AREAS}, #layer-tabs`;
document.addEventListener("pointerdown", (event) => {
  if (viewMode !== "edit") return;
  const target = event.target instanceof Element ? event.target : null;
  if (swapSource) {
    if (!target?.closest(KEEP_SWAP_AREAS)) cancelSwap();
    return;
  }
  if (store.selectedKeyIndex === null) return;
  if (target?.closest(KEEP_SELECTION_AREAS)) return;
  store.setSelectedKeyIndex(null);
}, true);

// Esc deselects the key being edited (unless a dialog is open, which
// handles its own dismissal).
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || viewMode !== "edit") return;
  if (elements.dialogRoot.childElementCount) return;
  if (swapSource) cancelSwap();
  else if (store.selectedKeyIndex !== null) store.setSelectedKeyIndex(null);
});

populateKeyboardSelect();
elements.keyboardSelect.addEventListener("change", changeKeyboard);
// Staged edits live only in this page, so warn before they're lost to a reload/close.
window.addEventListener("beforeunload", (event) => {
  if (store.drafts.size) event.preventDefault();
});
selectKeyboard(elements.keyboardSelect.value);

syncEngine.connectToPreviouslyGrantedDevice().catch((error) => console.error(error));
