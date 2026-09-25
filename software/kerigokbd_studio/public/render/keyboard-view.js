import { describeKeycode } from "../keycodes/keycode-format.js";
import { decode } from "../keycodes/keycode-codec.js";
import { canonicalEntryForValue } from "../keycodes/keycode-registry.js";

// Composed keycodes get a kind-* class so LT/MO/TO/MT/mods read apart at a
// glance; colors and the matching legend live in editor.css / index.html.
const KIND_CLASSES = {
  layerTap: "kind-layer-tap",
  momentaryLayer: "kind-momentary",
  toLayer: "kind-to",
  modTap: "kind-mod-tap",
  mods: "kind-mods",
};

function kindClass(value) {
  // A composed value with its own registered symbol (JP_EXLM = S(KC_1), ...)
  // is shown as that one key, so it isn't colored as a mods wrap.
  if (canonicalEntryForValue(value)) return null;
  return KIND_CLASSES[decode(value).kind] ?? null;
}
import { keyPosition, layoutExtent } from "./layout-geometry.js";

/**
 * Renders the physical keyboard for one layer into `container`, replacing
 * its previous contents. Every key is a clickable button; `onSelectKey` is
 * called with the key's index into layout.keys.
 */
export function renderKeyboardView(container, { layout, keycodes, selectedKeyIndex, isPending, isChangedFromLatest, isDraft }, onSelectKey) {
  const { columns, rows } = layoutExtent(layout);
  const unitX = 100 / columns;
  const unitY = 100 / rows;
  container.style.aspectRatio = `${columns} / ${rows}`;

  const fragment = document.createDocumentFragment();
  layout.keys.forEach((key, keyIndex) => {
    const position = keyPosition(key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "editor-key";
    button.style.left = `${position.x * unitX}%`;
    button.style.top = `${position.y * unitY}%`;
    button.style.width = `${key.width * unitX - 0.6}%`;
    button.style.height = `${key.height * unitY - 0.8}%`;
    if (key.rotation) {
      button.style.setProperty("--rotation", `${key.rotation}deg`);
      button.classList.add("is-rotated");
    }

    const value = keycodes?.[keyIndex];
    if (value === undefined) {
      button.classList.add("is-loading");
    } else {
      const { main, sub, empty, transparent } = describeKeycode(value);
      const mainLabel = document.createElement("span");
      mainLabel.className = "editor-key-main";
      // The TO box (editor.css) already says "switch to", so drop the
      // shared label's leading arrow here (the cheat sheet keeps it).
      mainLabel.textContent = decode(value).kind === "toLayer" ? main.replace(/^→/, "") : main;
      button.append(mainLabel);
      if (sub) {
        const subLabel = document.createElement("span");
        subLabel.className = "editor-key-sub";
        subLabel.textContent = sub;
        button.append(subLabel);
      }
      const kind = kindClass(value);
      if (kind) button.classList.add(kind);
      if (empty) button.classList.add("is-empty");
      if (transparent) button.classList.add("is-transparent");
    }

    const [row, col] = key.matrix;
    if (isPending?.(row, col)) button.classList.add("is-pending");
    if (keyIndex === selectedKeyIndex) button.classList.add("is-selected");
    const changedFromLatest = isChangedFromLatest?.(keyIndex) ?? false;
    if (changedFromLatest) button.classList.add("is-changed");
    const draft = isDraft?.(keyIndex) ?? false;
    if (draft) button.classList.add("is-draft");

    button.setAttribute("aria-label", `row ${row}, col ${col}${changedFromLatest ? ", GitHub最新版から変更" : ""}${draft ? ", 未書き込み" : ""}`);
    button.addEventListener("click", () => onSelectKey(keyIndex));
    fragment.append(button);
  });

  container.replaceChildren(fragment);
}
