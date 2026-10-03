import { test } from "node:test";
import assert from "node:assert/strict";
import { NO_HOLD, pickerWrapOf, isSettingUpHold } from "../public/state/picker-wrap.js";
import { NO_MODS } from "../public/keycodes/keycode-codec.js";

const mods = (overrides) => ({ ...NO_MODS, ...overrides });

test("a plain key has no hold and no 同時押し modifiers", () => {
  assert.deepEqual(pickerWrapOf(0x0004), { hold: NO_HOLD, withMods: NO_MODS }); // KC_A
  assert.deepEqual(pickerWrapOf(undefined), { hold: NO_HOLD, withMods: NO_MODS });
});

test("LT / MO / MT map to their 長押し type", () => {
  assert.deepEqual(pickerWrapOf(0x4329).hold, { ...NO_HOLD, type: "lt", layer: 3 }); // LT(3, KC_ESC)
  assert.deepEqual(pickerWrapOf(0x5221).hold, { ...NO_HOLD, type: "mo", layer: 1 }); // MO(1)
  assert.deepEqual(pickerWrapOf(0x2104).hold, { ...NO_HOLD, type: "mt", mods: mods({ ctrl: true }) }); // LCTL_T(KC_A)
});

test("a mods wrap maps to 同時押し, not 長押し", () => {
  const { hold, withMods } = pickerWrapOf(0x0446); // LALT(KC_PSCR)
  assert.equal(hold, NO_HOLD);
  assert.deepEqual(withMods, mods({ alt: true }));
});

test("an LT without a layer or an MT without modifiers is still being set up", () => {
  assert.equal(isSettingUpHold({ ...NO_HOLD, type: "lt" }), true);
  assert.equal(isSettingUpHold({ ...NO_HOLD, type: "mt" }), true);
  assert.equal(isSettingUpHold({ ...NO_HOLD, type: "lt", layer: 1 }), false);
  assert.equal(isSettingUpHold({ ...NO_HOLD, type: "mt", mods: mods({ shift: true }) }), false);
  assert.equal(isSettingUpHold(NO_HOLD), false);
});
