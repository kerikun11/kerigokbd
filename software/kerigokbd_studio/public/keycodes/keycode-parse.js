// Parses the picker's "Any" input -- a raw number (0x4329, 17193) or a
// QMK-style keycode expression as written in keymap.c (KC_A, JP_AT, KG_ESC,
// LT(KGL_EXT, KC_ESC), LALT(KC_PSCR), MT(MOD_LCTL | MOD_LSFT, KC_A), ...)
// -- into a raw 16-bit keycode. Pure: symbols resolve through the generated
// keycode registry, composition through keycode-values.js's formulas.

import {
  QK_LCTL, QK_LSFT, QK_LALT, QK_LGUI, QK_RCTL, QK_RSFT, QK_RALT, QK_RGUI,
  MOD_LCTL, MOD_LSFT, MOD_LALT, MOD_LGUI, MOD_RCTL, MOD_RSFT, MOD_RALT, MOD_RGUI,
  withMod, modTap, layerTap, momentaryLayer, toLayer, defaultLayer, toggleLayer, oneShotLayer,
} from "./keycode-values.js";
import { entryForSymbol, LAYERS, MACRO_ALIASES } from "./keycode-registry.js";

const MOD_CONSTANTS = {
  MOD_LCTL, MOD_LSFT, MOD_LALT, MOD_LGUI, MOD_RCTL, MOD_RSFT, MOD_RALT, MOD_RGUI,
  MOD_LOPT: MOD_LALT, MOD_LCMD: MOD_LGUI, MOD_LWIN: MOD_LGUI,
  MOD_ROPT: MOD_RALT, MOD_RCMD: MOD_RGUI, MOD_RWIN: MOD_RGUI, MOD_ALGR: MOD_RALT,
  MOD_MEH: MOD_LCTL | MOD_LSFT | MOD_LALT, MOD_HYPR: MOD_LCTL | MOD_LSFT | MOD_LALT | MOD_LGUI,
};

// Mod wraps: FN(kc) = QK_xxx | kc (quantum/quantum_keycodes.h).
const MOD_WRAPS = {
  LCTL: QK_LCTL, C: QK_LCTL, LSFT: QK_LSFT, S: QK_LSFT,
  LALT: QK_LALT, A: QK_LALT, LOPT: QK_LALT,
  LGUI: QK_LGUI, G: QK_LGUI, LCMD: QK_LGUI, LWIN: QK_LGUI,
  RCTL: QK_RCTL, RSFT: QK_RSFT, RALT: QK_RALT, ROPT: QK_RALT, ALGR: QK_RALT,
  RGUI: QK_RGUI, RCMD: QK_RGUI, RWIN: QK_RGUI,
  LCS: QK_LCTL | QK_LSFT, LCA: QK_LCTL | QK_LALT, LCG: QK_LCTL | QK_LGUI,
  LSA: QK_LSFT | QK_LALT, LSG: QK_LSFT | QK_LGUI, LAG: QK_LALT | QK_LGUI,
  MEH: QK_LCTL | QK_LSFT | QK_LALT, HYPR: QK_LCTL | QK_LSFT | QK_LALT | QK_LGUI,
};

// Mod-tap shorthands: FN_T(kc) = MT(MOD_xxx, kc).
const MOD_TAPS = {
  LCTL_T: MOD_LCTL, CTL_T: MOD_LCTL, LSFT_T: MOD_LSFT, SFT_T: MOD_LSFT,
  LALT_T: MOD_LALT, ALT_T: MOD_LALT, LOPT_T: MOD_LALT, OPT_T: MOD_LALT,
  LGUI_T: MOD_LGUI, GUI_T: MOD_LGUI, LCMD_T: MOD_LGUI, CMD_T: MOD_LGUI, LWIN_T: MOD_LGUI, WIN_T: MOD_LGUI,
  RCTL_T: MOD_RCTL, RSFT_T: MOD_RSFT, RALT_T: MOD_RALT, ROPT_T: MOD_RALT, ALGR_T: MOD_RALT,
  RGUI_T: MOD_RGUI, RCMD_T: MOD_RGUI, RWIN_T: MOD_RGUI,
  MEH_T: MOD_LCTL | MOD_LSFT | MOD_LALT, HYPR_T: MOD_LCTL | MOD_LSFT | MOD_LALT | MOD_LGUI,
};

const LAYER_FNS = { MO: momentaryLayer, TO: toLayer, DF: defaultLayer, TG: toggleLayer, OSL: oneShotLayer };

const macroAliasBySymbol = new Map(MACRO_ALIASES.map((entry) => [entry.symbol, entry.value]));
const layerIndexBySymbol = new Map(LAYERS.map((layer) => [layer.symbol, layer.index]));

const hex = (value) => `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;

function requireBasic(name, keycode) {
  if (keycode < 0 || keycode > 0xff) throw new Error(`${name}()のキーには基本キー(0x00〜0xFF)のみ指定できます(${hex(keycode)})`);
  return keycode;
}

function requireRange(name, what, value, max) {
  if (value < 0 || value > max) throw new Error(`${name}()の${what}は0〜${max}で指定してください(${value})`);
  return value;
}

function callFunction(name, args) {
  const arity = (count) => {
    if (args.length !== count) throw new Error(`${name}()の引数は${count}個です`);
  };
  if (name === "LT") {
    arity(2);
    return layerTap(requireRange(name, "レイヤー", args[0], 15), requireBasic(name, args[1]));
  }
  if (name === "MT") {
    arity(2);
    return modTap(requireRange(name, "修飾キー", args[0], 0x1f), requireBasic(name, args[1]));
  }
  if (LAYER_FNS[name]) {
    arity(1);
    return LAYER_FNS[name](requireRange(name, "レイヤー", args[0], 31));
  }
  if (MOD_TAPS[name] !== undefined) {
    arity(1);
    return modTap(MOD_TAPS[name], requireBasic(name, args[0]));
  }
  if (MOD_WRAPS[name] !== undefined) {
    arity(1);
    return withMod(MOD_WRAPS[name], args[0]);
  }
  throw new Error(`未対応の関数です: ${name}()`);
}

function resolveSymbol(name) {
  const entry = entryForSymbol(name) ?? entryForSymbol(`KC_${name}`);
  if (entry) return entry.value;
  if (macroAliasBySymbol.has(name)) return macroAliasBySymbol.get(name);
  if (layerIndexBySymbol.has(name)) return layerIndexBySymbol.get(name);
  if (MOD_CONSTANTS[name] !== undefined) return MOD_CONSTANTS[name];
  if (name === "XXXXXXX") return 0x0000;
  if (name === "_______") return 0x0001;
  throw new Error(`不明なキーコードです: ${name}`);
}

function tokenize(text) {
  const tokens = [];
  const pattern = /\s*(?:(0x[0-9a-f]+|\d+)|([A-Za-z_][A-Za-z0-9_]*)|([(),|]))/iy;
  let index = 0;
  while (index < text.length) {
    pattern.lastIndex = index;
    const match = pattern.exec(text);
    if (!match) {
      if (!text.slice(index).trim()) break;
      throw new Error(`解釈できない文字があります: ${text.slice(index).trim()[0]}`);
    }
    if (match[1]) tokens.push({ type: "number", value: Number(match[1]) });
    else if (match[2]) tokens.push({ type: "name", value: match[2].toUpperCase() });
    else tokens.push({ type: match[3] });
    index = pattern.lastIndex;
  }
  return tokens;
}

/**
 * Parses an Any-keycode expression into a raw 16-bit value. Throws an Error
 * with a Japanese message describing what's wrong otherwise.
 */
export function parseKeycodeExpression(text) {
  const tokens = tokenize(text);
  if (!tokens.length) throw new Error("キーコードを入力してください");
  let position = 0;
  const peek = () => tokens[position];
  const expect = (type) => {
    const token = tokens[position++];
    if (token?.type !== type) throw new Error(`「${type}」が必要です`);
    return token;
  };

  // expression := term ('|' term)*
  const expression = () => {
    let value = term();
    while (peek()?.type === "|") {
      position++;
      value |= term();
    }
    return value;
  };
  // term := number | name | name '(' expression (',' expression)* ')'
  const term = () => {
    const token = tokens[position++];
    if (!token) throw new Error("式が途中で終わっています");
    if (token.type === "number") return token.value;
    if (token.type !== "name") throw new Error("キーコードまたは数値が必要です");
    if (peek()?.type !== "(") return resolveSymbol(token.value);
    position++;
    const args = [expression()];
    while (peek()?.type === ",") {
      position++;
      args.push(expression());
    }
    expect(")");
    return callFunction(token.value, args);
  };

  const value = expression();
  if (position < tokens.length) throw new Error("式の後ろに余分な文字があります");
  if (!Number.isInteger(value) || value < 0 || value > 0xffff) throw new Error(`キーコードは0x0000〜0xFFFFの範囲です(${value})`);
  return value;
}
