import { DEFAULTS as KERIGOKBD_V1_DEFAULTS } from "../generated/defaults-kerigokbd_v1.js";
import { DEFAULTS as KERIGOKBD_V2_DEFAULTS } from "../generated/defaults-kerigokbd_v2.js";
import { DEFAULTS as KERIGOKBD_CORNE_V4_DEFAULTS } from "../generated/defaults-kerigokbd_corne_v4.js";
import { DEFAULTS as KEYBALL44RP_DEFAULTS } from "../generated/defaults-keyball44rp.js";

const DEFAULTS_BY_KEYBOARD = {
  kerigokbd_v2: KERIGOKBD_V2_DEFAULTS,
  kerigokbd_v1: KERIGOKBD_V1_DEFAULTS,
  kerigokbd_corne_v4: KERIGOKBD_CORNE_V4_DEFAULTS,
  keyball44rp: KEYBALL44RP_DEFAULTS,
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
