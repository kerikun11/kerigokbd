// Orchestrates HidTransport + the VIA protocol client against a KeymapStore.
// This is the only place that decides *when* to talk to the keyboard; the
// store just holds state, and via-protocol.js just knows the wire format.

import { HidTransport } from "../hid/hid-transport.js";
import { createViaClient, readLayerKeycodes } from "../hid/via-protocol.js";
import { overwriteKeymap } from "./keymap-update.js";
import { diffKeymaps } from "./keymap-store.js";

export class SyncEngine {
  #store;
  #transport = new HidTransport();
  #client = null;
  /**
   * Called on connect when the editor already shows a keymap (from a
   * previously connected device) that differs from the newly connected
   * one: `async (diffCount) => boolean`, true to keep the editor's keymap
   * as drafts to write to this device, false to show the device's own.
   */
  onKeymapMismatch = null;

  constructor(store) {
    this.#store = store;
    this.#transport.addEventListener("disconnect", () => {
      this.#client = null;
      this.#store.setConnectionState("disconnected");
    });
  }

  get isConnected() {
    return this.#client !== null;
  }

  async connect() {
    this.#store.setConnectionState("connecting");
    try {
      await this.#transport.requestAndOpen();
      await this.#afterOpen();
    } catch (error) {
      this.#store.setConnectionState("error", error.message);
      throw error;
    }
  }

  async connectToPreviouslyGrantedDevice() {
    const opened = await this.#transport.openPreviouslyGrantedDevice();
    if (!opened) return false;
    this.#store.setConnectionState("connecting");
    try {
      await this.#afterOpen();
      return true;
    } catch (error) {
      this.#store.setConnectionState("error", error.message);
      throw error;
    }
  }

  async #afterOpen() {
    this.#client = createViaClient((request) => this.#transport.exchange(request));
    const protocolVersion = await this.#client.getProtocolVersion();
    const deviceLayerCount = await this.#client.getLayerCount();
    const { productId, vendorId } = this.#transport.device;
    this.#store.setProtocolInfo(protocolVersion, deviceLayerCount, { productId, vendorId });
    const editorKeymap = this.#store.editorKeymap();
    const deviceKeymap = await this.#readAllLayers();
    const diffCount = editorKeymap ? diffKeymaps(editorKeymap, deviceKeymap) : 0;
    const keepEditor = diffCount > 0 && Boolean(await this.onKeymapMismatch?.(diffCount));
    this.#store.setAllLayerKeycodes(deviceKeymap);
    if (keepEditor) this.#store.stageKeymap(editorKeymap);
    else this.#store.clearDrafts();
    this.#store.setConnectionState("connected");
  }

  async disconnect() {
    await this.#transport.close();
    this.#client = null;
    this.#store.setConnectionState("disconnected");
  }

  async #readAllLayers() {
    const { layout } = this.#store;
    const layers = [];
    for (let layer = 0; layer < Math.min(this.#store.layerCount, layout.layerCount); layer++) {
      const grid = await readLayerKeycodes(this.#client, layer, layout.matrixRows, layout.matrixCols);
      layers.push(layout.keys.map(({ matrix: [row, col] }) => grid[row][col]));
    }
    return layers;
  }

  /** Re-reads every layer the device exposes (capped by both the device's own layer count and this layout's keys). */
  async reloadAllLayers() {
    const { layout } = this.#store;
    const layersToRead = Math.min(this.#store.layerCount, layout.layerCount);
    for (let layer = 0; layer < layersToRead; layer++) {
      const grid = await readLayerKeycodes(this.#client, layer, layout.matrixRows, layout.matrixCols);
      const keycodesByKeyIndex = layout.keys.map(({ matrix: [row, col] }) => grid[row][col]);
      this.#store.setLayerKeycodes(layer, keycodesByKeyIndex);
    }
  }

  /**
   * Writes every staged draft to the device, then re-reads the touched
   * layers: a draft is only dropped once the device reports holding its
   * value (KeymapStore.setLayerKeycodes), so anything left afterwards was
   * not written and stays staged for another try.
   */
  async writeDrafts(onProgress = () => {}) {
    if (!this.#client || this.#store.connectionState !== "connected") throw new Error("実機に接続してください。");
    const { layout } = this.#store;
    const entries = this.#store.draftEntries();
    let done = 0;
    try {
      for (const { layer, keyIndex, value } of entries) {
        const [row, col] = layout.keys[keyIndex].matrix;
        this.#store.setPending(layer, row, col, true);
        try {
          await this.#client.setKeycode(layer, row, col, value);
        } finally {
          this.#store.setPending(layer, row, col, false);
        }
        onProgress(`書き込み中… ${++done}/${entries.length}`);
      }
    } finally {
      // Never let a failed read-back mask the write error that got us here.
      try {
        for (const layer of new Set(entries.map((entry) => entry.layer))) {
          const grid = await readLayerKeycodes(this.#client, layer, layout.matrixRows, layout.matrixCols);
          this.#store.setLayerKeycodes(layer, layout.keys.map(({ matrix: [row, col] }) => grid[row][col]));
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (this.#store.drafts.size) throw new Error("書き込み後の照合に失敗しました。未反映の変更は残してあります。");
    return entries.length;
  }

  /**
   * Overwrites all mapped keys with this editor's own bundled copy of
   * main's default/keymap.c (see app.js's updateToLatestLayout) -- this is
   * this page's own local data, not fetched from anywhere, so it's already
   * trustworthy; the one thing still worth guarding is the device's own
   * reported layer count, in case its firmware predates a layer main has
   * since added (writing past that would address a layer VIA doesn't know
   * about).
   */
  async updateToLatest(layers, onProgress) {
    const { layout, layerCount } = this.#store;
    if (!this.#client || this.#store.connectionState !== "connected") throw new Error("実機に接続してください。");
    if (layers.length !== layerCount) {
      throw new Error("最新版レイアウトのレイヤー数が実機のファームウェアと一致しません。ファームウェアを書き込み直してください。");
    }
    try {
      const written = await overwriteKeymap(this.#client, layout, layers, onProgress);
      written.forEach((values, layer) => this.#store.setLayerKeycodes(layer, values));
    } catch (error) {
      if (this.#client) await this.reloadAllLayers().catch(() => {});
      throw error;
    }
  }

  /** Restores the keyboard's dynamic keymap to its flashed firmware defaults, then reloads. */
  async resetToFirmwareDefaults() {
    await this.#client.resetKeymap();
    await this.reloadAllLayers();
  }
}
