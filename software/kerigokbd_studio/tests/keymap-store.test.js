import { test } from "node:test";
import assert from "node:assert/strict";
import { KeymapStore, diffKeymaps } from "../public/state/keymap-store.js";

const layout = { id: "test", keys: [{ matrix: [0, 0] }, { matrix: [0, 1] }] };
const defaults = { layers: [[0x0004, 0x0005]] }; // KC_A, KC_B on layer 0

test("a key not yet read from the device is never flagged as changed", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  assert.equal(store.isChangedFromLatest(0, 0), false);
});

test("a key matching the GitHub latest layout is not flagged as changed", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0005]);
  assert.equal(store.isChangedFromLatest(0, 0), false);
  assert.equal(store.isChangedFromLatest(0, 1), false);
});

test("a key that differs from the GitHub latest layout is flagged as changed", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0006]); // second key edited to KC_C
  assert.equal(store.isChangedFromLatest(0, 0), false);
  assert.equal(store.isChangedFromLatest(0, 1), true);
});

test("a layer with no GitHub latest layout (out of range) is never flagged as changed", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(5, [0x0004, 0x0006]);
  assert.equal(store.isChangedFromLatest(5, 0), false);
  assert.equal(store.isChangedFromLatest(5, 1), false);
});

test("resetting a changed key back to the default value clears the flag", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0006]);
  assert.equal(store.isChangedFromLatest(0, 1), true);
  store.setKeycodeAt(0, 1, 0x0005);
  assert.equal(store.isChangedFromLatest(0, 1), false);
});

test("a draft is shown in place of the live value without touching it", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0005]);
  store.setDraft(0, 1, 0x0006);
  assert.equal(store.keycodeAt(0, 1), 0x0005);
  assert.equal(store.effectiveKeycodeAt(0, 1), 0x0006);
  assert.equal(store.isChangedFromLatest(0, 1), true);
  assert.deepEqual(store.draftEntries(), [{ layer: 0, keyIndex: 1, value: 0x0006 }]);
  assert.equal(store.layerHasDrafts(0), true);
});

test("drafting the value the device already holds drops the draft", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0005]);
  store.setDraft(0, 1, 0x0006);
  store.setDraft(0, 1, 0x0005);
  assert.equal(store.drafts.size, 0);
});

test("reading back a layer clears only the drafts the device now holds", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0005]);
  store.setDraft(0, 0, 0x0007);
  store.setDraft(0, 1, 0x0006);
  store.setLayerKeycodes(0, [0x0004, 0x0006]); // only the second write landed
  assert.deepEqual(store.draftEntries(), [{ layer: 0, keyIndex: 0, value: 0x0007 }]);
});

test("switching keyboards discards drafts", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0005]);
  store.setDraft(0, 1, 0x0006);
  store.setLayout("test", layout, defaults);
  assert.equal(store.drafts.size, 0);
});

test("stageKeymap carries another keymap over as drafts against the live values", () => {
  const store = new KeymapStore();
  store.setLayout("test", layout, defaults);
  store.setLayerKeycodes(0, [0x0004, 0x0005]);
  store.setDraft(0, 1, 0x0006);
  const edited = store.editorKeymap();
  assert.deepEqual(edited, [[0x0004, 0x0006]]);
  // Another device (the other half) connects with a different keymap.
  store.setAllLayerKeycodes([[0x0007, 0x0005]]);
  assert.equal(diffKeymaps(edited, store.layers), 2);
  assert.equal(store.stageKeymap(edited), 2);
  assert.deepEqual(store.draftEntries(), [
    { layer: 0, keyIndex: 0, value: 0x0004 },
    { layer: 0, keyIndex: 1, value: 0x0006 },
  ]);
});
