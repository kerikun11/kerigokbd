import { DEFAULTS as KERIGOKBD_V1_DEFAULTS } from "../generated/defaults-kerigokbd_v1.js";
import { DEFAULTS as KERIGOKBD_V2_DEFAULTS } from "../generated/defaults-kerigokbd_v2.js";

const DEFAULTS_BY_KEYBOARD = {
  kerigokbd_v2: KERIGOKBD_V2_DEFAULTS,
  kerigokbd_v1: KERIGOKBD_V1_DEFAULTS,
};

/**
 * main's default/keymap.c keycode (the GitHub latest layout) for every layer/key, indexed
 * exactly like layout.keys (layer index -> key index), so it can be
 * compared directly against a live-read layer without any row/col lookup.
 */
export function loadDefaults(keyboardId) {
  const defaults = DEFAULTS_BY_KEYBOARD[keyboardId];
  if (!defaults) throw new Error(`Unknown keyboard: ${keyboardId}`);
  return defaults;
}
