import { CATEGORIES, entriesByCategory } from "../keycodes/keycode-registry.js";
import { momentaryLayer, toLayer, defaultLayer, toggleLayer, layerTap } from "../keycodes/keycode-values.js";
import { LAYER_TAP_MAX_LAYERS, isLayerTapKeycode, isEmptyMods, encode, decode } from "../keycodes/keycode-codec.js";
import { keycodeSummary as keycodeText, layerName } from "../keycodes/keycode-format.js";
import { parseKeycodeExpression } from "../keycodes/keycode-parse.js";
import { formatKeycodeToken } from "../export/c-source-writer.js";

// Layer-switching actions are composed on the fly rather than looked up,
// since they depend on how many layers *this* device reports, not on a
// fixed table. Hold actions and mods wraps are composed separately: the
// 長押し row picks LT (hold to a layer + tap key, layer chips), MT (hold for
// modifiers + tap key, checkboxes) or MO (hold to a layer, no tap action,
// layer chips), the 同時押し row ticks modifiers sent
// with the key (LALT(KC_PSCR)); any basic key from the category grids then
// gets wrapped in whichever is active. The Any tab takes a raw value or a
// keymap.c-style expression for everything else.
// `kind` matches the keyboard view's kind-* colors (see editor.css).
const LAYER_ACTIONS = [
  { label: "押している間 (MO)", compose: momentaryLayer, kind: "momentary" },
  { label: "切り替え (TO)", compose: toLayer, kind: "to" },
  { label: "デフォルトに設定 (DF)", compose: defaultLayer },
  { label: "トグル (TG)", compose: toggleLayer },
];

const WRAP_ONLY_BASIC_TITLE = "LT・MT・修飾キー付きの割り当てには基本キーのみ指定できます";

const HOLD_TYPES = [
  { type: "none", label: "なし" },
  { type: "mo", label: "MO (レイヤーのみ)", kind: "momentary" },
  { type: "lt", label: "LT (タップ+レイヤー)", kind: "layer-tap" },
  { type: "mt", label: "MT (タップ+修飾キー)", kind: "mod-tap" },
];

const MOD_OPTIONS = [
  { key: "ctrl", label: "Ctrl" },
  { key: "shift", label: "Shift" },
  { key: "alt", label: "Alt" },
  { key: "gui", label: "Win" },
  { key: "right", label: "右側 (R)" },
];

/** Wraps a picked basic keycode in the active LT layer, MT modifiers or 同時押し modifiers, if any. */
function wrapKeycode(value, { hold, withMods }) {
  if (hold.type === "lt" && hold.layer !== null) return layerTap(hold.layer, value);
  if (hold.type === "mt" && !isEmptyMods(hold.mods)) return encode({ kind: "modTap", mods: hold.mods, keycode: value });
  if (!isEmptyMods(withMods)) return encode({ kind: "mods", mods: withMods, keycode: value });
  return value;
}

const isWrapping = ({ hold, withMods }) =>
  (hold.type === "lt" && hold.layer !== null) || (hold.type === "mt" && !isEmptyMods(hold.mods)) || !isEmptyMods(withMods);

function pickerButton(label, { title, current, disabled, kind, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "key-picker-item";
  if (kind) button.classList.add(`kind-${kind}`);
  button.classList.toggle("is-current", Boolean(current));
  button.textContent = label;
  if (title) button.title = title;
  button.disabled = Boolean(disabled);
  button.addEventListener("click", onClick);
  return button;
}

function renderLayerActionGrid(container, { layerCount, wrap, currentValue }, onPickValue) {
  const list = document.createElement("div");
  list.className = "layer-action-list";
  const wrapping = isWrapping(wrap);
  if (wrapping) {
    const note = document.createElement("p");
    note.className = "key-picker-note";
    note.textContent = "LT・MT・同時押しとレイヤー動作は組み合わせられません。長押しを「なし」、同時押しをすべてオフにしてから選んでください。";
    list.append(note);
  }
  for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
    const group = document.createElement("div");
    group.className = "layer-action-group";
    const heading = document.createElement("h4");
    heading.className = "layer-action-heading";
    heading.textContent = layerName(layerIndex);
    group.append(heading);

    const row = document.createElement("div");
    row.className = "layer-action-row";
    for (const action of LAYER_ACTIONS) {
      const value = action.compose(layerIndex);
      row.append(pickerButton(action.label, {
        current: value === currentValue,
        disabled: wrapping,
        kind: action.kind,
        onClick: () => onPickValue(value),
      }));
    }
    group.append(row);
    list.append(group);
  }
  container.append(list);
}

function renderEntryGrid(container, { category, wrap, currentValue }, onPickValue) {
  const grid = document.createElement("div");
  grid.className = "key-picker-grid";
  const wrapping = isWrapping(wrap);
  for (const entry of entriesByCategory(category)) {
    const usable = !wrapping || isLayerTapKeycode(entry.value);
    const value = usable ? wrapKeycode(entry.value, wrap) : entry.value;
    grid.append(pickerButton(entry.label || entry.symbol, {
      title: usable ? entry.symbol : `${entry.symbol}: ${WRAP_ONLY_BASIC_TITLE}`,
      current: usable && value === currentValue,
      disabled: !usable,
      onClick: () => onPickValue(value),
    }));
  }
  container.append(grid);
}

/** "Selected key: live value -> staged value" summary, plus a per-key revert. */
function renderSelectionSummary({ selection }, { onRevertKey }) {
  const summary = document.createElement("div");
  summary.className = "key-picker-summary";
  const text = document.createElement("p");
  text.className = "key-picker-summary-text";
  const position = `${layerName(selection.layer)} / row ${selection.row}, col ${selection.col}`;
  text.textContent = selection.draftValue === undefined
    ? `${position}：${keycodeText(selection.liveValue)}`
    : `${position}：${keycodeText(selection.liveValue)} → ${keycodeText(selection.draftValue)}（未書き込み）`;
  summary.append(text);
  if (selection.draftValue !== undefined) {
    const revert = document.createElement("button");
    revert.type = "button";
    revert.className = "key-picker-link";
    revert.textContent = "このキーの変更を取り消す";
    revert.addEventListener("click", onRevertKey);
    summary.append(revert);
  }
  return summary;
}

function renderModCheckboxes(row, mods, onChange) {
  for (const { key, label: text } of MOD_OPTIONS) {
    const option = document.createElement("label");
    option.className = "key-picker-mod";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = mods[key];
    checkbox.addEventListener("change", () => onChange({ ...mods, [key]: checkbox.checked }));
    option.append(checkbox, text);
    row.append(option);
  }
}

function rowLabel(text, kind) {
  const label = document.createElement("span");
  label.className = `key-picker-hold-label${kind ? ` kind-${kind}` : ""}`;
  label.textContent = text;
  return label;
}

/**
 * 長押し row: what holding the key does -- nothing, LT (hold to a layer,
 * picked from one chip per layer), MT (hold for modifiers, ticked as
 * checkboxes) or MO (hold to a layer, no tap action). Choosing a layer or
 * ticking a modifier changes the key right away; for LT/MT the picked key
 * from the grids becomes the tap action.
 */
function renderHoldRow({ layerCount, hold, currentValue }, { onSelectHoldType, onSelectHoldLayer, onChangeHoldMods }) {
  const row = document.createElement("div");
  row.className = "key-picker-hold";
  const activeKind = HOLD_TYPES.find(({ type }) => type === hold.type)?.kind;
  row.append(rowLabel("長押し", activeKind));

  const types = document.createElement("div");
  types.className = "key-picker-segmented";
  types.setAttribute("role", "radiogroup");
  types.setAttribute("aria-label", "長押しの動作");
  for (const { type, label, kind } of HOLD_TYPES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `key-picker-segment${kind ? ` kind-${kind}` : ""}`;
    button.classList.toggle("is-active", type === hold.type);
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(type === hold.type));
    button.textContent = label;
    button.addEventListener("click", () => onSelectHoldType(type));
    types.append(button);
  }
  row.append(types);

  if (hold.type === "lt" || hold.type === "mo") {
    const layers = document.createElement("div");
    layers.className = `key-picker-hold-options kind-${hold.type === "lt" ? "layer-tap" : "momentary"}`;
    // LT() only has 4 bits for the layer; MO() can address every layer.
    const maxLayers = hold.type === "lt" ? Math.min(layerCount, LAYER_TAP_MAX_LAYERS) : layerCount;
    for (let layerIndex = 0; layerIndex < maxLayers; layerIndex++) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "key-picker-chip";
      chip.classList.toggle("is-active", layerIndex === hold.layer);
      chip.setAttribute("aria-pressed", String(layerIndex === hold.layer));
      chip.textContent = layerName(layerIndex);
      chip.addEventListener("click", () => onSelectHoldLayer(layerIndex));
      layers.append(chip);
    }
    row.append(layers);
  } else if (hold.type === "mt") {
    const mods = document.createElement("div");
    mods.className = "key-picker-hold-options kind-mod-tap";
    renderModCheckboxes(mods, hold.mods, onChangeHoldMods);
    row.append(mods);
  }
  const hint = holdHint(hold, currentValue);
  if (hint) {
    const note = document.createElement("span");
    note.className = "key-picker-note";
    note.textContent = hint;
    row.append(note);
  }
  return row;
}

/** What's still missing for the chosen LT/MT/MO, if the key isn't one yet. */
function holdHint(hold, currentValue) {
  const kind = currentValue === undefined ? null : decode(currentValue).kind;
  if (hold.type === "lt" && kind !== "layerTap") {
    return hold.layer === null ? "レイヤーを選んでください" : "タップするキーを下から選んでください";
  }
  if (hold.type === "mt" && kind !== "modTap") {
    return isEmptyMods(hold.mods) ? "修飾キーを選んでください" : "タップするキーを下から選んでください";
  }
  if (hold.type === "mo" && kind !== "momentaryLayer") return "レイヤーを選んでください";
  return null;
}

/** 同時押し row: modifiers sent together with the key on every press, e.g. Alt + PSCR -> LALT(KC_PSCR). */
function renderWithModsRow({ withMods }, { onChangeWithMods }) {
  const row = document.createElement("div");
  row.className = "key-picker-mods kind-mods";
  row.append(rowLabel("同時押し", "mods"));
  renderModCheckboxes(row, withMods, onChangeWithMods);
  return row;
}

/**
 * Any tab: a raw value or keymap.c-style expression, previewed live as it's
 * typed (without a full re-render, so the input keeps focus); `onChangeText`
 * lets the caller keep the text across re-renders.
 */
function renderAnyInput(container, { anyText, currentValue }, { onPickValue, onChangeAnyText }) {
  const form = document.createElement("form");
  form.className = "key-picker-any";
  const note = document.createElement("p");
  note.className = "key-picker-note";
  note.textContent = "16進数(0x4329)や、keymap.cと同じ書式の式(KC_A, LT(KGL_EXT, KC_ESC), LALT(KC_PSCR), LCTL_T(KC_A), MT(MOD_LCTL | MOD_LSFT, KC_A), MO(1)など)で指定します。長押し・同時押しの行は使われません。";
  const row = document.createElement("div");
  row.className = "key-picker-any-row";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "key-picker-any-input";
  input.value = anyText;
  input.spellcheck = false;
  input.autocomplete = "off";
  input.setAttribute("aria-label", "キーコード");
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "primary-button";
  submit.textContent = "割り当てる";
  row.append(input, submit);
  const preview = document.createElement("p");
  preview.className = "key-picker-any-preview";
  preview.setAttribute("aria-live", "polite");

  let parsed = null;
  const update = () => {
    try {
      parsed = parseKeycodeExpression(input.value);
      preview.classList.remove("is-error");
      const hex = `0x${parsed.toString(16).toUpperCase().padStart(4, "0")}`;
      preview.textContent = `${hex} = ${formatKeycodeToken(parsed)}：${keycodeText(parsed)}${parsed === currentValue ? "（現在の値）" : ""}`;
    } catch (error) {
      parsed = null;
      preview.classList.add("is-error");
      preview.textContent = error.message;
    }
    submit.disabled = parsed === null;
  };
  input.addEventListener("input", () => {
    onChangeAnyText(input.value);
    update();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (parsed !== null) onPickValue(parsed);
  });
  update();

  form.append(note, row, preview);
  container.append(form);
}

const PICKER_TABS = [{ key: "layer_action", title: "レイヤー動作" }, ...CATEGORIES, { key: "any", title: "Any" }];

/**
 * Renders the keycode picker: the selected key's summary, the 長押し (LT/MT)
 * and 同時押し rows, a category tab strip, and a grid of pickable keycodes.
 * `onPickValue(rawValue)` fires as soon as one is chosen -- the caller only
 * stages it as a draft; nothing is written to the device from here.
 */
export function renderKeyPicker(container, state, handlers) {
  const { layerCount, activeCategory, hold, withMods, anyText, selection } = state;
  const wrap = { hold, withMods };
  const currentValue = selection.draftValue ?? selection.liveValue;
  const panel = document.createElement("div");
  panel.className = "key-picker";

  const header = document.createElement("div");
  header.className = "key-picker-header";
  const tabs = document.createElement("div");
  tabs.className = "key-picker-tabs";
  for (const category of PICKER_TABS) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "key-picker-tab";
    tab.classList.toggle("is-active", category.key === activeCategory);
    tab.textContent = category.title;
    tab.addEventListener("click", () => handlers.onSelectCategory(category.key));
    tabs.append(tab);
  }
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "key-picker-close";
  closeButton.textContent = "選択解除 (Esc)";
  closeButton.addEventListener("click", handlers.onClose);
  header.append(tabs, closeButton);
  panel.append(renderSelectionSummary(state, handlers), renderHoldRow({ ...state, currentValue }, handlers), renderWithModsRow(state, handlers), header);

  const body = document.createElement("div");
  body.className = "key-picker-body";
  if (activeCategory === "any") {
    renderAnyInput(body, { anyText, currentValue }, handlers);
  } else if (activeCategory === "layer_action") {
    renderLayerActionGrid(body, { layerCount, wrap, currentValue }, handlers.onPickValue);
  } else {
    renderEntryGrid(body, { category: activeCategory, wrap, currentValue }, handlers.onPickValue);
  }
  panel.append(body);

  container.replaceChildren(panel);
}

/**
 * What the picker area shows when there's nothing to pick for yet (not
 * connected, or no key selected), so the area never appears/disappears
 * and pushes the page around.
 */
export function renderKeyPickerNotice(container, { message, actionLabel, onAction }) {
  const notice = document.createElement("div");
  notice.className = "key-picker-notice";
  const text = document.createElement("p");
  text.textContent = message;
  notice.append(text);
  if (actionLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-button";
    button.textContent = actionLabel;
    button.addEventListener("click", onAction);
    notice.append(button);
  }
  container.replaceChildren(notice);
}
