// Pure decompose/compose functions between a raw 16-bit QMK keycode value
// and a small descriptor object. No DOM, no HID, no registry lookups here:
// this module only knows the bit-packing formulas from keycode-values.js,
// so it can be unit-tested without a browser or a real keyboard.

import {
  QK_MOD_TAP, QK_LAYER_TAP, QK_LAYER_MOD, QK_TO, QK_MOMENTARY,
  QK_DEF_LAYER, QK_TOGGLE_LAYER, QK_ONE_SHOT_LAYER, QK_ONE_SHOT_MOD,
  MODS_RANGE_MIN, MODS_RANGE_MAX,
  withMod, modTap, layerTap, momentaryLayer, toLayer, defaultLayer, toggleLayer, oneShotLayer,
} from "./keycode-values.js";

const MOD_BIT = { ctrl: 0x01, shift: 0x02, alt: 0x04, gui: 0x08 };
const RIGHT_MOD_FLAG = 0x10;

const modsFromBits = (bits) => ({
  ctrl: Boolean(bits & MOD_BIT.ctrl),
  shift: Boolean(bits & MOD_BIT.shift),
  alt: Boolean(bits & MOD_BIT.alt),
  gui: Boolean(bits & MOD_BIT.gui),
  right: Boolean(bits & RIGHT_MOD_FLAG),
});

const bitsFromMods = (mods) =>
  (mods.ctrl ? MOD_BIT.ctrl : 0) |
  (mods.shift ? MOD_BIT.shift : 0) |
  (mods.alt ? MOD_BIT.alt : 0) |
  (mods.gui ? MOD_BIT.gui : 0) |
  (mods.right ? RIGHT_MOD_FLAG : 0);

/** True if `mods` has no modifier bits set at all (an empty wrap is invalid). */
export const isEmptyMods = (mods) => !mods.ctrl && !mods.shift && !mods.alt && !mods.gui;

/**
 * Decompose a raw 16-bit keycode value into a small tagged descriptor.
 * Unrecognised ranges (macros, unicode, custom keyboard-level ranges that
 * aren't kerigokbd's QK_KB_*, etc.) decode to {kind:"basic", value}, same
 * as an ordinary keycode -- the caller resolves the display symbol via the
 * keycode registry, and anything not found there is simply shown as a raw
 * hex value.
 */
export function decode(value) {
  if (value === 0x0000) return { kind: "none" };
  if (value === 0x0001) return { kind: "transparent" };

  if (value >= MODS_RANGE_MIN && value <= MODS_RANGE_MAX) {
    const modBits = (value >> 8) & 0x1f;
    if (modBits !== 0) {
      return { kind: "mods", mods: modsFromBits(modBits), keycode: value & 0xff };
    }
  }
  if (value >= QK_MOD_TAP && value < QK_LAYER_TAP) {
    const modBits = (value >> 8) & 0x1f;
    return { kind: "modTap", mods: modsFromBits(modBits), keycode: value & 0xff };
  }
  if (value >= QK_LAYER_TAP && value < QK_LAYER_MOD) {
    return { kind: "layerTap", layer: (value >> 8) & 0xf, keycode: value & 0xff };
  }
  if (value >= QK_TO && value < QK_MOMENTARY) {
    return { kind: "toLayer", layer: value & 0x1f };
  }
  if (value >= QK_MOMENTARY && value < QK_DEF_LAYER) {
    return { kind: "momentaryLayer", layer: value & 0x1f };
  }
  if (value >= QK_DEF_LAYER && value < QK_TOGGLE_LAYER) {
    return { kind: "defaultLayer", layer: value & 0x1f };
  }
  if (value >= QK_TOGGLE_LAYER && value < QK_ONE_SHOT_LAYER) {
    return { kind: "toggleLayer", layer: value & 0x1f };
  }
  if (value >= QK_ONE_SHOT_LAYER && value < QK_ONE_SHOT_MOD) {
    return { kind: "oneShotLayer", layer: value & 0x1f };
  }
  return { kind: "basic", value };
}

/** Compose a descriptor (as produced by decode()) back into a raw 16-bit value. */
export function encode(descriptor) {
  switch (descriptor.kind) {
    case "none": return 0x0000;
    case "transparent": return 0x0001;
    case "basic": return descriptor.value & 0xffff;
    case "mods": {
      if (isEmptyMods(descriptor.mods)) {
        throw new Error("mods descriptor needs at least one of ctrl/shift/alt/gui");
      }
      return withMod(bitsFromMods(descriptor.mods) << 8, descriptor.keycode);
    }
    case "modTap": {
      if (isEmptyMods(descriptor.mods)) {
        throw new Error("modTap descriptor needs at least one of ctrl/shift/alt/gui");
      }
      return modTap(bitsFromMods(descriptor.mods), descriptor.keycode);
    }
    case "layerTap": return layerTap(descriptor.layer, descriptor.keycode);
    case "momentaryLayer": return momentaryLayer(descriptor.layer);
    case "toLayer": return toLayer(descriptor.layer);
    case "defaultLayer": return defaultLayer(descriptor.layer);
    case "toggleLayer": return toggleLayer(descriptor.layer);
    case "oneShotLayer": return oneShotLayer(descriptor.layer);
    default: throw new Error(`Unknown descriptor kind: ${descriptor.kind}`);
  }
}

// LT(layer, kc) can only wrap a basic keycode (8 bits) and address layers
// 0-15 (4 bits), per QMK's QK_LAYER_TAP packing.
export const LAYER_TAP_MAX_LAYERS = 16;

/** True if `value` fits as LT()'s tap keycode (KC_A..0xFF; not KC_NO/KC_TRNS or composed values). */
export const isLayerTapKeycode = (value) => value >= 0x0004 && value <= 0x00ff;

/** The layer this value switches to while held via LT(), or null if it isn't a layer-tap. */
export function holdLayerOf(value) {
  const descriptor = decode(value);
  return descriptor.kind === "layerTap" ? descriptor.layer : null;
}

/** The basic keycode tapped by this value (itself, or LT()'s / MT()'s / a mods wrap's key), or null if there's none to keep. */
export function tapKeycodeOf(value) {
  const descriptor = decode(value);
  if (descriptor.kind === "layerTap" || descriptor.kind === "mods" || descriptor.kind === "modTap") return descriptor.keycode;
  if (descriptor.kind === "basic" && isLayerTapKeycode(value)) return value;
  return null;
}

/**
 * Rewraps this value's tap key with a new hold layer: LT(layer, tap), or
 * the bare tap key for layer === null. Returns null when the value has no
 * basic tap key to keep (MO(), KC_NO, a mod-tap, ...).
 */
export function withHoldLayer(value, layer) {
  const tap = tapKeycodeOf(value);
  if (tap === null) return null;
  return layer === null ? tap : layerTap(layer, tap);
}

export const NO_MODS = Object.freeze({ ctrl: false, shift: false, alt: false, gui: false, right: false });

/**
 * How this value applies modifiers to its key: "with" for a mods wrap
 * (LALT(KC_PSCR): sent together on every press), "tap" for a mod-tap
 * (LALT_T(KC_A): the mods only while held, the key on tap), with the mods
 * themselves; NO_MODS/"with" for anything else.
 */
export function wrapModsOf(value) {
  const descriptor = decode(value);
  if (descriptor.kind === "mods") return { mods: descriptor.mods, mode: "with" };
  if (descriptor.kind === "modTap") return { mods: descriptor.mods, mode: "tap" };
  return { mods: { ...NO_MODS }, mode: "with" };
}

/**
 * Rewraps this value's tap key with `mods`, as a mods wrap (mode "with",
 * e.g. LALT(tap)) or a mod-tap (mode "tap", e.g. LALT_T(tap)), or the bare
 * tap key when no modifier is set. Like withHoldLayer, returns null when
 * there's no basic tap key to keep. Neither can be combined with LT() in
 * one QMK keycode, so this drops any hold layer.
 */
export function withMods(value, mods, mode = "with") {
  const tap = tapKeycodeOf(value);
  if (tap === null) return null;
  if (isEmptyMods(mods)) return tap;
  return encode({ kind: mode === "tap" ? "modTap" : "mods", mods, keycode: tap });
}
