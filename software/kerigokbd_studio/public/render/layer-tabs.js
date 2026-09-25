import { layerAt, layerDisplayName } from "../keycodes/keycode-registry.js";

/** Renders one tab button per layer the device actually exposes. */
export function renderLayerTabs(container, { layerCount, activeLayer, hasDrafts }, onSelectLayer) {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < layerCount; index++) {
    const layer = layerAt(index);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "layer-tab";
    button.classList.toggle("is-active", index === activeLayer);
    button.textContent = layer ? layerDisplayName(layer.symbol) : `L${index}`;
    if (hasDrafts?.(index)) {
      button.classList.add("has-drafts");
      button.title = "未書き込みの変更あり";
    }
    button.addEventListener("click", () => onSelectLayer(index));
    fragment.append(button);
  }
  container.replaceChildren(fragment);
}
