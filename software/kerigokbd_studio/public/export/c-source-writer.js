// Converts the editor's in-memory keymap (raw 16-bit values read from the
// device) back into QMK C source, so a live-edited keymap can be pasted
// into keymap.c and committed to git. This is the only way to reconcile
// the two: VIA's dynamic keymap lives in the keyboard's EEPROM and is
// otherwise invisible to the repository.
//
// Values that exactly match one of kerigokbd.h's own `#define KG_X ...`
// aliases (KG_ESC, KG_NUM, KG_SPC, ...) are rendered as that alias, matching
// what the real keymap.c actually uses. For anything else, the output is
// functionally equivalent but not always byte-for-byte identical in style:
// mod combos are emitted as nested C(S(...)) calls rather than QMK's LCS()-
// style shorthands, and GUI mod-taps not covered by a KG_* alias are
// emitted as LGUI_T()/RGUI_T() rather than an LWIN_T()/RWIN_T() spelling --
// both compile to the exact same keycode, so this only affects how an
// unaliased mod-tap reads.

import { decode } from "../keycodes/keycode-codec.js";
import { canonicalEntryForValue, layerAt, macroAliasForValue } from "../keycodes/keycode-registry.js";

function formatBasicValue(value) {
  const entry = canonicalEntryForValue(value);
  if (entry) return entry.symbol;
  return `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;
}

function formatModWrap(mods, innerSymbol, { rightFns, leftFns }) {
  const fns = mods.right ? rightFns : leftFns;
  let symbol = innerSymbol;
  if (mods.gui) symbol = `${fns.gui}(${symbol})`;
  if (mods.alt) symbol = `${fns.alt}(${symbol})`;
  if (mods.shift) symbol = `${fns.shift}(${symbol})`;
  if (mods.ctrl) symbol = `${fns.ctrl}(${symbol})`;
  return symbol;
}

const LEFT_MOD_FNS = { ctrl: "C", shift: "S", alt: "A", gui: "G" };
const RIGHT_MOD_FNS = { ctrl: "RCTL", shift: "RSFT", alt: "RALT", gui: "RGUI" };
const LEFT_MOD_TAP_FNS = { ctrl: "LCTL_T", shift: "LSFT_T", alt: "LALT_T", gui: "LGUI_T" };
const RIGHT_MOD_TAP_FNS = { ctrl: "RCTL_T", shift: "RSFT_T", alt: "RALT_T", gui: "RGUI_T" };

function layerSymbol(layerIndex) {
  return layerAt(layerIndex)?.symbol ?? `/* layer ${layerIndex} */`;
}

function layerDescription(layerIndex) {
  return layerAt(layerIndex)?.description ?? "";
}

/** Renders one raw 16-bit keycode value as the C token(s) that produce it. */
export function formatKeycodeToken(value) {
  // Prefer kerigokbd.h's own short alias (KG_ESC, KG_NUM, KG_SPC, ...) when
  // one exists for this exact value: that's what the real keymap.c uses,
  // and it keeps composed values (layer-taps, mod-taps, layer switches)
  // from ballooning into long LT(KGL_EXT, KC_ESC)-style calls that would
  // blow out the keyboard-shaped column alignment below.
  const macroAlias = macroAliasForValue(value);
  if (macroAlias) return macroAlias;

  const descriptor = decode(value);
  if (descriptor.kind === "none") return "XXXXXXX";
  if (descriptor.kind === "transparent") return "_______";

  // Some composed values have their own single registered symbol -- most
  // notably kerigokbd's JP_* shift-combo aliases (JP_EXLM = S(KC_1), etc,
  // see keymap_japanese.h): show that one symbol instead of decomposing
  // and re-expanding it as e.g. "S(KC_1)". decode() only sees bit patterns
  // and can't know this, so the registry is checked here, after the
  // none/transparent special values (which are also registered symbols,
  // KC_NO/KC_TRANSPARENT, but must keep their XXXXXXX/_______ spelling)
  // and before layer actions or mod-taps (which are never registered as
  // flat entries, so this can't misfire on those).
  const registeredEntry = canonicalEntryForValue(value);
  if (registeredEntry) return registeredEntry.symbol;

  switch (descriptor.kind) {
    case "basic": return formatBasicValue(descriptor.value);
    case "mods":
      return formatModWrap(descriptor.mods, formatBasicValue(descriptor.keycode), {
        leftFns: LEFT_MOD_FNS, rightFns: RIGHT_MOD_FNS,
      });
    case "modTap": {
      const activeMods = Object.entries(descriptor.mods).filter(([key, on]) => key !== "right" && on);
      const fns = descriptor.mods.right ? RIGHT_MOD_TAP_FNS : LEFT_MOD_TAP_FNS;
      const base = formatBasicValue(descriptor.keycode);
      if (activeMods.length === 1) {
        return `${fns[activeMods[0][0]]}(${base})`;
      }
      // Multiple simultaneous mods on one mod-tap key: fall back to the
      // generic MT() form with an OR'd MOD_* mask (still valid QMK C).
      const modNames = activeMods.map(([key]) => `MOD_${descriptor.mods.right ? "R" : "L"}${key.slice(0, 3).toUpperCase()}`);
      return `MT(${modNames.join("|")}, ${base})`;
    }
    case "layerTap": return `LT(${layerSymbol(descriptor.layer)}, ${formatBasicValue(descriptor.keycode)})`;
    case "momentaryLayer": return `MO(${layerSymbol(descriptor.layer)})`;
    case "toLayer": return `TO(${layerSymbol(descriptor.layer)})`;
    case "defaultLayer": return `DF(${layerSymbol(descriptor.layer)})`;
    case "toggleLayer": return `TG(${layerSymbol(descriptor.layer)})`;
    case "oneShotLayer": return `OSL(${layerSymbol(descriptor.layer)})`;
    default: return formatBasicValue(value);
  }
}

const BASE_INDENT = 4;

/**
 * Parses "LAYOUT_split_6_7_7_4" into [6, 7, 7, 4] -- the number of keys per
 * hand on each printed row, which is also exactly the row/column shape
 * kerigokbd's own hand-written keymap.c aligns to (see kerigokbd_v2's
 * default/keymap.c). Returns null for any macro name that doesn't follow
 * this convention, so callers can fall back to an unstructured render.
 */
function parseSplitRowCounts(layoutMacroName) {
  const match = /^LAYOUT_split_(\d+(?:_\d+)*)$/.exec(layoutMacroName);
  return match ? match[1].split("_").map(Number) : null;
}

const MIN_TOKEN_WIDTH = 7; // "XXXXXXX" / "_______", the width keymap.c aligns to

/**
 * Where each token of a LAYOUT_split_A_B_... layer sits on the printed
 * grid: a hand ("left"/"right") and a column within that hand, out of
 * max(rowCounts) columns per hand. Finger rows (every row but the last)
 * leave their missing column(s) on the INNER side of each hand, next to
 * the "/**\/" gap; the last row (the thumb cluster, which really is offset
 * inward on the physical board) sits against the gap instead, with its
 * missing columns on the OUTER side.
 */
function splitCells(rowCounts) {
  const maxPerHand = Math.max(...rowCounts);
  const cells = [];
  rowCounts.forEach((perHand, row) => {
    const isLastRow = row === rowCounts.length - 1;
    const deficit = maxPerHand - perHand;
    for (let index = 0; index < perHand; index++) {
      cells.push({ row, hand: "left", column: isLastRow ? deficit + index : index });
    }
    for (let index = 0; index < perHand; index++) {
      cells.push({ row, hand: "right", column: isLastRow ? index : deficit + index });
    }
  });
  return { cells, maxPerHand };
}

/**
 * Per-column widths shared by every layer, so each column is only as wide
 * as its own longest token (min. MIN_TOKEN_WIDTH): one long token such as
 * LT(KGL_EXT, KC_ESC) widens just its own column instead of every column
 * of the whole keymap.
 */
function splitColumnWidths(tokensByLayer, rowCounts) {
  const { cells, maxPerHand } = splitCells(rowCounts);
  const widths = { left: Array(maxPerHand).fill(MIN_TOKEN_WIDTH), right: Array(maxPerHand).fill(MIN_TOKEN_WIDTH) };
  for (const tokens of tokensByLayer) {
    tokens.forEach((token, index) => {
      const { hand, column } = cells[index];
      widths[hand][column] = Math.max(widths[hand][column], token.length);
    });
  }
  return widths;
}

/**
 * Lays out one layer's tokens the way kerigokbd's keymap.c is hand-aligned:
 * one grid of columns per hand with a "/**\/" gap marker between them at
 * the same position on every row, so the source visually reads as the
 * keyboard's split shape (verified character-for-character against
 * kerigokbd_v2's default/keymap.c). Missing cells are blank-padded to their
 * column's width; each line's trailing blanks are trimmed, and the very
 * last token of the layer has no comma or padding, like the real file.
 */
function formatLayerRows(tokens, rowCounts, widths) {
  const { cells, maxPerHand } = splitCells(rowCounts);
  const grid = rowCounts.map(() => ({ left: Array(maxPerHand).fill(null), right: Array(maxPerHand).fill(null) }));
  tokens.forEach((token, index) => {
    const { row, hand, column } = cells[index];
    grid[row][hand][column] = { token, isLast: index === tokens.length - 1 };
  });
  const formatHand = (slots, hand) =>
    slots
      .map((slot, column) => {
        const width = widths[hand][column];
        if (!slot) return " ".repeat(width + 1);
        return slot.isLast ? slot.token : `${slot.token.padEnd(width)},`;
      })
      .join(" ");
  return grid.map(({ left, right }) =>
    `${" ".repeat(BASE_INDENT)}${formatHand(left, "left")} /**/ ${formatHand(right, "right")}`.trimEnd());
}

/** Renders one layer's `[LAYER] = LAYOUT_xxx(...)` block; `widths` from splitColumnWidths, when the shape matches. */
export function formatLayerBlock(layerIndex, tokens, layoutMacroName, widths = null) {
  const description = layerDescription(layerIndex);
  const header = `  [${layerSymbol(layerIndex)}] = ${layoutMacroName}(${description ? ` /* ${description} */` : ""}`;

  const rowCounts = parseSplitRowCounts(layoutMacroName);
  const lines = widths && rowCounts
    ? formatLayerRows(tokens, rowCounts, widths)
    : tokens.map((token, index) => `    ${token}${index === tokens.length - 1 ? "" : ","}`);

  return [header, ...lines, "  ),"].join("\n");
}

/** Renders the full `const uint16_t PROGMEM keymaps[][...][...] = {...};` block. */
export function formatKeymapCSource({ layers, layoutMacroName }) {
  const presentLayers = layers
    .map((keycodesByKeyIndex, layerIndex) => (keycodesByKeyIndex ? { layerIndex, keycodesByKeyIndex } : null))
    .filter((entry) => entry !== null);

  const tokensByLayer = presentLayers.map(({ keycodesByKeyIndex }) => keycodesByKeyIndex.map(formatKeycodeToken));
  // The hand-aligned grid only applies when every layer has exactly the
  // LAYOUT_split_A_B_... shape's key count; otherwise fall back to one
  // token per line rather than guess.
  const rowCounts = parseSplitRowCounts(layoutMacroName);
  const keyCount = rowCounts ? rowCounts.reduce((sum, count) => sum + count * 2, 0) : -1;
  const widths = rowCounts && tokensByLayer.every((tokens) => tokens.length === keyCount)
    ? splitColumnWidths(tokensByLayer, rowCounts)
    : null;

  const blocks = presentLayers.map(({ layerIndex }, index) =>
    formatLayerBlock(layerIndex, tokensByLayer[index], layoutMacroName, widths));

  return [
    "const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {",
    ...blocks,
    "};",
  ].join("\n");
}
