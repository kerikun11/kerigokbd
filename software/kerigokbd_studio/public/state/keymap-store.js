// In-memory state for the editor, independent of the DOM and of WebHID.
// Consumers subscribe to be notified after any change and re-render from
// the current snapshot; this module never touches the document itself.

const keyId = (layer, row, col) => `${layer},${row},${col}`;
const draftId = (layer, keyIndex) => `${layer},${keyIndex}`;

/** How many keys hold a different value in two keymaps (keys either side lacks are skipped). */
export function diffKeymaps(a, b) {
  let count = 0;
  a.forEach((values, layer) => values?.forEach((value, keyIndex) => {
    const other = b[layer]?.[keyIndex];
    if (value !== undefined && other !== undefined && value !== other) count++;
  }));
  return count;
}

export class KeymapStore extends EventTarget {
  keyboardId = null;
  layout = null;
  // defaults.layers[layerIndex][keyIndex] is main's default/keymap.c (the
  // GitHub latest layout, not necessarily what the device's firmware was
  // built from), indexed exactly like `layers` below, used to highlight
  // keys that differ from it on the live device.
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
  // Edits staged in the editor but not yet written to the device, keyed by
  // `${layer},${keyIndex}`. Nothing reaches the keyboard until the person
  // explicitly writes them (SyncEngine.writeDrafts), so a stray click in
  // the picker can't silently change the live keymap.
  drafts = new Map();

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
    this.drafts.clear();
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
    // A draft the device now already holds has nothing left to write.
    keycodesByKeyIndex.forEach((value, keyIndex) => {
      if (this.drafts.get(draftId(layerIndex, keyIndex)) === value) this.drafts.delete(draftId(layerIndex, keyIndex));
    });
    this.#notify();
  }

  /**
   * Replaces the whole live keymap at once, e.g. after connecting a
   * (possibly different) device; drafts for layers it no longer has are dropped.
   */
  setAllLayerKeycodes(layers) {
    this.layers = [];
    for (const [id] of this.drafts) {
      if (Number(id.split(",")[0]) >= layers.length) this.drafts.delete(id);
    }
    layers.forEach((values, layerIndex) => this.setLayerKeycodes(layerIndex, values));
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

  /** The value the editor shows for a key: its staged draft if any, else the live device value. */
  effectiveKeycodeAt(layerIndex, keyIndex) {
    return this.drafts.get(draftId(layerIndex, keyIndex)) ?? this.keycodeAt(layerIndex, keyIndex);
  }

  /** Stages an edit; staging the value the device already holds just drops the draft. */
  setDraft(layerIndex, keyIndex, value) {
    if (value === this.keycodeAt(layerIndex, keyIndex)) this.drafts.delete(draftId(layerIndex, keyIndex));
    else this.drafts.set(draftId(layerIndex, keyIndex), value);
    this.#notify();
  }

  /**
   * Stages two keys' shown values (draft, else live) swapped with each other,
   * e.g. { layer: 0, keyIndex: 3 } and { layer: 1, keyIndex: 7 }. Returns
   * false (staging nothing) if either key hasn't been read yet.
   */
  swapKeys(a, b) {
    const valueA = this.effectiveKeycodeAt(a.layer, a.keyIndex);
    const valueB = this.effectiveKeycodeAt(b.layer, b.keyIndex);
    if (valueA === undefined || valueB === undefined) return false;
    for (const [{ layer, keyIndex }, value] of [[a, valueB], [b, valueA]]) {
      if (value === this.keycodeAt(layer, keyIndex)) this.drafts.delete(draftId(layer, keyIndex));
      else this.drafts.set(draftId(layer, keyIndex), value);
    }
    this.#notify();
    return true;
  }

  clearDraft(layerIndex, keyIndex) {
    this.drafts.delete(draftId(layerIndex, keyIndex));
    this.#notify();
  }

  clearDrafts() {
    this.drafts.clear();
    this.#notify();
  }

  /** The keymap the editor currently shows (drafts over live values), or null before any has been read. */
  editorKeymap() {
    if (!this.layers.some(Boolean)) return null;
    return this.layers.map((values, layerIndex) => values?.map((_, keyIndex) => this.effectiveKeycodeAt(layerIndex, keyIndex)));
  }

  /**
   * Stages `layers` as drafts against the live values, replacing any other
   * drafts -- e.g. carrying the keymap edited on one half of a split
   * keyboard over to the other half. Returns how many keys now differ.
   */
  stageKeymap(layers) {
    this.drafts.clear();
    layers.forEach((values, layerIndex) => values?.forEach((value, keyIndex) => {
      const live = this.keycodeAt(layerIndex, keyIndex);
      if (value !== undefined && live !== undefined && value !== live) this.drafts.set(draftId(layerIndex, keyIndex), value);
    }));
    this.#notify();
    return this.drafts.size;
  }

  hasDraft(layerIndex, keyIndex) {
    return this.drafts.has(draftId(layerIndex, keyIndex));
  }

  layerHasDrafts(layerIndex) {
    return this.draftEntries().some(({ layer }) => layer === layerIndex);
  }

  /** Staged edits as {layer, keyIndex, value}, ordered by layer then key. */
  draftEntries() {
    return [...this.drafts]
      .map(([id, value]) => {
        const [layer, keyIndex] = id.split(",").map(Number);
        return { layer, keyIndex, value };
      })
      .sort((a, b) => a.layer - b.layer || a.keyIndex - b.keyIndex);
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
   * True if this key's shown value (draft, else live) differs from the
   * GitHub latest layout (undefined -> false, since "not yet read" isn't
   * "changed"). Layers beyond what default/keymap.c defines simply have no
   * default to compare against.
   */
  isChangedFromLatest(layerIndex, keyIndex) {
    const defaultValue = this.defaults?.layers?.[layerIndex]?.[keyIndex];
    if (defaultValue === undefined) return false;
    const value = this.effectiveKeycodeAt(layerIndex, keyIndex);
    if (value === undefined) return false;
    return value !== defaultValue;
  }
}
