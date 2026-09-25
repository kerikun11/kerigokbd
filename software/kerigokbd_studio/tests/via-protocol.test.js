import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createViaClient, keymapByteOffset, readLayerKeycodes, MAX_BUFFER_CHUNK,
} from "../public/hid/via-protocol.js";

// A tiny in-memory stand-in for quantum/via.c + quantum/dynamic_keymap.c /
// quantum/nvm/eeprom/nvm_dynamic_keymap.c, faithful enough (same command
// ids, same big-endian buffer layout) to exercise the real protocol module
// without a browser or actual hardware.
function createMockKeyboard({ matrixRows, matrixCols, layerCount, protocolVersion = 0x000c }) {
  const keymap = new Uint8Array(layerCount * matrixRows * matrixCols * 2);

  async function exchange(request) {
    const response = new Uint8Array(request);
    switch (request[0]) {
      case 0x01: // id_get_protocol_version
        response[1] = protocolVersion >> 8;
        response[2] = protocolVersion & 0xff;
        break;
      case 0x04: { // id_dynamic_keymap_get_keycode
        const offset = keymapByteOffset(request[1], request[2], request[3], matrixRows, matrixCols);
        response[4] = keymap[offset];
        response[5] = keymap[offset + 1];
        break;
      }
      case 0x05: { // id_dynamic_keymap_set_keycode
        const offset = keymapByteOffset(request[1], request[2], request[3], matrixRows, matrixCols);
        keymap[offset] = request[4];
        keymap[offset + 1] = request[5];
        break;
      }
      case 0x11: // id_dynamic_keymap_get_layer_count
        response[1] = layerCount;
        break;
      case 0x12: { // id_dynamic_keymap_get_buffer
        const offset = (request[1] << 8) | request[2];
        const size = request[3];
        for (let i = 0; i < size; i++) response[4 + i] = keymap[offset + i] ?? 0;
        break;
      }
      case 0x13: { // id_dynamic_keymap_set_buffer
        const offset = (request[1] << 8) | request[2];
        const size = request[3];
        for (let i = 0; i < size; i++) keymap[offset + i] = request[4 + i];
        break;
      }
      case 0x06: // id_dynamic_keymap_reset
        keymap.fill(0);
        break;
      default:
        response[0] = 0xff; // id_unhandled
    }
    return response;
  }

  return { exchange, keymap };
}

test("getProtocolVersion / getLayerCount", async () => {
  const { exchange } = createMockKeyboard({ matrixRows: 8, matrixCols: 7, layerCount: 7, protocolVersion: 0x000c });
  const client = createViaClient(exchange);
  assert.equal(await client.getProtocolVersion(), 0x000c);
  assert.equal(await client.getLayerCount(), 7);
});

test("setKeycode / getKeycode round-trip", async () => {
  const { exchange } = createMockKeyboard({ matrixRows: 8, matrixCols: 7, layerCount: 7 });
  const client = createViaClient(exchange);
  await client.setKeycode(3, 2, 5, 0x4329);
  assert.equal(await client.getKeycode(3, 2, 5), 0x4329);
  // Unwritten keys stay zero (KC_NO), same as an erased EEPROM.
  assert.equal(await client.getKeycode(3, 2, 6), 0x0000);
});

test("setKeymapBufferChunk / getKeymapBufferChunk round-trip", async () => {
  const { exchange } = createMockKeyboard({ matrixRows: 8, matrixCols: 7, layerCount: 7 });
  const client = createViaClient(exchange);
  const data = new Uint8Array([0x00, 0x04, 0x00, 0x05]); // KC_A, KC_B big-endian
  await client.setKeymapBufferChunk(100, data);
  const readBack = await client.getKeymapBufferChunk(100, 4);
  assert.deepEqual([...readBack], [...data]);
});

test("getKeymapBufferChunk rejects a chunk larger than the HID report can carry", async () => {
  const { exchange } = createMockKeyboard({ matrixRows: 8, matrixCols: 7, layerCount: 7 });
  const client = createViaClient(exchange);
  await assert.rejects(() => client.getKeymapBufferChunk(0, MAX_BUFFER_CHUNK + 1));
});

test("readLayerKeycodes reassembles a full layer across multiple 28-byte chunks", async () => {
  const matrixRows = 8, matrixCols = 7, layerCount = 7;
  const { exchange } = createMockKeyboard({ matrixRows, matrixCols, layerCount });
  const client = createViaClient(exchange);

  // 8*7*2 = 112 bytes for one layer, which needs 4 chunks of <=28 bytes --
  // enough to prove chunk boundaries are stitched back together correctly.
  for (let row = 0; row < matrixRows; row++) {
    for (let col = 0; col < matrixCols; col++) {
      await client.setKeycode(4, row, col, 0x1000 + row * matrixCols + col);
    }
  }

  const layer = await readLayerKeycodes(client, 4, matrixRows, matrixCols);
  assert.equal(layer.length, matrixRows);
  for (let row = 0; row < matrixRows; row++) {
    assert.equal(layer[row].length, matrixCols);
    for (let col = 0; col < matrixCols; col++) {
      assert.equal(layer[row][col], 0x1000 + row * matrixCols + col, `row=${row} col=${col}`);
    }
  }
});

test("an unhandled command id raises instead of silently returning garbage", async () => {
  const client = createViaClient(async (request) => {
    const response = new Uint8Array(request);
    response[0] = 0xff;
    return response;
  });
  await assert.rejects(() => client.getProtocolVersion());
});

test("keymapByteOffset matches quantum/nvm/eeprom/nvm_dynamic_keymap.c's formula", () => {
  const matrixRows = 8, matrixCols = 7;
  assert.equal(keymapByteOffset(0, 0, 0, matrixRows, matrixCols), 0);
  assert.equal(keymapByteOffset(0, 0, 1, matrixRows, matrixCols), 2);
  assert.equal(keymapByteOffset(0, 1, 0, matrixRows, matrixCols), matrixCols * 2);
  assert.equal(keymapByteOffset(1, 0, 0, matrixRows, matrixCols), matrixRows * matrixCols * 2);
});

test("VIA v13 round-trips KG_WCAD without replacing it with an internal Mod-Tap", async () => {
  const { exchange } = createMockKeyboard({ matrixRows: 8, matrixCols: 7, layerCount: 7, protocolVersion: 0x000d });
  const client = createViaClient(exchange);
  assert.equal(await client.getProtocolVersion(), 0x000d);
  await client.setKeycode(2, 3, 4, 0x7e00);
  assert.equal(await client.getKeycode(2, 3, 4), 0x7e00);
  const layer = await readLayerKeycodes(client, 2, 8, 7);
  assert.equal(layer[3][4], 0x7e00);
});
