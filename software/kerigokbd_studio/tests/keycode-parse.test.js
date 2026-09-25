import { test } from "node:test";
import assert from "node:assert/strict";
import { parseKeycodeExpression as parse } from "../public/keycodes/keycode-parse.js";

test("raw numbers and plain symbols", () => {
  assert.equal(parse("0x4329"), 0x4329);
  assert.equal(parse("41"), 0x0029);
  assert.equal(parse("KC_A"), 0x0004);
  assert.equal(parse("kc_esc"), 0x0029);
  assert.equal(parse("ESC"), 0x0029); // KC_ prefix is optional
  assert.equal(parse("XXXXXXX"), 0x0000);
  assert.equal(parse("_______"), 0x0001);
});

test("layer functions accept layer symbols and numbers", () => {
  assert.equal(parse("LT(KGL_EXT, KC_ESC)"), 0x4329);
  assert.equal(parse("MO(1)"), 0x5221);
  assert.equal(parse("TO(KGL_NUM)"), 0x5201);
  assert.equal(parse("TG(2)"), 0x5262);
  assert.equal(parse("OSL(3)"), 0x5283);
});

test("mod wraps, mod-taps and MOD_ bit masks", () => {
  assert.equal(parse("LALT(KC_PSCR)"), 0x0446);
  assert.equal(parse("C(S(KC_A))"), 0x0304);
  assert.equal(parse("LCTL_T(KC_A)"), 0x2104);
  assert.equal(parse("RSFT_T(KC_A)"), 0x3204);
  assert.equal(parse("MT(MOD_LCTL | MOD_LSFT, KC_A)"), 0x2304);
});

test("invalid expressions report a reason", () => {
  assert.throws(() => parse(""), /入力/);
  assert.throws(() => parse("KC_NOPE_X"), /不明/);
  assert.throws(() => parse("LT(16, KC_A)"), /0〜15/);
  assert.throws(() => parse("LT(1, S(KC_A))"), /基本キー/);
  assert.throws(() => parse("MO(1"), /\)/);
  assert.throws(() => parse("0x10000"), /範囲/);
  assert.throws(() => parse("FOO(KC_A)"), /未対応/);
});
