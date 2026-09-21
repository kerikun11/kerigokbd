// QMK VIA raw HID protocol (quantum/via.h, quantum/via.c, quantum/dynamic_keymap.c).
// This module only encodes/decodes 32-byte report buffers; it knows nothing
// about WebHID. Pass it any `exchange(Uint8Array) => Promise<Uint8Array>`
// function (a real HidTransport, or a mock in tests).

export const RAW_REPORT_SIZE = 32;
// dynamic_keymap_(get|set)_buffer's `data` payload is capped at 28 bytes
// per call: 1 byte command id + 2 bytes offset + 1 byte size leaves
// 32 - 4 = 28 bytes for the buffer itself (see quantum/via.c).
export const MAX_BUFFER_CHUNK = 28;

const COMMAND = {
  getProtocolVersion: 0x01,
  dynamicKeymapGetKeycode: 0x04,
  dynamicKeymapSetKeycode: 0x05,
  dynamicKeymapReset: 0x06,
  dynamicKeymapGetLayerCount: 0x11,
  dynamicKeymapGetBuffer: 0x12,
  dynamicKeymapSetBuffer: 0x13,
};
const ID_UNHANDLED = 0xff;

function newRequest(commandId) {
  const request = new Uint8Array(RAW_REPORT_SIZE);
  request[0] = commandId;
  return request;
}

function assertHandled(request, response) {
  if (response[0] === ID_UNHANDLED) {
    throw new Error(`Keyboard firmware did not recognise VIA command 0x${request[0].toString(16)}`);
  }
}

export function createViaClient(exchange) {
  return {
    async getProtocolVersion() {
      const request = newRequest(COMMAND.getProtocolVersion);
      const response = await exchange(request);
      assertHandled(request, response);
      return (response[1] << 8) | response[2];
    },

    async getLayerCount() {
      const request = newRequest(COMMAND.dynamicKeymapGetLayerCount);
      const response = await exchange(request);
      assertHandled(request, response);
      return response[1];
    },

    async getKeycode(layer, row, col) {
      const request = newRequest(COMMAND.dynamicKeymapGetKeycode);
      request[1] = layer;
      request[2] = row;
      request[3] = col;
      const response = await exchange(request);
      assertHandled(request, response);
      return (response[4] << 8) | response[5];
    },

    async setKeycode(layer, row, col, keycode) {
      const request = newRequest(COMMAND.dynamicKeymapSetKeycode);
      request[1] = layer;
      request[2] = row;
      request[3] = col;
      request[4] = (keycode >> 8) & 0xff;
      request[5] = keycode & 0xff;
      const response = await exchange(request);
      assertHandled(request, response);
    },

    async resetKeymap() {
      const request = newRequest(COMMAND.dynamicKeymapReset);
      const response = await exchange(request);
      assertHandled(request, response);
    },

    /** Reads `size` bytes (<= MAX_BUFFER_CHUNK) starting at byte `offset` into the raw keymap buffer. */
    async getKeymapBufferChunk(offset, size) {
      if (size > MAX_BUFFER_CHUNK) throw new RangeError(`size must be <= ${MAX_BUFFER_CHUNK}`);
      const request = newRequest(COMMAND.dynamicKeymapGetBuffer);
      request[1] = (offset >> 8) & 0xff;
      request[2] = offset & 0xff;
      request[3] = size;
      const response = await exchange(request);
      assertHandled(request, response);
      return response.slice(4, 4 + size);
    },

    /** Writes `data` (length <= MAX_BUFFER_CHUNK) starting at byte `offset` into the raw keymap buffer. */
    async setKeymapBufferChunk(offset, data) {
      if (data.length > MAX_BUFFER_CHUNK) throw new RangeError(`data length must be <= ${MAX_BUFFER_CHUNK}`);
      const request = newRequest(COMMAND.dynamicKeymapSetBuffer);
      request[1] = (offset >> 8) & 0xff;
      request[2] = offset & 0xff;
      request[3] = data.length;
      request.set(data, 4);
      const response = await exchange(request);
      assertHandled(request, response);
    },
  };
}

/** Byte offset of (layer, row, col) into the flat, big-endian raw keymap buffer (quantum/nvm/eeprom/nvm_dynamic_keymap.c). */
export function keymapByteOffset(layer, row, col, matrixRows, matrixCols) {
  return layer * matrixRows * matrixCols * 2 + row * matrixCols * 2 + col * 2;
}

/**
 * Reads every keycode for one layer via as few getKeymapBufferChunk() calls
 * as possible, instead of one dynamicKeymapGetKeycode round trip per key
 * (a 48-key layer would otherwise need 48 HID transactions instead of ~4).
 */
export async function readLayerKeycodes(client, layer, matrixRows, matrixCols) {
  const byteLength = matrixRows * matrixCols * 2;
  const layerOffset = layer * byteLength;
  const bytes = new Uint8Array(byteLength);
  for (let read = 0; read < byteLength; read += MAX_BUFFER_CHUNK) {
    const size = Math.min(MAX_BUFFER_CHUNK, byteLength - read);
    const chunk = await client.getKeymapBufferChunk(layerOffset + read, size);
    bytes.set(chunk, read);
  }
  const keycodes = [];
  for (let row = 0; row < matrixRows; row++) {
    const rowValues = [];
    for (let col = 0; col < matrixCols; col++) {
      const offset = keymapByteOffset(0, row, col, matrixRows, matrixCols);
      rowValues.push((bytes[offset] << 8) | bytes[offset + 1]);
    }
    keycodes.push(rowValues);
  }
  return keycodes;
}
