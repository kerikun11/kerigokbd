import { test } from "node:test";
import assert from "node:assert/strict";
import { describeKeycode } from "../public/keycodes/keycode-format.js";

test("none / transparent", () => {
  assert.deepEqual(describeKeycode(0x0000), { main: "", sub: null, empty: true });
  assert.deepEqual(describeKeycode(0x0001), { main: "▽", sub: null, transparent: true });
});

test("basic keycode shows its label", () => {
  assert.deepEqual(describeKeycode(0x0004), { main: "A", sub: null }); // KC_A
});

test("KG_ESC = LT(KGL_EXT, KC_ESC) shows the tap key's symbol suffix with the layer as a sub-label", () => {
  assert.deepEqual(describeKeycode(0x4329), { main: "ESC", sub: "Extra" });
});

test("KG_NUM = MO(KGL_NUM) shows a blank tap with the layer name as a sub-label, matching LT's convention", () => {
  assert.deepEqual(describeKeycode(0x5221), { main: "", sub: "Num" });
});

test("KG_LALT = LALT_T(JP_MHEN) shows the spelled-out modifier name (LALT) as its sub-label by default (edit view: precision over symbols)", () => {
  const result = describeKeycode(0x248b);
  assert.equal(result.sub, "LALT");
});

test("modLabelStyle: 'word' shows the plain 'Alt' word instead, no L/R prefix (cheat sheet: readable text, never an icon/glyph)", () => {
  const result = describeKeycode(0x248b, { modLabelStyle: "word" });
  assert.equal(result.sub, "Alt");
});

test("JP_GRV = S(JP_AT) shows the registered JP_GRV symbol instead of a decomposed mod glyph", () => {
  assert.deepEqual(describeKeycode(0x022f), { main: "GRV", sub: null });
});

test("symbolStyle: 'printable' shows JP_GRV's actual printed character (`) instead of its keymap.c suffix", () => {
  assert.deepEqual(describeKeycode(0x022f, { symbolStyle: "printable" }), { main: "`", sub: null });
});

test("a shift-mod combo with no registered JP_* alias still decomposes, as spelled-out text by default", () => {
  assert.deepEqual(describeKeycode(0x011d), { main: "LCTL+Z", sub: null }); // C(KC_Z)
});

test("...or as 'Ctrl+Z' with modLabelStyle: 'word' (cheat sheet style)", () => {
  assert.deepEqual(describeKeycode(0x011d, { modLabelStyle: "word" }), { main: "Ctrl+Z", sub: null }); // C(KC_Z)
});

test("a modifier-wrapped tap action never gets an L/R prefix -- 'Alt+1', not 'LAlt+1'", () => {
  // A(KC_1) is the Extra layer's actual first key (v1/v2 default keymap.c).
  assert.deepEqual(describeKeycode(0x041e, { modLabelStyle: "word" }), { main: "Alt+1", sub: null });
});

test("a right-side mod-tap gets an R prefix, a left-side one gets L", () => {
  assert.equal(describeKeycode(0x248b).sub, "LALT"); // LALT_T(JP_MHEN)
  assert.equal(describeKeycode(0x32d1).sub, "RSFT"); // KG_R4 = RSFT_T(MS_BTN1), see keycode-codec.test.js
});

test("symbolStyle: 'printable' leaves labels with no printable mapping (e.g. plain letters) unchanged", () => {
  assert.equal(describeKeycode(0x0004, { symbolStyle: "printable" }).main, "A"); // KC_A
});

test("symbolStyle: 'printable' shows the d-pad keys as arrow characters instead of LEFT/DOWN/UP/RGHT", () => {
  assert.equal(describeKeycode(80, { symbolStyle: "printable" }).main, "⬅"); // KC_LEFT
  assert.equal(describeKeycode(81, { symbolStyle: "printable" }).main, "⬇"); // KC_DOWN
  assert.equal(describeKeycode(82, { symbolStyle: "printable" }).main, "⬆"); // KC_UP
  assert.equal(describeKeycode(79, { symbolStyle: "printable" }).main, "➡"); // KC_RGHT
  assert.equal(describeKeycode(80).main, "LEFT"); // default (edit view) suffix, unaffected
});

test("symbolStyle: 'printable' spells out modifier/whitespace/navigation keys assigned directly (not through a mod-tap)", () => {
  assert.equal(describeKeycode(224, { symbolStyle: "printable" }).main, "Ctrl"); // KC_LCTL
  assert.equal(describeKeycode(40, { symbolStyle: "printable" }).main, "Enter"); // KC_ENT
  assert.equal(describeKeycode(224).main, "LCTL"); // default (edit view) suffix, unaffected
});

test("symbolStyle: 'printable' spells out Delete in full (never an icon at the label level -- that's cheat-sheet-icons.js's call)", () => {
  const KC_DEL = 76;
  assert.equal(describeKeycode(KC_DEL, { symbolStyle: "printable" }).main, "Delete");
  assert.equal(describeKeycode(KC_DEL).main, "DEL"); // default (edit view) suffix, unaffected
});

test("modLabelStyle: 'word' never adds an L/R prefix on a mod-tap either, unlike 'text'", () => {
  assert.equal(describeKeycode(0x248b, { modLabelStyle: "word" }).sub, "Alt"); // LALT_T(JP_MHEN)
  assert.equal(describeKeycode(0x32d1, { modLabelStyle: "word" }).sub, "Shift"); // KG_R4 = RSFT_T(MS_BTN1)
});

test("strips the known symbol prefix for every category, not just KC_", () => {
  assert.equal(describeKeycode(0x7e0a).main, "SCRL"); // KG_SCRL (QK_KB_10)
  assert.equal(describeKeycode(0x7842).main, "TOGG"); // RM_TOGG
  assert.equal(describeKeycode(0xcf).main, "LEFT"); // MS_LEFT
  assert.equal(describeKeycode(0x7c00).main, "BOOT"); // QK_BOOT
});

test("unknown value falls back to a hex label instead of throwing", () => {
  assert.deepEqual(describeKeycode(0x5aaa), { main: "0x5AAA", sub: null });
});

test("KG_WCAD displays its fixed tap and hold actions", () => {
  assert.deepEqual(describeKeycode(0x7e00), { main: "CAD", sub: "LWIN" });
  assert.deepEqual(describeKeycode(0x7e00, { modLabelStyle: "word" }), { main: "Ctrl+Alt+Del", sub: "Win" });
});

test("KG_ATAB displays Alt+Tab on tap and Alt on hold", () => {
  assert.deepEqual(describeKeycode(0x7e01), { main: "Alt+Tab", sub: "LALT" });
  assert.deepEqual(describeKeycode(0x7e01, { modLabelStyle: "word" }), { main: "Alt+Tab", sub: "Alt" });
});
