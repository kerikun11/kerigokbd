import { test } from "node:test";
import assert from "node:assert/strict";
import { availableKeyboards, keyboardIdForUsbDevice, usbDeviceFilters } from "../public/layout/layout-loader.js";

// VID/PIDs from each keyboard's info.json / keyboard.json.
test("a connected device's USB VID/PID selects its own keyboard", () => {
  assert.equal(keyboardIdForUsbDevice({ vendorId: 0x1209, productId: 0xe501 }), "kerigokbd_v1");
  assert.equal(keyboardIdForUsbDevice({ vendorId: 0x1209, productId: 0xe502 }), "kerigokbd_v2");
  assert.equal(keyboardIdForUsbDevice({ vendorId: 0x4653, productId: 0x0004 }), "kerigokbd_corne_v4");
  assert.equal(keyboardIdForUsbDevice({ vendorId: 0x5957, productId: 0x0400 }), "keyball44rp");
  assert.equal(keyboardIdForUsbDevice({ vendorId: 0x1209, productId: 0x0001 }), null);
});

test("the WebHID filters cover every keyboard, each with a distinct VID/PID", () => {
  const filters = usbDeviceFilters();
  assert.equal(filters.length, availableKeyboards().length);
  assert.equal(new Set(filters.map(({ vendorId, productId }) => `${vendorId}:${productId}`)).size, filters.length);
});
