// Combines every relevant layer's action on one key into the overlay label
// set keymap_viewer's "quick reference" (早見表) view uses: the Main layer's
// tap label, its own Hold action (if the Main-layer key is a layer-tap,
// mod-tap or momentary-layer key), and the tap action on the Num/Fn/Extra/
// Trackpad layers. Only those five layers get their own overlay row -- a Hold
// that names one of the other two layers (Config, Reserved) is hidden
// outright rather than shown as a dangling reference the sheet never
// explains (see HIDDEN_HOLD_LABELS below). A layer left transparent
// (_______) on a key is always
// hidden -- there's nothing there to report -- but beyond that, how much
// an *explicit* reassignment gets deduped against Main varies by layer,
// matching keymap_viewer's own scripts/generate.py layer_label()/
// auto_mouse_label() exactly (verified against its source, not guessed):
// - Num: never deduped. The "." key's Num-layer entry is JP_DOT again,
//   deliberately keeping "." reachable while Num is held -- showing it is
//   the point, not noise.
// - Fn: deduped against Main's tap label only.
// - Extra: never deduped against Main's tap/hold label -- but its own
//   "→Main" (TO(KGL_MAIN), the layer's built-in way back) is always hidden,
//   since returning to Main is implicit and redundant to spell out.
// - Trackpad: deduped against *both* Main's tap label and Main's own Hold
//   label -- the AutoMouse layer is mostly explicit pass-through copies of
//   Main (KC_ENT, KC_TAB, KC_LCTL, ...) so typing still works normally
//   while the trackpad is active, and re-showing all of those as if they
//   were mouse-specific would bury the handful of keys that actually are.
//
// The cheat sheet is meant to be printed and read at a glance, so it always
// uses the readable label style: printable symbol characters (JP_EXLM -> "!")
// and plain modifier words (LALT_T -> "Alt", no icon) rather than the
// editor's exact keymap.c-matching suffixes -- see keycode-format.js's
// describeKeycode for the full explanation of that split.

import { describeKeycode } from "./keycode-format.js";
import { canonicalEntryForValue, layerAt, layerIndexBySymbol, layerDisplayName } from "./keycode-registry.js";

const CHEAT_SHEET_LABEL_STYLE = { modLabelStyle: "word", symbolStyle: "printable" };

// When Hold says "Num", "Fn" or "Extra" (a MO()/LT() pointing at that
// layer), it's colored to match that layer's own color instead of the
// generic Hold green -- matching keymap_viewer's .key-hold.hold-nums/
// .hold-func/.hold-extra (KG_ESC = LT(KGL_EXT, KC_ESC) is the real example:
// its Hold reads "Extra" and should be the same purple as the Extra-layer
// overlay text, not plain Hold green).
function holdColorName(layerSymbol) {
  const index = layerIndexBySymbol(layerSymbol);
  const layer = index >= 0 ? layerAt(index) : null;
  return layer ? layerDisplayName(layer.symbol) : null;
}
const NUM_HOLD_LABEL = holdColorName("KGL_NUM");
const FUNC_HOLD_LABEL = holdColorName("KGL_FUN");
const EXTRA_HOLD_LABEL = holdColorName("KGL_EXT");

// Config and Reserved never get their own overlay row on the cheat sheet
// (only Main/Num/Fn/Extra/Trackpad do), so a Hold that jumps to either of them
// (MO(KGL_CONF)/MO(KGL_RES)) would name a layer the sheet never explains --
// hide it rather than print a dangling reference.
const HIDDEN_HOLD_LABELS = new Set([holdColorName("KGL_CONF"), holdColorName("KGL_RES")].filter(Boolean));

// TO(KGL_MAIN) ("→Main") is how the Extra layer's own "back to Main" key
// reads -- every Extra-layer key implicitly returns to Main on release
// anyway (Extra is entered via a hold, not a toggle), so spelling that out
// is redundant there and just gets hidden, unlike every other explicit
// Extra-layer reassignment (see the file-level comment above).
const MAIN_LAYER_LABEL = holdColorName("KGL_MAIN");
const TO_MAIN_LABEL = MAIN_LAYER_LABEL ? `→${MAIN_LAYER_LABEL}` : null;

function holdColorFor(hold) {
  if (hold === NUM_HOLD_LABEL) return "nums";
  if (hold === FUNC_HOLD_LABEL) return "func";
  if (hold === EXTRA_HOLD_LABEL) return "extra";
  return null;
}

// dedupeAgainst lists which of Main's own labels (tap label, hold label)
// this particular layer's value should be hidden when it exactly matches --
// see the file-level comment above for why this differs per layer.
function dedupedLabel(value, dedupeAgainst = []) {
  if (value === undefined) return null;
  const descriptor = describeKeycode(value, CHEAT_SHEET_LABEL_STYLE);
  if (descriptor.empty || descriptor.transparent) return null;
  if (!descriptor.main) return null;
  if (dedupeAgainst.includes(descriptor.main)) return null;
  return descriptor.main;
}

// The comma/period/slash keys type a different symbol when shifted, shown
// as a small badge next to Main -- copied by value from keymap_viewer's
// scripts/generate.py MAIN_SHIFT_LABELS.
const SHIFT_SYMBOL_BY_MAIN_SYMBOL = { JP_COMM: "<", JP_DOT: ">", JP_SLSH: "?" };

function mainShiftLabel(value) {
  if (value === undefined) return null;
  const entry = canonicalEntryForValue(value);
  return entry ? (SHIFT_SYMBOL_BY_MAIN_SYMBOL[entry.symbol] ?? null) : null;
}

/**
 * @param {object} keycodes raw 16-bit values for this one key, on whichever
 *   of the Main/Num/Fn/Extra/Trackpad layers this keyboard has (any may be
 *   undefined, e.g. a value not yet read from the device, a layer hidden by
 *   a toggle, or a keyboard with no Trackpad layer at all).
 */
export function describeCheatSheetKey({ main, nums, func, extra, mouse }) {
  const mainDescriptor = main === undefined
    ? { main: "", sub: null }
    : describeKeycode(main, CHEAT_SHEET_LABEL_STYLE);
  const hold = HIDDEN_HOLD_LABELS.has(mainDescriptor.sub) ? null : (mainDescriptor.sub ?? null);
  return {
    main: mainDescriptor.main,
    empty: Boolean(mainDescriptor.empty),
    transparent: Boolean(mainDescriptor.transparent),
    mainShift: mainShiftLabel(main),
    hold,
    holdColor: holdColorFor(hold),
    nums: dedupedLabel(nums, []),
    func: dedupedLabel(func, [mainDescriptor.main]),
    extra: dedupedLabel(extra, [TO_MAIN_LABEL]),
    mouse: dedupedLabel(mouse, [mainDescriptor.main, mainDescriptor.sub]),
  };
}
