// Maps a cheat sheet overlay label (as produced by cheat-sheet-labels.js's
// describeCheatSheetKey, e.g. "BTN1", "MSL", "SCRL") to the same operation
// icon keymap_viewer shows for mouse/pointer keys, so the
// cheat sheet reads at a glance instead of as a wall of short mnemonics.
// Labels with no icon mapping here are left as plain text by the caller.

const CLICK_ICONS = { BTN1: "mouse-left", BTN2: "mouse-right", BTN3: "mouse-middle" };
const POINTER_ARROWS = { MSL: "⬅", MSD: "⬇", MSU: "⬆", MSR: "➡" };
const WHEEL_ARROWS = { MWLL: "⬅", MWLD: "⬇", MWLU: "⬆", MWLR: "➡" };
// A mod-tap's own hold badge (KG_LALT = LALT_T(...), KG_L4 = LWIN_T(...))
// is never iconified -- keycode-format.js's modLabelStyle: "word" already
// renders it as plain "Alt"/"Win"/etc, so there's no glyph here to map.
// Alt, Backspace, and Delete are always plain text.
const ICON_ONLY = {
  SCRL: "scroll", ZOOM: "zoom",
  VOLU: "volume-up", VOLD: "volume-down",
};
// The Left/Down/Up/Right d-pad keys (keycode-format.js's symbolStyle:
// "printable" renders KC_LEFT as "⬅", etc) intentionally have no icon
// mapping here: they render as the bare arrow character, the same "font,
// not a drawn icon" treatment as the arrow next to a mouse-move/wheel icon
// (POINTER_ARROWS/WHEEL_ARROWS above) -- there's no separate "d-pad" icon
// to pair them with the way MSL/MWLL pair an arrow with the mouse/wheel
// body, so nothing to map here, and iconForLabel correctly falls through
// to null for them.

// Numpad digit/symbol keys (KC_P0.."KC_P9", KC_PDOT/PMNS/PPLS/PSLS/PAST)
// look just like their main-row equivalents (a bare "7", a bare "*") once
// printed as text, so each gets this small keypad-grid icon alongside the
// character to mark it as the numpad's key instead.
const NUMPAD_CHARS = {
  P0: "0", P1: "1", P2: "2", P3: "3", P4: "4", P5: "5", P6: "6", P7: "7", P8: "8", P9: "9",
  PDOT: ".", PMNS: "−", PPLS: "+", PSLS: "/", PAST: "*",
  // KC_PENT (numpad Enter) has no PRINTABLE_SYMBOL_LABELS entry, so its raw
  // suffix "PENT" reaches here unchanged -- deliberately, since giving it
  // the same "Enter" text as plain KC_ENT would make this same lookup also
  // paint the icon onto the *ordinary* Enter key (iconForLabel only sees
  // the rendered text, not which keycode produced it).
  PENT: "Enter",
};

// Modifier shortcuts use readable text, including Print Screen combinations.
export function compoundIconsForLabel() {
  return null;
}

/**
 * @returns {{icon: string, arrow: string|null}|null} the icon name (matches
 *   an "#icon-<name>" symbol id in index.html) and an optional companion
 *   character to show alongside it (a direction arrow, a numpad digit),
 *   or null if this label has no icon -- the caller then shows the raw
 *   text, e.g. the d-pad's bare arrow character.
 */
export function iconForLabel(label) {
  if (label in CLICK_ICONS) return { icon: CLICK_ICONS[label], arrow: null };
  if (label in POINTER_ARROWS) return { icon: "mouse", arrow: POINTER_ARROWS[label] };
  if (label in WHEEL_ARROWS) return { icon: "wheel", arrow: WHEEL_ARROWS[label] };
  if (label in ICON_ONLY) return { icon: ICON_ONLY[label], arrow: null };
  if (label in NUMPAD_CHARS) return { icon: "numpad", arrow: NUMPAD_CHARS[label] };
  return null;
}
