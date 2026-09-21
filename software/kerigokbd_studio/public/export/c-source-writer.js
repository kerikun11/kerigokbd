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

/**
 * Lays out one layer's tokens the way kerigokbd's keymap.c is hand-aligned:
 * a "/**\/" gap marker between the two hands at the same column on every
 * row, so the source visually reads as the keyboard's split shape.
 *
 * Two different treatments, both verified character-for-character against
 * kerigokbd_v2's default/keymap.c:
 * - Finger rows (every row but the last) are left-aligned at the base
 *   indent even when shorter than the widest row; the "missing" column(s)
 *   are padded in on BOTH sides of the gap, so every finger row -- and the
 *   gap position itself -- lines up to the exact same total width.
 * - The last row (the thumb cluster, which really is offset further right
 *   on the physical board) instead gets extra LEADING indent equal to the
 *   deficit, and its right half starts right after the gap with no extra
 *   padding -- it does not try to match the finger rows' total width.
 */
function formatLayerRows(tokens, rowCounts, tokenWidth) {
  const columnWidth = tokenWidth + 2; // token + "," + one separator space
  const maxPerHand = Math.max(...rowCounts);
  const gapColumn = BASE_INDENT + maxPerHand * columnWidth;

  // The very last token of the whole layer (the last row's right half,
  // when it has no trailing comma) isn't padded either -- there's nothing
  // after it left to align with, and the real keymap.c doesn't pad it.
  const formatHalf = (halfTokens, keepLastComma) =>
    halfTokens
      .map((token, index) => {
        const isLastToken = index === halfTokens.length - 1;
        if (isLastToken && !keepLastComma) return token;
        return token.padEnd(tokenWidth) + ",";
      })
      .join(" ");

  const lines = [];
  let cursor = 0;
  rowCounts.forEach((perHand, rowIndex) => {
    const isLastRow = rowIndex === rowCounts.length - 1;
    const deficit = maxPerHand - perHand;
    const rowTokens = tokens.slice(cursor, cursor + perHand * 2);
    cursor += perHand * 2;

    const indentWidth = isLastRow ? BASE_INDENT + deficit * columnWidth : BASE_INDENT;
    let leftPart = formatHalf(rowTokens.slice(0, perHand), true);
    leftPart += isLastRow
      ? " ".repeat(Math.max(gapColumn - indentWidth - leftPart.length, 1))
      : " ".repeat(1 + deficit * columnWidth);
    const rightGapPad = isLastRow ? "" : " ".repeat(deficit * columnWidth);
    const rightPart = rightGapPad + formatHalf(rowTokens.slice(perHand), !isLastRow);

    lines.push(`${" ".repeat(indentWidth)}${leftPart}/**/ ${rightPart}`);
  });
  return lines;
}

/** Renders one layer's `[LAYER] = LAYOUT_xxx(...)` block. */
export function formatLayerBlock(layerIndex, tokens, layoutMacroName, tokenWidth) {
  const description = layerDescription(layerIndex);
  const header = `  [${layerSymbol(layerIndex)}] = ${layoutMacroName}(${description ? ` /* ${description} */` : ""}`;

  const rowCounts = parseSplitRowCounts(layoutMacroName);
  const shapeMatches = rowCounts && rowCounts.reduce((sum, count) => sum + count * 2, 0) === tokens.length;
  const lines = shapeMatches
    ? formatLayerRows(tokens, rowCounts, tokenWidth)
    : tokens.map((token, index) => `    ${token}${index === tokens.length - 1 ? "" : ","}`);

  return [header, ...lines, "  ),"].join("\n");
}

/** Renders the full `const uint16_t PROGMEM keymaps[][...][...] = {...};` block. */
export function formatKeymapCSource({ layers, layoutMacroName }) {
  const presentLayers = layers
    .map((keycodesByKeyIndex, layerIndex) => (keycodesByKeyIndex ? { layerIndex, keycodesByKeyIndex } : null))
    .filter((entry) => entry !== null);

  const tokensByLayer = presentLayers.map(({ keycodesByKeyIndex }) => keycodesByKeyIndex.map(formatKeycodeToken));
  const tokenWidth = Math.max(7, ...tokensByLayer.flat().map((token) => token.length));

  const blocks = presentLayers.map(({ layerIndex }, index) =>
    formatLayerBlock(layerIndex, tokensByLayer[index], layoutMacroName, tokenWidth));

  return [
    "const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {",
    ...blocks,
    "};",
  ].join("\n");
}
