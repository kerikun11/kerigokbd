import { availableKeyboards, loadLayout } from "./layout/layout-loader.js";
import { loadDefaults } from "./layout/defaults-loader.js";
import { KeymapStore } from "./state/keymap-store.js";
import { SyncEngine } from "./state/sync-engine.js";
import { renderKeyboardView } from "./render/keyboard-view.js";
import { renderLayerTabs } from "./render/layer-tabs.js";
import { renderConnectionBar } from "./render/connection-bar.js";
import { renderKeyPicker } from "./render/key-picker.js";
import { renderDeviceActions, renderEditActions, renderExportDialog, renderConfirmDialog } from "./render/toolbar.js";
import { renderModeAction } from "./render/mode-action.js";
import { renderCheatSheet } from "./render/cheat-sheet.js";
import { renderLayerToggles } from "./render/layer-toggles.js";
import { renderPngExportControls } from "./render/png-export-controls.js";
import { formatKeymapCSource } from "./export/c-source-writer.js";
import { renderElementToCanvas, canvasToPngBlob, downloadBlob, copyBlobToClipboard } from "./export/png-export.js";
import { layerIndexBySymbol } from "./keycodes/keycode-registry.js";

const requiredElement = (selector) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Required element is missing: ${selector}`);
  return element;
};

const elements = {
  keyboardName: requiredElement("#editor-title"),
  layoutVersion: requiredElement("#layout-version"),
  keyboardSelect: requiredElement("#keyboard-select"),
  connectionBar: requiredElement("#connection-bar"),
  modeAction: requiredElement("#mode-action"),
  editView: requiredElement("#edit-view"),
  layerTabs: requiredElement("#layer-tabs"),
  keyboardView: requiredElement("#keyboard-view"),
  keyPicker: requiredElement("#key-picker"),
  cheatSheetContainer: requiredElement("#cheat-sheet-container"),
  cheatSheetView: requiredElement("#cheat-sheet-view"),
  cheatLegendNumsItem: requiredElement("#cheat-legend-nums-item"),
  cheatLegendFuncItem: requiredElement("#cheat-legend-func-item"),
  cheatLegendExtraItem: requiredElement("#cheat-legend-extra-item"),
  cheatLegendMouseItem: requiredElement("#cheat-legend-mouse-item"),
  iconLegendMouseClickGroup: requiredElement("#legend-group-mouse-click"),
  iconLegendMouseMoveGroup: requiredElement("#legend-group-mouse-move"),
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
  editActions: requiredElement("#edit-actions"),
  dialogRoot: requiredElement("#dialog-root"),
};

const store = new KeymapStore();
const syncEngine = new SyncEngine(store);
let pickerCategory = "letters_numbers";
let deviceBusy = false;
let viewMode = "cheatSheet"; // "cheatSheet" (default landing) | "edit"
// Per-layer show/hide for the cheat sheet, matching keymap_viewer's toggles.
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
  store.setLayout(keyboardId, loadLayout(keyboardId), loadDefaults(keyboardId));
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
    // store.defaults/store.layout are this editor's own bundled copy of
    // main's default/keymap.c, loaded locally at startup -- this page is
    // itself published to GitHub Pages from main, so there's nothing to
    // fetch: the page already IS "the latest main version".
    const confirmed = await confirmDialog({
      heading: "最新版レイアウトに更新",
      message: `現在のキーマップが削除されて、mainの最新版（${store.defaults.layoutVersion}）に置き換わります。更新しますか？`,
      confirmLabel: "更新する",
      danger: true,
    });
    if (!confirmed) {
      progress("更新をキャンセルしました。");
      return;
    }
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
    message: "現在のキーマップが削除されて、ファームウェア書き込み時のレイアウトに元に戻ります。リセットしますか？",
    confirmLabel: "リセットする",
    danger: true,
  });
  if (!confirmed) return;
  await runDeviceAction(() => syncEngine.resetToFirmwareDefaults(), "ファームウェア初期状態に戻しています…");
}

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
 * the on-page layout -- matching keymap_viewer's PNG output, which draws
 * that same header onto its canvas rather than exporting a bare key grid.
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
  elements.keyboardName.textContent = `${store.layout.keyboard} Studio`;
  elements.layoutVersion.textContent = store.defaults?.layoutVersion ? `Layout ${store.defaults.layoutVersion}` : "";

  renderConnectionBar(elements.connectionBar, store, {
    onConnect: () => syncEngine.connect().catch((error) => console.error(error)),
    onDisconnect: () => syncEngine.disconnect().catch((error) => console.error(error)),
  });

  renderModeAction(elements.modeAction, { mode: viewMode }, (mode) => {
    viewMode = mode;
    render();
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
  elements.iconLegendMouseClickGroup.hidden = false;
  elements.iconLegendMouseMoveGroup.hidden = false;
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

  renderPngExportControls(elements.pngExportButtons, { enabled: viewMode === "cheatSheet" }, {
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

  renderLayerTabs(elements.layerTabs, { layerCount, activeLayer: store.activeLayer }, (layerIndex) => {
    store.setActiveLayer(layerIndex);
  });

  renderKeyboardView(
    elements.keyboardView,
    {
      layout: store.layout,
      keycodes: store.layers[store.activeLayer],
      selectedKeyIndex: store.selectedKeyIndex,
      isPending: (row, col) => store.isPending(store.activeLayer, row, col),
      isChanged: (keyIndex) => store.isChangedFromDefault(store.activeLayer, keyIndex),
    },
    (keyIndex) => store.setSelectedKeyIndex(keyIndex),
  );

  if (viewMode === "edit" && store.selectedKeyIndex !== null && store.connectionState === "connected") {
    renderKeyPicker(
      elements.keyPicker,
      { layerCount, activeCategory: pickerCategory },
      {
        onPickValue: (value) => {
          syncEngine.writeKeycode(store.activeLayer, store.selectedKeyIndex, value).catch((error) => console.error(error));
        },
        onSelectCategory: (category) => {
          pickerCategory = category;
          render();
        },
        onClose: () => store.setSelectedKeyIndex(null),
      },
    );
    elements.keyPicker.hidden = false;
  } else {
    elements.keyPicker.hidden = true;
    elements.keyPicker.replaceChildren();
  }

  renderDeviceActions(elements.deviceActions, { connected: store.connectionState === "connected" }, {
    onReload: () => runDeviceAction(() => syncEngine.reloadAllLayers(), "実機から再読込しています…"),
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

populateKeyboardSelect();
elements.keyboardSelect.addEventListener("change", () => selectKeyboard(elements.keyboardSelect.value));
selectKeyboard(elements.keyboardSelect.value);

syncEngine.connectToPreviouslyGrantedDevice().catch((error) => console.error(error));
