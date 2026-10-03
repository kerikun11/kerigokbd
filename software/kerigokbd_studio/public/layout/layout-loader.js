import { LAYOUT as KERIGOKBD_V1 } from "../generated/layout-kerigokbd_v1.js";
import { LAYOUT as KERIGOKBD_V2 } from "../generated/layout-kerigokbd_v2.js";
import { LAYOUT as KERIGOKBD_CORNE_V4 } from "../generated/layout-kerigokbd_corne_v4.js";
import { LAYOUT as KEYBALL44RP } from "../generated/layout-keyball44rp.js";

const LAYOUTS = {
  kerigokbd_v2: KERIGOKBD_V2,
  kerigokbd_v1: KERIGOKBD_V1,
  kerigokbd_corne_v4: KERIGOKBD_CORNE_V4,
  keyball44rp: KEYBALL44RP,
};

// Object key order determines both the <select> option order and its
// default selection (the first one), so kerigokbd_v2 -- the current
// flagship keyboard -- must be listed first here.
export const availableKeyboards = () =>
  Object.values(LAYOUTS).map(({ id, keyboard }) => ({ id, keyboard }));

/** The WebHID device filters matching every supported keyboard. */
export const usbDeviceFilters = () => Object.values(LAYOUTS).map(({ usb }) => ({ ...usb }));

/** The keyboard whose USB VID/PID a connected device reports, or null for none. */
export function keyboardIdForUsbDevice({ vendorId, productId }) {
  const layout = Object.values(LAYOUTS).find(({ usb }) => usb.vendorId === vendorId && usb.productId === productId);
  return layout?.id ?? null;
}

export function loadLayout(keyboardId) {
  const layout = LAYOUTS[keyboardId];
  if (!layout) throw new Error(`Unknown keyboard: ${keyboardId}`);
  return layout;
}
