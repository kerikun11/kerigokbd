// Numeric keycode bit-packing constants and composition/decomposition
// helpers, mirroring QMK's quantum/quantum_keycodes.h and quantum/keycodes.h
// exactly (base values and shift amounts copied verbatim from those
// headers). These formulas are QMK's stable public ABI, so they are safe
// to re-implement here rather than transcribe from a generated table.

export const QK_MOD_TAP = 0x2000;
export const QK_LAYER_TAP = 0x4000;
export const QK_LAYER_MOD = 0x5000;
export const QK_TO = 0x5200;
export const QK_MOMENTARY = 0x5220;
export const QK_DEF_LAYER = 0x5240;
export const QK_TOGGLE_LAYER = 0x5260;
export const QK_ONE_SHOT_LAYER = 0x5280;
export const QK_ONE_SHOT_MOD = 0x52a0;

export const QK_LCTL = 0x0100;
export const QK_LSFT = 0x0200;
export const QK_LALT = 0x0400;
export const QK_LGUI = 0x0800;
export const QK_RMODS_MIN = 0x1000;
export const QK_RCTL = 0x1100;
export const QK_RSFT = 0x1200;
export const QK_RALT = 0x1400;
export const QK_RGUI = 0x1800;

export const MODS_RANGE_MIN = QK_LCTL;
export const MODS_RANGE_MAX = QK_RGUI | 0xff;

// 5-bit packed modifiers (quantum/modifiers.h), used by MT()/mod-tap keys.
export const MOD_LCTL = 0x01;
export const MOD_LSFT = 0x02;
export const MOD_LALT = 0x04;
export const MOD_LGUI = 0x08;
export const MOD_RCTL = 0x11;
export const MOD_RSFT = 0x12;
export const MOD_RALT = 0x14;
export const MOD_RGUI = 0x18;

export const MOD_BIT_TO_QK_MOD = new Map([
  [MOD_LCTL, QK_LCTL], [MOD_LSFT, QK_LSFT], [MOD_LALT, QK_LALT], [MOD_LGUI, QK_LGUI],
  [MOD_RCTL, QK_RCTL], [MOD_RSFT, QK_RSFT], [MOD_RALT, QK_RALT], [MOD_RGUI, QK_RGUI],
]);

/** LCTL()/LSFT()/LALT()/LGUI()/RCTL()/RSFT()/RALT()/RGUI(): mods(kc) = QK_xxx | kc */
export const withMod = (modBase, keycode) => modBase | keycode;

/** MT(mod, kc): mod-tap, mod is a 5-bit packed modifier (MOD_LCTL, MOD_RSFT, ...) */
export const modTap = (mod, keycode) => QK_MOD_TAP | ((mod & 0x1f) << 8) | (keycode & 0xff);

/** LT(layer, kc): layer-tap, layer is 4 bits (0-15) */
export const layerTap = (layer, keycode) => QK_LAYER_TAP | ((layer & 0xf) << 8) | (keycode & 0xff);

/** MO(layer): momentary layer, layer is 5 bits (0-31) */
export const momentaryLayer = (layer) => QK_MOMENTARY | (layer & 0x1f);

/** TO(layer): activate layer and deactivate all others */
export const toLayer = (layer) => QK_TO | (layer & 0x1f);

/** DF(layer): set default layer */
export const defaultLayer = (layer) => QK_DEF_LAYER | (layer & 0x1f);

/** TG(layer): toggle layer on/off */
export const toggleLayer = (layer) => QK_TOGGLE_LAYER | (layer & 0x1f);

/** OSL(layer): one-shot layer */
export const oneShotLayer = (layer) => QK_ONE_SHOT_LAYER | (layer & 0x1f);

export const getModsFromValue = (value) => (value >> 8) & 0x1f;
export const getBasicKeycodeFromValue = (value) => value & 0xff;
export const getLayerFromRange = (value) => value & 0x1f;
