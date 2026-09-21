// In-memory state for the editor, independent of the DOM and of WebHID.
// Consumers subscribe to be notified after any change and re-render from
// the current snapshot; this module never touches the document itself.

const keyId = (layer, row, col) => `${layer},${row},${col}`;

export class KeymapStore extends EventTarget {
  keyboardId = null;
  layout = null;
  // defaults.layers[layerIndex][keyIndex] is the firmware's as-flashed
  // keycode, indexed exactly like `layers` below, used to highlight keys a
  // user has since changed on the live device.
  defaults = null;
  connectionState = "disconnected"; // disconnected | connecting | connected | error
  connectionError = null;
  protocolVersion = null;
  deviceInfo = null;
  layerCount = null;
  activeLayer = 0;
  selectedKeyIndex = null;
  // layers[layerIndex] is an array of numeric keycodes, indexed the same
  // way as layout.keys (i.e. layers[layerIndex][keyIndex], not [row][col] --
  // that avoids needing row/col -> key-index lookups everywhere else).
  layers = [];
  pendingKeys = new Set(); // `${layer},${row},${col}` currently being written

  #notify() {
    this.dispatchEvent(new CustomEvent("change"));
  }

  setLayout(keyboardId, layout, defaults) {
    this.keyboardId = keyboardId;
    this.layout = layout;
    this.defaults = defaults;
    this.activeLayer = 0;
    this.selectedKeyIndex = null;
    this.layers = [];
    this.#notify();
  }

  setConnectionState(state, error = null) {
    this.connectionState = state;
    this.connectionError = error;
    if (state !== "connected") this.deviceInfo = null;
    this.#notify();
  }

  setProtocolInfo(protocolVersion, layerCount, deviceInfo = null) {
    this.protocolVersion = protocolVersion;
    this.layerCount = layerCount;
    this.deviceInfo = deviceInfo;
    this.#notify();
  }

  /** Replaces every keycode on one layer, e.g. after a bulk read from the device. */
  setLayerKeycodes(layerIndex, keycodesByKeyIndex) {
    this.layers[layerIndex] = keycodesByKeyIndex;
    this.#notify();
  }

  keycodeAt(layerIndex, keyIndex) {
    return this.layers[layerIndex]?.[keyIndex];
  }

  setKeycodeAt(layerIndex, keyIndex, value) {
    if (!this.layers[layerIndex]) this.layers[layerIndex] = [];
    this.layers[layerIndex][keyIndex] = value;
    this.#notify();
  }

  setActiveLayer(layerIndex) {
    this.activeLayer = layerIndex;
    this.selectedKeyIndex = null;
    this.#notify();
  }

  setSelectedKeyIndex(keyIndex) {
    this.selectedKeyIndex = keyIndex;
    this.#notify();
  }

  setPending(layer, row, col, isPending) {
    const id = keyId(layer, row, col);
    if (isPending) this.pendingKeys.add(id);
    else this.pendingKeys.delete(id);
    this.#notify();
  }

  isPending(layer, row, col) {
    return this.pendingKeys.has(keyId(layer, row, col));
  }

  /**
   * True if this key's live value differs from what the firmware flashed
   * (undefined -> false, since "not yet read" isn't "changed"). Layers
   * beyond what default/keymap.c defines (there is none here, since
   * `defaults` is only ever built from the device's own compiled keymap)
   * simply have no default to compare against.
   */
  isChangedFromDefault(layerIndex, keyIndex) {
    const defaultValue = this.defaults?.layers?.[layerIndex]?.[keyIndex];
    if (defaultValue === undefined) return false;
    const liveValue = this.keycodeAt(layerIndex, keyIndex);
    if (liveValue === undefined) return false;
    return liveValue !== defaultValue;
  }
}
