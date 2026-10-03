import { decode, holdLayerOf, wrapModsOf, isEmptyMods, NO_MODS } from "../keycodes/keycode-codec.js";

// The key picker's 長押し action ({type: "none" | "lt" | "mt" | "mo", layer,
// mods}) and 同時押し modifiers. The two are mutually exclusive: QMK can't
// encode LT()/MT() and a mods wrap in one keycode.
export const NO_HOLD = Object.freeze({ type: "none", layer: null, mods: NO_MODS });

/** The picker's 長押し / 同時押し state that describes an existing keycode. */
export function pickerWrapOf(value) {
  if (value === undefined) return { hold: NO_HOLD, withMods: { ...NO_MODS } };
  const layer = holdLayerOf(value);
  if (layer !== null) return { hold: { ...NO_HOLD, type: "lt", layer }, withMods: { ...NO_MODS } };
  const descriptor = decode(value);
  if (descriptor.kind === "momentaryLayer") return { hold: { ...NO_HOLD, type: "mo", layer: descriptor.layer }, withMods: { ...NO_MODS } };
  const { mods, mode } = wrapModsOf(value);
  if (mode === "tap") return { hold: { ...NO_HOLD, type: "mt", mods }, withMods: { ...NO_MODS } };
  return { hold: NO_HOLD, withMods: mods };
}

/** True while an LT/MT is still being set up (no layer / modifier chosen yet). */
export const isSettingUpHold = (hold) =>
  (hold.type === "lt" && hold.layer === null) || (hold.type === "mt" && isEmptyMods(hold.mods));
