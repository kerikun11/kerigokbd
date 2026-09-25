// Turns a raw 16-bit keycode value into a short {main, sub} label pair for
// on-key display: a two-line "main label + small hold/layer label"
// convention for held keys.
//
// Two callers want different trade-offs from the same decoded value:
// - The editor's live keyboard view (keyboard-view.js) prizes precision --
//   it's editing the real device, so a mod-tap shows the spelled-out
//   function name (LALT, RWIN, ...) and a symbol key shows its keymap.c
//   suffix (EXLM), never a symbol that could be misread.
// - The cheat sheet (cheat-sheet-labels.js) is a printable reference --
//   it prizes glanceability and never uses icons/glyphs for a modifier
//   name, so a mod-tap's hold badge and a bare modifier-wrapped tap action
//   both show a plain, readable word ("Alt", "Alt+1") with no L/R prefix
//   (nobody reads either as specifically the *left* Alt key), and a symbol
//   key shows the actual printable character (!) instead of its QMK name.
// Both are the same underlying decode; only the leaf formatting differs,
// via the `modLabelStyle`/`symbolStyle` options below.

import { decode } from "./keycode-codec.js";
import { canonicalEntryForValue, layerAt, layerDisplayName } from "./keycode-registry.js";

// kerigokbd's own keymap.c consistently spells the GUI/Super/Cmd modifier
// "WIN" (LWIN_T, RWIN_T), matching keycode-registry.js's own alias
// preference -- see build_keycodes.py's preferred_symbol().
const MOD_ABBR = { ctrl: "CTL", shift: "SFT", alt: "ALT", gui: "WIN" };
// Cheat-sheet ("word") style: no L/R prefix, spelled out in full.
const MOD_WORDS = { ctrl: "Ctrl", shift: "Shift", alt: "Alt", gui: "Win" };

function modsTextLabel(mods) {
  const side = mods.right ? "R" : "L";
  return ["ctrl", "shift", "alt", "gui"].filter((key) => mods[key]).map((key) => `${side}${MOD_ABBR[key]}`).join("+");
}

function modsWordLabel(mods) {
  return ["ctrl", "shift", "alt", "gui"].filter((key) => mods[key]).map((key) => MOD_WORDS[key]).join("+");
}

// On-key labels show the raw symbol suffix (KC_ESC -> "ESC") rather than a
// prettified name (-> "Esc"), so the label matches what's actually written
// in keymap.c at a glance. `symbolStyle: "printable"` swaps this for a more
// readable cheat-sheet label: the actual character a symbol key types
// (JP_EXLM -> "!"), an icon-friendly arrow character, or a short spelled-out
// word (KC_LCTL -> "Ctrl").
const KNOWN_SYMBOL_PREFIXES = /^(KC_|JP_|MS_|RGB_|RM_|QK_|KG_)/;
const PRINTABLE_SYMBOL_LABELS = {
  JP_MINS: "-", JP_COMM: ",", JP_DOT: ".", JP_SLSH: "/",
  JP_EXLM: "!", JP_DQUO: "\"", JP_HASH: "#", JP_DLR: "$",
  JP_PERC: "%", JP_AMPR: "&", JP_QUOT: "'", JP_EQL: "=",
  JP_TILD: "~", JP_PIPE: "|", JP_GRV: "`", JP_AT: "@",
  JP_SCLN: ";", JP_COLN: ":", JP_UNDS: "_", JP_CIRC: "^",
  JP_PLUS: "+", JP_ASTR: "*", JP_BSLS: "\\",
  JP_LPRN: "(", JP_RPRN: ")", JP_LCBR: "{", JP_RCBR: "}",
  JP_LBRC: "[", JP_RBRC: "]",
  KC_MINS: "-", KC_EQL: "=", KC_LBRC: "[", KC_RBRC: "]", KC_BSLS: "\\",
  KC_SCLN: ";", KC_QUOT: "'", KC_GRV: "`", KC_COMM: ",", KC_DOT: ".", KC_SLSH: "/",
  // Arrow/d-pad keys -- cheat-sheet.js swaps each of these arrow characters
  // for a rotated copy of the same SVG arrow icon (see cheat-sheet-icons.js).
  KC_LEFT: "⬅", KC_DOWN: "⬇", KC_UP: "⬆", KC_RGHT: "➡",
  // Modifier/whitespace/navigation keys assigned directly (not through a
  // mod-tap or mods wrap) read better spelled out than as raw suffixes.
  KC_LCTL: "Ctrl", KC_RCTL: "Ctrl", KC_LSFT: "Shift", KC_RSFT: "Shift",
  KC_LALT: "Alt", KC_RALT: "Alt", KC_LWIN: "Win", KC_RWIN: "Win",
  KC_ENT: "Enter", KC_ESC: "Esc", KC_SPC: "Space", KC_TAB: "Tab",
  KC_HOME: "Home", KC_END: "End", KC_PGUP: "PgUp", KC_PGDN: "PgDn",
  KC_CAPS: "Caps", KC_NUM: "NumLock", KC_SLEP: "Sleep",
  KC_DEL: "Delete", KC_BSPC: "Backspace", KC_PSCR: "PrSc",
  // JIS IME keys read better as their actual Japanese key-top labels than
  // as QMK's ZKHK/HENK/MHEN suffixes.
  JP_ZKHK: "半角/全角", JP_HENK: "変換", JP_MHEN: "無変換",
};

function basicLabel(value, symbolStyle) {
  const entry = canonicalEntryForValue(value);
  if (!entry) return `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;
  if (symbolStyle === "printable" && PRINTABLE_SYMBOL_LABELS[entry.symbol]) {
    return PRINTABLE_SYMBOL_LABELS[entry.symbol];
  }
  return entry.symbol.replace(KNOWN_SYMBOL_PREFIXES, "");
}

export function layerName(layerIndex) {
  const layer = layerAt(layerIndex);
  return layer ? layerDisplayName(layer.symbol) : `L${layerIndex}`;
}

/**
 * @param {number} value raw 16-bit keycode.
 * @param {{modLabelStyle?: "text"|"word", symbolStyle?: "suffix"|"printable"}} [options]
 *   `modLabelStyle` ("text" by default) picks LALT vs Alt for modifiers;
 *   `symbolStyle` ("suffix" by default) picks EXLM vs ! for symbol keys.
 */
export function describeKeycode(value, { modLabelStyle = "text", symbolStyle = "suffix" } = {}) {
  const descriptor = decode(value);
  if (descriptor.kind === "none") return { main: "", sub: null, empty: true };
  if (descriptor.kind === "transparent") return { main: "▽", sub: null, transparent: true };

  // Some composed values have their own single registered symbol -- most
  // notably kerigokbd's JP_* shift-combo aliases (JP_GRV = S(JP_AT), etc,
  // see keymap_japanese.h): show that one JP-side symbol instead of
  // decomposing and re-showing it as a generic "Shift+AT". decode() only
  // sees bit patterns and can't know this; matches the same
  // registered-entry preference c-source-writer.js's formatKeycodeToken
  // uses for the exported C source.
  const registeredEntry = canonicalEntryForValue(value);
  if (registeredEntry?.symbol === "KG_WCAD") {
    return {
      main: modLabelStyle === "text" ? "CAD" : "Ctrl+Alt+Del",
      sub: modLabelStyle === "text" ? "LWIN" : "Win",
    };
  }
  if (registeredEntry?.symbol === "KG_ATAB") {
    return { main: "Alt+Tab", sub: modLabelStyle === "text" ? "LALT" : "Alt" };
  }
  if (registeredEntry) return { main: basicLabel(value, symbolStyle), sub: null };

  switch (descriptor.kind) {
    case "basic":
      return { main: basicLabel(descriptor.value, symbolStyle), sub: null };
    case "mods": {
      const key = basicLabel(descriptor.keycode, symbolStyle);
      const mods = modLabelStyle === "text" ? modsTextLabel(descriptor.mods) : modsWordLabel(descriptor.mods);
      return { main: `${mods}+${key}`, sub: null };
    }
    case "modTap":
      return {
        main: basicLabel(descriptor.keycode, symbolStyle),
        sub: modLabelStyle === "text" ? modsTextLabel(descriptor.mods) : modsWordLabel(descriptor.mods),
      };
    case "layerTap":
      return { main: basicLabel(descriptor.keycode, symbolStyle), sub: layerName(descriptor.layer) };
    case "momentaryLayer":
      return { main: "", sub: layerName(descriptor.layer) };
    case "toLayer":
      return { main: `→${layerName(descriptor.layer)}`, sub: null };
    case "defaultLayer":
      return { main: `Def ${layerName(descriptor.layer)}`, sub: null };
    case "toggleLayer":
      return { main: `Tgl ${layerName(descriptor.layer)}`, sub: null };
    case "oneShotLayer":
      return { main: `1sh ${layerName(descriptor.layer)}`, sub: null };
    default:
      return { main: `0x${value.toString(16).toUpperCase().padStart(4, "0")}`, sub: null };
  }
}

/** One-line Japanese summary of a keycode for lists and the picker (e.g. "Z (長押し: Num)"). */
export function keycodeSummary(value) {
  if (value === undefined) return "-";
  const { main, sub, empty, transparent } = describeKeycode(value);
  if (empty) return "なし";
  if (transparent) return "▽ (下のレイヤーと同じ)";
  if (!main && sub) return `押している間 ${sub} (MO)`;
  return [main, sub && `(長押し: ${sub})`].filter(Boolean).join(" ");
}
