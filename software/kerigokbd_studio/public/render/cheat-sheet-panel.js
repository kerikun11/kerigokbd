import { layerIndexBySymbol } from "../keycodes/keycode-registry.js";
import { renderCheatSheet } from "./cheat-sheet.js";
import { renderLayerToggles } from "./layer-toggles.js";

/**
 * One layer's keycode, per key index, preferring the live value read from
 * the device but falling back to the firmware-flashed default so the cheat
 * sheet is still useful before a device is ever connected. Returns
 * undefined for a layer this keyboard/layout doesn't have at all.
 */
function layerKeycodes(store, layerSymbol) {
  const layerIndex = layerIndexBySymbol(layerSymbol);
  if (layerIndex < 0 || layerIndex >= store.layout.layerCount) return undefined;
  const live = store.layers[layerIndex];
  const defaults = store.defaults?.layers?.[layerIndex];
  if (!live && !defaults) return undefined;
  return store.layout.keys.map((_, keyIndex) => live?.[keyIndex] ?? defaults?.[keyIndex]);
}

/**
 * The cheat-sheet mode's own controls and content: the 表示するレイヤー
 * toggles, the legend items (text and sample key) they show/hide, and the
 * keyboard itself (only drawn while `visible`, since it's the costly part).
 * `visibility` is {nums, func, extra, mouse}; `onToggle(key, checked)`.
 */
export function renderCheatSheetPanel(elements, { store, visibility, visible }, onToggle) {
  const hasTrackpad = Boolean(store.layout.trackpad);
  renderLayerToggles(elements.layerToggles, { visibility, showMouseToggle: hasTrackpad }, onToggle);

  const shown = {
    nums: visibility.nums,
    func: visibility.func,
    extra: visibility.extra,
    mouse: hasTrackpad && visibility.mouse,
  };
  // The text legend and the sample-key legend image follow the same rules.
  for (const [key, legendItem, guideLabel] of [
    ["nums", elements.cheatLegendNumsItem, elements.cheatGuideNums],
    ["func", elements.cheatLegendFuncItem, elements.cheatGuideFunc],
    ["extra", elements.cheatLegendExtraItem, elements.cheatGuideExtra],
    ["mouse", elements.cheatLegendMouseItem, elements.cheatGuideMouse],
  ]) {
    legendItem.hidden = !shown[key];
    guideLabel.hidden = !shown[key];
  }
  // Mouse click/move keycodes (MS_BTN*, KG_MSL/D/U/R, KG_MWLL/D/U/R) live on
  // the Fn layer on every keyboard, trackpad or not -- only the Trackpad
  // group's scroll mode is specific to the trackpad-only Auto Mouse
  // layer, so that's the sole group gated on the trackpad.
  elements.iconLegendMouseGroup.hidden = false;
  elements.iconLegendTrackpadGroup.hidden = !hasTrackpad;

  if (!visible) return;
  renderCheatSheet(elements.cheatSheetView, {
    layout: store.layout,
    main: layerKeycodes(store, "KGL_MAIN"),
    nums: shown.nums ? layerKeycodes(store, "KGL_NUM") : undefined,
    func: shown.func ? layerKeycodes(store, "KGL_FUN") : undefined,
    extra: shown.extra ? layerKeycodes(store, "KGL_EXT") : undefined,
    mouse: shown.mouse ? layerKeycodes(store, "KGL_AM") : undefined,
  });
}
