import { KEYCODE_DATA } from "../generated/keycodes.js";

export const KEYCODES = KEYCODE_DATA.keycodes;
export const LAYERS = KEYCODE_DATA.layers;
// kerigokbd.h's own `#define KG_X ...` aliases (KG_ESC, KG_NUM, KG_CTTL, ...),
// keyed by the exact numeric value they resolve to. These are the tokens
// kerigokbd's real keymap.c actually uses for composed values (layer-taps,
// mod-taps, layer switches), so the C exporter prefers them over spelling
// the same value out as e.g. `LT(KGL_EXT, KC_ESC)`.
export const MACRO_ALIASES = KEYCODE_DATA.macroAliases;

// Display names for layers.
const LAYER_DISPLAY_NAMES = {
  KGL_MAIN: "Main", KGL_NUM: "Num", KGL_FUN: "Fn", KGL_EXT: "Extra",
  KGL_RES: "Reserved", KGL_CONF: "Config", KGL_AM: "Trackpad",
};

// Display order and titles for the keycode picker's category tabs.
export const CATEGORIES = [
  { key: "letters_numbers", title: "文字・数字" },
  { key: "punctuation", title: "記号・編集" },
  { key: "modifiers", title: "修飾キー" },
  { key: "navigation", title: "ナビゲーション" },
  { key: "function", title: "ファンクション" },
  { key: "numpad", title: "Num Pad" },
  { key: "media_system", title: "メディア/システム" },
  { key: "mouse", title: "マウス" },
  { key: "rgb", title: "RGB" },
  { key: "japanese", title: "日本語配列" },
  { key: "kerigokbd", title: "KERIgoKBD固有" },
  { key: "special", title: "特殊" },
];

// Priority used to pick ONE canonical display symbol when several symbols
// share the same numeric value (e.g. KC_A === JP_A, KC_MINS === JP_MINS).
// "japanese" ranks above generic "punctuation"/"navigation" because
// kerigokbd's own keymap.c uses JP_* names for symbol keys by convention;
// letters/numbers still prefer plain KC_.
const CANONICAL_CATEGORY_ORDER = [
  "letters_numbers", "japanese", "punctuation", "navigation", "function",
  "modifiers", "numpad", "media_system", "mouse", "rgb", "kerigokbd", "special",
];

const byValue = new Map();
for (const entry of KEYCODES) {
  if (!byValue.has(entry.value)) byValue.set(entry.value, []);
  byValue.get(entry.value).push(entry);
}

const canonicalByValue = new Map();
for (const [value, entries] of byValue) {
  const best = [...entries].sort(
    (a, b) => CANONICAL_CATEGORY_ORDER.indexOf(a.category) - CANONICAL_CATEGORY_ORDER.indexOf(b.category),
  )[0];
  canonicalByValue.set(value, best);
}

const bySymbol = new Map(KEYCODES.map((entry) => [entry.symbol, entry]));
const macroAliasByValue = new Map(MACRO_ALIASES.map((entry) => [entry.value, entry.symbol]));

/** All entries (possibly several symbols) sharing this exact numeric value. */
export const entriesForValue = (value) => byValue.get(value) ?? [];

/** The single preferred display entry for a basic (non-composed) keycode value. */
export const canonicalEntryForValue = (value) => canonicalByValue.get(value);

export const entryForSymbol = (symbol) => bySymbol.get(symbol);

/** kerigokbd.h's own KG_* macro name for this exact value, if one exists. */
export const macroAliasForValue = (value) => macroAliasByValue.get(value);

export const entriesByCategory = (category) => KEYCODES.filter((entry) => entry.category === category);

export const layerDisplayName = (layerSymbol) => LAYER_DISPLAY_NAMES[layerSymbol] ?? layerSymbol;

export const layerCount = () => LAYERS.length;

export const layerAt = (index) => LAYERS[index];

/** Index of the layer whose kerigokbd_layers enum symbol is this (e.g. "KGL_NUM"), or -1. */
export const layerIndexBySymbol = (symbol) => LAYERS.findIndex((layer) => layer.symbol === symbol);
