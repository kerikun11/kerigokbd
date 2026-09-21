import { test } from "node:test";
import assert from "node:assert/strict";
import { overwriteKeymap } from "../public/state/keymap-update.js";

const layout = { matrixRows: 1, matrixCols: 3, layerCount: 2, keys: [{ matrix: [0, 2] }, { matrix: [0, 0] }] };
const layers = () => [[4, 5], [6, 7]];

function mockClient(failWrite = () => false) {
  const memory = [10, 99, 11, 12, 98, 13];
  let writes = 0;
  return { memory, async getKeymapBufferChunk(offset, size) {
    const bytes = memory.flatMap(v => [v >> 8, v & 255]);
    return Uint8Array.from(bytes.slice(offset, offset + size));
  }, async setKeycode(layer, row, col, value) {
    if (failWrite(++writes)) throw new Error("USB failure");
    memory[layer * 3 + col] = value;
  } };
}

test("update writes all layers by matrix position, preserves unused cells and verifies readback", async () => {
  const client = mockClient();
  const messages = [];
  assert.deepEqual(await overwriteKeymap(client, layout, layers(), message => messages.push(message)), layers());
  assert.deepEqual(client.memory, [5, 99, 4, 7, 98, 6]);
  assert.ok(messages.some(message => message.includes('4/4')));
});

test("partial write failure restores original keymap", async () => {
  const client = mockClient(n => n === 2);
  await assert.rejects(overwriteKeymap(client, layout, layers()), /更新前のキーマップに戻しました/);
  assert.deepEqual(client.memory, [10, 99, 11, 12, 98, 13]);
});

test("disconnect during update reports failed restoration rather than success", async () => {
  const client = mockClient(n => n >= 2);
  await assert.rejects(overwriteKeymap(client, layout, layers()), /一部だけ変更/);
});

test("readback mismatch triggers restoration", async () => {
  const client = mockClient();
  const write = client.setKeycode;
  let calls = 0;
  client.setKeycode = async (...args) => { if (++calls !== 1) await write(...args); };
  await assert.rejects(overwriteKeymap(client, layout, layers()), /更新前のキーマップに戻しました/);
  assert.deepEqual(client.memory, [10, 99, 11, 12, 98, 13]);
});

test("failed initial backup never writes to the device", async () => {
  let writes = 0;
  await assert.rejects(overwriteKeymap({ getKeymapBufferChunk() { throw new Error('read failed'); }, setKeycode() { writes++; } }, layout, layers()), /read failed/);
  assert.equal(writes, 0);
});
