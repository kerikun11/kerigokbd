import { keyPosition, layoutExtent } from "./layout-geometry.js";
import { describeCheatSheetKey } from "../keycodes/cheat-sheet-labels.js";
import { iconForLabel, compoundIconsForLabel } from "../keycodes/cheat-sheet-icons.js";

const SVG_NS = "http://www.w3.org/2000/svg";
// Matches index.html's <symbol> viewBoxes: the mouse/wheel body icons are
// drawn on a 16x16 grid, the rest (scroll/zoom/delete/
// windows/numpad) on 24x24.
const LARGE_VIEW_BOX_ICONS = new Set(["scroll", "zoom", "delete", "windows", "numpad", "volume-up", "volume-down"]);
const EMPHASIZED_ICONS = new Set(["scroll", "zoom", "volume-up", "volume-down"]);

function createIcon(name) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.classList.add("operation-icon");
  if (EMPHASIZED_ICONS.has(name)) svg.classList.add("operation-icon-emphasized");
  svg.setAttribute("viewBox", LARGE_VIEW_BOX_ICONS.has(name) ? "0 0 24 24" : "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `#icon-${name}`);
  svg.append(use);
  return svg;
}

// One shared size scale: a single character reads at full size, 2+
// characters step down a notch (".is-long") -- keeps a lone digit and a
// word like "Reserved" both legible without the whole cheat sheet needing
// a different font-size per corner. Hold opts out (see its own CSS
// comment): it's always the same size everywhere, including the trackpad.
//
// Japanese labels (半角/全角, 変換, 無変換 -- see keycode-format.js's
// PRINTABLE_SYMBOL_LABELS) read visually larger than Latin text at the same
// font-size, since kanji/kana glyphs fill more of their character box --
// ".is-japanese" steps them down an extra notch so they balance against
// the Latin labels around them instead of dominating the key.
const JAPANESE_TEXT = /[぀-ヿ㐀-鿿]/;

function appendOverlay(cell, className, text, { extraClass, sizeByLength = true } = {}) {
  if (!text) return;
  const span = document.createElement("span");
  const classes = [className];
  if (extraClass) classes.push(extraClass);
  if (sizeByLength && text.length >= 2) classes.push("is-long");
  if (JAPANESE_TEXT.test(text)) classes.push("is-japanese");
  span.className = classes.join(" ");
  const compound = compoundIconsForLabel(text);
  const icon = compound ? null : iconForLabel(text);
  if (compound) {
    span.classList.add("has-icon");
    compound.forEach(({ icon: name }) => span.append(createIcon(name)));
  } else if (icon) {
    span.classList.add("has-icon");
    span.append(createIcon(icon.icon));
    if (icon.arrow) {
      // A plain element, not a bare text node, so editor.css can pull it
      // right up against the icon (a raw text node can't be targeted).
      const arrow = document.createElement("span");
      arrow.className = "icon-arrow";
      arrow.textContent = icon.arrow;
      span.append(arrow);
    }
  } else if (text === "Backspace") {
    span.append("Back", document.createElement("br"), "Space");
  } else if (text === "Alt+PrSc") {
    span.append("Alt+", document.createElement("br"), "PrSc");
  } else if (text === "Ctrl+Alt+Del") {
    span.classList.add("is-cad");
    span.append("Ctrl+Alt", document.createElement("br"), "+Del");
  } else {
    span.textContent = text;
  }
  cell.append(span);
}

/**
 * The two matrix positions a trackpad-equipped board (kerigokbd_v2) reuses
 * underneath the trackpad still carry real keycodes (VIA still addresses
 * them), but there's no physical switch there -- so they're drawn as one
 * circular trackpad instead of two key cards. There's nothing to edit here
 * (VIA has no trackpad-specific settings), so this is cheat-sheet-only; the
 * edit view still shows both matrix positions as ordinary keys.
 */
function createTrackpadElement(trackpad, unitX, unitY) {
  const element = document.createElement("div");
  element.className = "cheat-trackpad";
  element.style.left = `${trackpad.x * unitX}%`;
  element.style.top = `${trackpad.y * unitY}%`;
  element.style.width = `${trackpad.width * unitX}%`;

  const main = document.createElement("div");
  main.className = "cheat-trackpad-main";
  main.append(createIcon("mouse-left"));

  const label = document.createElement("div");
  label.className = "cheat-trackpad-label";
  label.textContent = "Trackpad";

  const hold = document.createElement("div");
  hold.className = "cheat-trackpad-hold";
  hold.textContent = "Trackpad";

  element.append(main, label, hold);
  return element;
}

/**
 * Renders the whole keyboard read-only, with every relevant layer's action
 * on each key shown at once: Main near the top, Extra vertically centered
 * (its own "Escape reference" slot), Num bottom-left, Fn bottom-right,
 * Trackpad bottom-center -- only on keyboards with a trackpad -- and Hold
 * along the very bottom edge with a divider line above it, at a fixed
 * position regardless of what else is on the key (editor.css shifts
 * Num/Fn/Trackpad up out of its way via the .has-hold class rather than
 * this module tracking layout).
 */
export function renderCheatSheet(container, { layout, main, nums, func, extra, mouse }) {
  const { columns, rows } = layoutExtent(layout);
  const unitX = 100 / columns;
  const unitY = 100 / rows;
  container.style.aspectRatio = `${columns} / ${rows}`;

  const trackpadMatrixIds = new Set((layout.trackpad?.replaces ?? []).map(([row, col]) => `${row},${col}`));

  const fragment = document.createDocumentFragment();
  layout.keys.forEach((key, keyIndex) => {
    if (trackpadMatrixIds.has(key.matrix.join(","))) return; // drawn as part of the trackpad circle below

    const position = keyPosition(key);
    const cell = document.createElement("div");
    cell.className = "cheat-key";
    cell.style.left = `${position.x * unitX}%`;
    cell.style.top = `${position.y * unitY}%`;
    cell.style.width = `${key.width * unitX - 0.6}%`;
    cell.style.height = `${key.height * unitY - 0.8}%`;
    if (key.rotation) {
      cell.style.setProperty("--rotation", `${key.rotation}deg`);
      cell.classList.add("is-rotated");
    }

    const described = describeCheatSheetKey({
      main: main?.[keyIndex],
      nums: nums?.[keyIndex],
      func: func?.[keyIndex],
      extra: extra?.[keyIndex],
      mouse: mouse?.[keyIndex],
    });

    appendOverlay(cell, "cheat-key-main", described.main);
    if (described.empty) cell.classList.add("is-empty");
    if (described.transparent) cell.classList.add("is-transparent");
    appendOverlay(cell, "cheat-key-main-shift", described.mainShift);
    appendOverlay(cell, "cheat-key-extra", described.extra);
    if (described.hold) cell.classList.add("has-hold"); // shifts Num/Fn/Trackpad up, see editor.css
    appendOverlay(cell, "cheat-key-nums", described.nums);
    appendOverlay(cell, "cheat-key-func", described.func);
    appendOverlay(cell, "cheat-key-mouse", described.mouse);
    appendOverlay(cell, "cheat-key-hold", described.hold, {
      extraClass: described.holdColor ? `hold-${described.holdColor}` : null,
      sizeByLength: false,
    });

    fragment.append(cell);
  });

  if (layout.trackpad) fragment.append(createTrackpadElement(layout.trackpad, unitX, unitY));

  container.replaceChildren(fragment);
}
