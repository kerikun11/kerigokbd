import { CATEGORIES, entriesByCategory, layerAt, layerDisplayName } from "../keycodes/keycode-registry.js";
import { momentaryLayer, toLayer, defaultLayer, toggleLayer } from "../keycodes/keycode-values.js";

// Layer-switching actions are composed on the fly rather than looked up,
// since they depend on how many layers *this* device reports, not on a
// fixed table. LT()/MT() (which also need a base keycode) are intentionally
// left out of the picker for now -- decoding, on-key display and C export
// already understand them (see keycode-codec.js / c-source-writer.js),
// this just doesn't yet offer a two-step "pick layer, then pick base key"
// flow to compose a brand new one.
const LAYER_ACTIONS = [
  { label: "Hold (MO)", compose: momentaryLayer },
  { label: "Switch to (TO)", compose: toLayer },
  { label: "Set default (DF)", compose: defaultLayer },
  { label: "Toggle (TG)", compose: toggleLayer },
];

function renderLayerActionGrid(container, layerCount, onPickValue) {
  const list = document.createElement("div");
  list.className = "layer-action-list";
  for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
    const layer = layerAt(layerIndex);
    const name = layer ? layerDisplayName(layer.symbol) : `L${layerIndex}`;

    const group = document.createElement("div");
    group.className = "layer-action-group";
    const heading = document.createElement("h4");
    heading.className = "layer-action-heading";
    heading.textContent = name;
    group.append(heading);

    const row = document.createElement("div");
    row.className = "layer-action-row";
    for (const action of LAYER_ACTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "key-picker-item";
      button.textContent = action.label;
      button.addEventListener("click", () => onPickValue(action.compose(layerIndex)));
      row.append(button);
    }
    group.append(row);
    list.append(group);
  }
  container.append(list);
}

function renderEntryGrid(container, category, onPickValue) {
  const grid = document.createElement("div");
  grid.className = "key-picker-grid";
  for (const entry of entriesByCategory(category)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key-picker-item";
    button.textContent = entry.label || entry.symbol;
    button.title = entry.symbol;
    button.addEventListener("click", () => onPickValue(entry.value));
    grid.append(button);
  }
  container.append(grid);
}

const PICKER_TABS = [{ key: "layer_action", title: "レイヤー動作" }, ...CATEGORIES];

/**
 * Renders the keycode picker: a category tab strip plus a grid of pickable
 * keycodes. `onPickValue(rawValue)` fires as soon as one is chosen -- the
 * caller is responsible for writing it to the device and closing the
 * picker if desired.
 */
export function renderKeyPicker(container, { layerCount, activeCategory }, { onPickValue, onSelectCategory, onClose }) {
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
    tab.addEventListener("click", () => onSelectCategory(category.key));
    tabs.append(tab);
  }
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "key-picker-close";
  closeButton.textContent = "閉じる";
  closeButton.addEventListener("click", onClose);
  header.append(tabs, closeButton);
  panel.append(header);

  const body = document.createElement("div");
  body.className = "key-picker-body";
  if (activeCategory === "layer_action") {
    renderLayerActionGrid(body, layerCount, onPickValue);
  } else {
    renderEntryGrid(body, activeCategory, onPickValue);
  }
  panel.append(body);

  container.replaceChildren(panel);
}
