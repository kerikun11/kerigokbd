import { test } from "node:test";
import assert from "node:assert/strict";
import { KeymapStore } from "../public/state/keymap-store.js";

const layout = { id: "test", keys: [{ matrix: [0, 0] }, { matrix: [0, 1] }] };
const defaults = { layers: [[0x0004, 0x0005]] }; // KC_A, KC_B on layer 0

test("a key not yet read from the device is never flagged as changed", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  assert.equal(store.isChangedFromDefault(0, 0), false);
});

test("a key matching the firmware default is not flagged as changed", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0005]);
  assert.equal(store.isChangedFromDefault(0, 0), false);
  assert.equal(store.isChangedFromDefault(0, 1), false);
});

test("a key that differs from the firmware default is flagged as changed", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0006]); // second key edited to KC_C
  assert.equal(store.isChangedFromDefault(0, 0), false);
  assert.equal(store.isChangedFromDefault(0, 1), true);
});

test("a layer with no firmware default (out of range) is never flagged as changed", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(5, [0x0004, 0x0006]);
  assert.equal(store.isChangedFromDefault(5, 0), false);
  assert.equal(store.isChangedFromDefault(5, 1), false);
});

test("resetting a changed key back to the default value clears the flag", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0006]);
  assert.equal(store.isChangedFromDefault(0, 1), true);
  store.setKeycodeAt(0, 1, 0x0005);
  assert.equal(store.isChangedFromDefault(0, 1), false);
});
