import { test } from "node:test";
import assert from "node:assert/strict";
import { decode, encode, withHoldLayer, holdLayerOf, tapKeycodeOf, isLayerTapKeycode, withMods, wrapModsOf, NO_MODS } from "../public/keycodes/keycode-codec.js";

// Real values pulled from kerigokbd.h / kerigokbd_v2's keymap.c, computed by
// hand from QMK's documented bit-packing formulas, used here as ground
// truth so the codec is checked against the actual firmware, not just
// against itself.
const KC_ESC = 0x29;
const KC_SPC = 0x2c;
const KC_PSCR = 0x46;
const JP_HENK = 0x8a; // KC_INT4
const JP_MHEN = 0x8b; // KC_INT5
const KGL_MAIN = 0, KGL_NUM = 1, KGL_EXT = 3;

test("none and transparent", () => {
  assert.deepEqual(decode(0x0000), { kind: "none" });
  assert.deepEqual(decode(0x0001), { kind: "transparent" });
  assert.equal(encode({ kind: "none" }), 0x0000);
  assert.equal(encode({ kind: "transparent" }), 0x0001);
});

test("basic keycode passes through unchanged", () => {
  assert.deepEqual(decode(KC_SPC), { kind: "basic", value: KC_SPC });
  assert.equal(encode({ kind: "basic", value: KC_SPC }), KC_SPC);
});

test("KG_ESC = LT(KGL_EXT, KC_ESC)", () => {
  const value = 0x4329;
  assert.deepEqual(decode(value), { kind: "layerTap", layer: KGL_EXT, keycode: KC_ESC });
  assert.equal(encode({ kind: "layerTap", layer: KGL_EXT, keycode: KC_ESC }), value);
});

test("KG_NUM = MO(KGL_NUM)", () => {
  const value = 0x5221;
  assert.deepEqual(decode(value), { kind: "momentaryLayer", layer: KGL_NUM });
  assert.equal(encode({ kind: "momentaryLayer", layer: KGL_NUM }), value);
});

test("KG_MAIN = TO(KGL_MAIN)", () => {
  const value = 0x5200;
  assert.deepEqual(decode(value), { kind: "toLayer", layer: KGL_MAIN });
  assert.equal(encode({ kind: "toLayer", layer: KGL_MAIN }), value);
});

test("KG_LALT = LALT_T(JP_MHEN)", () => {
  const value = 0x248b;
  const descriptor = { kind: "modTap", mods: { ctrl: false, shift: false, alt: true, gui: false, right: false }, keycode: JP_MHEN };
  assert.deepEqual(decode(value), descriptor);
  assert.equal(encode(descriptor), value);
});

test("KG_L4 = LWIN_T(JP_HENK) (LGUI_T under the hood)", () => {
  const value = 0x288a;
  const descriptor = { kind: "modTap", mods: { ctrl: false, shift: false, alt: false, gui: true, right: false }, keycode: JP_HENK };
  assert.deepEqual(decode(value), descriptor);
  assert.equal(encode(descriptor), value);
});

test("KG_R4 = RSFT_T(MS_BTN1)", () => {
  const MS_BTN1 = 0xd1;
  const value = 0x2000 | (0x12 << 8) | MS_BTN1; // MT(MOD_RSFT, MS_BTN1)
  const descriptor = { kind: "modTap", mods: { ctrl: false, shift: true, alt: false, gui: false, right: true }, keycode: MS_BTN1 };
  assert.deepEqual(decode(value), descriptor);
  assert.equal(encode(descriptor), value);
});

test("KG_APRS = A(KC_PSCR)", () => {
  const value = 0x0446;
  const descriptor = { kind: "mods", mods: { ctrl: false, shift: false, alt: true, gui: false, right: false }, keycode: KC_PSCR };
  assert.deepEqual(decode(value), descriptor);
  assert.equal(encode(descriptor), value);
});

test("C(KC_Z) used in the Extra layer", () => {
  const KC_Z = 0x1d;
  const value = 0x0100 | KC_Z; // LCTL(KC_Z)
  const descriptor = { kind: "mods", mods: { ctrl: true, shift: false, alt: false, gui: false, right: false }, keycode: KC_Z };
  assert.deepEqual(decode(value), descriptor);
  assert.equal(encode(descriptor), value);
});

test("DF/TG/OSL layer actions round-trip", () => {
  for (const kind of ["defaultLayer", "toggleLayer", "oneShotLayer"]) {
    for (const layer of [0, 1, 6, 31]) {
      const descriptor = { kind, layer };
      assert.deepEqual(decode(encode(descriptor)), descriptor, `${kind}(${layer})`);
    }
  }
});

test("mods descriptor rejects an empty modifier set", () => {
  assert.throws(() => encode({ kind: "mods", mods: { ctrl: false, shift: false, alt: false, gui: false, right: false }, keycode: 0x04 }));
});

test("round-trips every basic (non-packed) 16-bit value not otherwise claimed by a packed range", () => {
  const sample = [0x0002, 0x00ff, 0x7840, 0x7e01, 0x7c00];
  for (const value of sample) {
    const descriptor = decode(value);
    assert.equal(descriptor.kind, "basic");
    assert.equal(encode(descriptor), value);
  }
});

test("withHoldLayer wraps a basic key in LT() and unwraps it again", () => {
  const lt = withHoldLayer(0x0029, 3); // KC_ESC -> LT(3, KC_ESC)
  assert.equal(lt, 0x4329);
  assert.equal(holdLayerOf(lt), 3);
  assert.equal(tapKeycodeOf(lt), 0x0029);
  assert.equal(withHoldLayer(lt, 1), 0x4129); // change the hold layer, keep the tap key
  assert.equal(withHoldLayer(lt, null), 0x0029);
});

test("withHoldLayer leaves values without a basic tap key alone, and rewraps a mod-tap's key", () => {
  assert.equal(withHoldLayer(0x0000, 1), null); // KC_NO
  assert.equal(withHoldLayer(0x0001, 1), null); // KC_TRNS
  assert.equal(withHoldLayer(0x5221, 2), null); // MO(1)
  assert.equal(withHoldLayer(0x2229, 2), 0x4229); // LSFT_T(KC_ESC) -> LT(2, KC_ESC)
  assert.equal(isLayerTapKeycode(0x0204), false); // S(KC_A)
});

test("withMods wraps a basic key in modifiers and unwraps it again", () => {
  const altPscr = withMods(0x0046, { ...NO_MODS, alt: true }); // LALT(KC_PSCR)
  assert.equal(altPscr, 0x0446);
  assert.deepEqual(wrapModsOf(altPscr), { mods: { ...NO_MODS, alt: true }, mode: "with" });
  assert.equal(withMods(altPscr, { ...NO_MODS, ctrl: true, shift: true }), 0x0346); // C(S(KC_PSCR))
  assert.equal(withMods(altPscr, { ...NO_MODS, alt: true, right: true }), 0x1446); // RALT(KC_PSCR)
  assert.equal(withMods(altPscr, NO_MODS), 0x0046);
  assert.equal(withMods(0x4329, { ...NO_MODS, gui: true }), 0x0829); // LT(3, KC_ESC) -> LGUI(KC_ESC)
  assert.equal(withMods(0x5221, { ...NO_MODS, gui: true }), null); // MO(1) has no tap key
});

test("withMods in tap mode builds a mod-tap and switches back to a mods wrap", () => {
  const ctlA = withMods(0x0004, { ...NO_MODS, ctrl: true }, "tap"); // LCTL_T(KC_A)
  assert.equal(ctlA, 0x2104);
  assert.deepEqual(wrapModsOf(ctlA), { mods: { ...NO_MODS, ctrl: true }, mode: "tap" });
  assert.equal(withMods(ctlA, { ...NO_MODS, shift: true, right: true }, "tap"), 0x3204); // RSFT_T(KC_A)
  assert.equal(withMods(ctlA, { ...NO_MODS, ctrl: true }, "with"), 0x0104); // C(KC_A)
  assert.equal(withMods(ctlA, NO_MODS, "tap"), 0x0004);
});
