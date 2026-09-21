import { describeKeycode } from "../keycodes/keycode-format.js";
import { keyPosition, layoutExtent } from "./layout-geometry.js";

/**
 * Renders the physical keyboard for one layer into `container`, replacing
 * its previous contents. Every key is a clickable button; `onSelectKey` is
 * called with the key's index into layout.keys.
 */
export function renderKeyboardView(container, { layout, keycodes, selectedKeyIndex, isPending, isChanged }, onSelectKey) {
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
      mainLabel.textContent = main;
      button.append(mainLabel);
      if (sub) {
        const subLabel = document.createElement("span");
        subLabel.className = "editor-key-sub";
        subLabel.textContent = sub;
        button.append(subLabel);
      }
      if (empty) button.classList.add("is-empty");
      if (transparent) button.classList.add("is-transparent");
    }

    const [row, col] = key.matrix;
    if (isPending?.(row, col)) button.classList.add("is-pending");
    if (keyIndex === selectedKeyIndex) button.classList.add("is-selected");
    const changed = isChanged?.(keyIndex) ?? false;
    if (changed) button.classList.add("is-changed");

    button.setAttribute("aria-label", `row ${row}, col ${col}${changed ? ", 初期状態から変更済み" : ""}`);
    button.addEventListener("click", () => onSelectKey(keyIndex));
    fragment.append(button);
  });

  container.replaceChildren(fragment);
}
