import { test } from "node:test";
import assert from "node:assert/strict";
import { keycodeDescription } from "../public/keycodes/keycode-description.js";
import { KEYCODE_DATA } from "../public/generated/keycodes.js";
import { canonicalEntryForValue } from "../public/keycodes/keycode-registry.js";

test("symbols spell out the character they type on the Japanese layout", () => {
  assert.equal(keycodeDescription(0x002e), "「^」(キャレット)"); // JP_CIRC
  assert.equal(keycodeDescription(0x008b), "無変換"); // JP_MHEN
});

test("special values explain themselves", () => {
  assert.equal(keycodeDescription(0x0000), "何もしない");
  assert.equal(keycodeDescription(0x0001), "下のレイヤーと同じ");
});

test("letters and digits need no description", () => {
  assert.equal(keycodeDescription(0x0004), null); // KC_A
  assert.equal(keycodeDescription(0x001e), null); // KC_1
});

test("composed keys are described from their parts", () => {
  assert.equal(keycodeDescription(0x418b), "タップで無変換、長押しでNumレイヤー"); // LT(KGL_NUM, JP_MHEN)
  assert.equal(keycodeDescription(0x32d1), "タップで左クリック、長押しで右Shift"); // RSFT_T(MS_BTN1)
  assert.equal(keycodeDescription(0x0446), "左Altを押しながらPrint Screen(画面キャプチャ)"); // A(KC_PSCR)
  assert.equal(keycodeDescription(0x5221), "押している間だけNumレイヤー"); // MO(KGL_NUM)
  assert.equal(keycodeDescription(0x5200), "Mainレイヤーに切り替える(押し続けなくてよい)"); // TO(KGL_MAIN)
  assert.equal(keycodeDescription(0x4104), "タップでA、長押しでNumレイヤー"); // LT(KGL_NUM, KC_A)
});

test("every registered key other than letters and digits has a description", () => {
  const missing = KEYCODE_DATA.keycodes
    .map((entry) => canonicalEntryForValue(entry.value))
    .filter((entry) => !/^(KC|JP)_[A-Z0-9]$/.test(entry.symbol))
    .filter((entry) => keycodeDescription(entry.value) === null)
    .map((entry) => entry.symbol);
  assert.deepEqual([...new Set(missing)], []);
});
