import { test } from "node:test";
import assert from "node:assert/strict";
import { formatKeycodeToken, formatKeymapCSource } from "../public/export/c-source-writer.js";

// Ground truth: these are real assignments from
// software/qmk/keyboards/kerigokbd/kerigokbd_v2/keymaps/default/keymap.c
// and software/qmk/keyboards/kerigokbd/kerigokbd.h, with their numeric
// values hand-computed from QMK's documented bit-packing formulas (see
// keycode-codec.test.js for the derivation of each constant).
test("reproduces plain keycodes", () => {
  assert.equal(formatKeycodeToken(0x0000), "XXXXXXX");
  assert.equal(formatKeycodeToken(0x0001), "_______");
  assert.equal(formatKeycodeToken(0x0004), "KC_A"); // KC_A
});

test("prefers kerigokbd.h's own KG_* alias over expanding a composed value", () => {
  // These are kerigokbd.h's own #define aliases, so the exporter should
  // reproduce that exact short token rather than the much longer
  // LT(KGL_EXT, KC_ESC) / LT(KGL_NUM, JP_MHEN) / TO(KGL_MAIN) /
  // RWIN_T(JP_HENK) / A(KC_PSCR) it would otherwise expand to.
  assert.equal(formatKeycodeToken(0x4329), "KG_ESC");
  assert.equal(formatKeycodeToken(0x418b), "KG_NUM");
  assert.equal(formatKeycodeToken(0x5200), "KG_MAIN");
  assert.equal(formatKeycodeToken(0x388a), "KG_RWIN");
  assert.equal(formatKeycodeToken(0x0446), "KG_APRS");
});

test("falls back to expanding the value when no KG_* alias matches it", () => {
  // C(KC_Z) is used inline in kerigokbd's keymap.c -- there's no KG_*
  // alias for it, so it must still expand correctly.
  assert.equal(formatKeycodeToken(0x011d), "C(KC_Z)");
  // MO(KGL_NUM) was KG_NUM's old definition (now commented out in
  // kerigokbd.h), so it no longer has an alias either.
  assert.equal(formatKeycodeToken(0x5221), "MO(KGL_NUM)");
});

test("unknown values fall back to a hex literal instead of throwing", () => {
  // 0x5AAA does not fall into any packed range this codec understands, and
  // is not a value any curated keycode entry claims -- it should still
  // render as valid (if unlabelled) C rather than crash the export.
  assert.equal(formatKeycodeToken(0x5aaa), "0x5AAA");
});

test("formatKeymapCSource falls back to one-token-per-line when the token count doesn't match a LAYOUT_split_A_B_... shape", () => {
  // Only 2 tokens, which can't be split into LAYOUT_split_6_7_7_4's 48-key
  // shape (6+7+7+4)*2 -- the exporter must not guess wrong, just fall back.
  const source = formatKeymapCSource({
    layers: [[0x0004, 0x0005], [0x0001, 0x0001]],
    layoutMacroName: "LAYOUT_split_6_7_7_4",
  });
  assert.match(source, /^const uint16_t PROGMEM keymaps\[\]\[MATRIX_ROWS\]\[MATRIX_COLS\] = \{/);
  assert.match(source, /\[KGL_MAIN\] = LAYOUT_split_6_7_7_4\( \/\* Default Layer \*\/\n\s+KC_A,\n\s+KC_B\n\s+\),/);
  assert.match(source, /\[KGL_NUM\] = LAYOUT_split_6_7_7_4\( \/\* Numbers and Symbols Layer \*\/\n\s+_______,\n\s+_______\n\s+\),/);
  assert.match(source, /\};$/);
});

test("formatKeymapCSource lays out a matching LAYOUT_split_A_B shape like kerigokbd's hand-aligned keymap.c", () => {
  // A small synthetic "LAYOUT_split_2_1" shape (2+1 keys per hand, 6 keys
  // total) keeps this hand-verifiable while exercising the same alignment
  // rule as the real LAYOUT_split_6_7_7_4: every row's "/**/" gap lands on
  // the same column, and only the last (thumb-like) row gets extra leading
  // indent instead of trailing padding. Expected spacing cross-checked
  // with an independent Python re-implementation of the same formula.
  const source = formatKeymapCSource({
    layers: [[0x0004, 0x0005, 0x0006, 0x0007, 0x0000, 0x0001]], // KC_A, KC_B, KC_C, KC_D, XXXXXXX, _______
    layoutMacroName: "LAYOUT_split_2_1",
  });
  assert.equal(source, [
    "const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {",
    "  [KGL_MAIN] = LAYOUT_split_2_1( /* Default Layer */",
    "    KC_A   , KC_B   , /**/ KC_C   , KC_D   ,",
    "             XXXXXXX, /**/ _______",
    "  ),",
    "};",
  ].join("\n"));
});

test("a shorter non-last row pads BOTH sides of the gap to match the widest row's total width", () => {
  // In LAYOUT_split_6_7_7_4 itself, the real top row (6 per hand, vs 7 for
  // the two rows below it) needs exactly this: kerigokbd_v2's default/
  // keymap.c has 10 spaces on *each* side of "/**/" on that row, not just
  // before it, so every finger row -- and the file's line lengths -- line
  // up. "LAYOUT_split_2_3_1" (max width row in the middle, not first or
  // last) exercises that same padding rule; expected spacing cross-checked
  // with an independent Python re-implementation of the same formula.
  const source = formatKeymapCSource({
    layers: [[
      0x0004, 0x0005, 0x0006, 0x0007, // row0 (2 per hand): KC_A, KC_B | KC_C, KC_D
      0x0008, 0x0009, 0x000a, 0x000b, 0x000c, 0x000d, // row1 (3 per hand, the widest): KC_E, KC_F, KC_G | KC_H, KC_I, KC_J
      0x0000, 0x0001, // row2 (1 per hand, last): XXXXXXX | _______
    ]],
    layoutMacroName: "LAYOUT_split_2_3_1",
  });
  assert.equal(source, [
    "const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {",
    "  [KGL_MAIN] = LAYOUT_split_2_3_1( /* Default Layer */",
    "    KC_A   , KC_B   ,          /**/          KC_C   , KC_D   ,",
    "    KC_E   , KC_F   , KC_G   , /**/ KC_H   , KC_I   , KC_J   ,",
    "                      XXXXXXX, /**/ _______",
    "  ),",
    "};",
  ].join("\n"));
});

test("the very last token of a layer isn't padded, matching kerigokbd_v1's keymap.c (its thumb row ends in the short KG_R4, not padded out)", () => {
  const source = formatKeymapCSource({
    layers: [[0x0004, 0x0005]], // KC_A | KC_B, a single one-key-per-hand row
    layoutMacroName: "LAYOUT_split_1",
  });
  assert.equal(source, [
    "const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {",
    "  [KGL_MAIN] = LAYOUT_split_1( /* Default Layer */",
    "    KC_A   , /**/ KC_B",
    "  ),",
    "};",
  ].join("\n"));
});

test("a long token widens only its own column, not every column of the keymap", () => {
  const source = formatKeymapCSource({
    layers: [
      [0x4104, 0x0005, 0x0006, 0x0007, 0x0000, 0x0001], // LT(KGL_NUM, KC_A), KC_B | KC_C, KC_D ; XXXXXXX | _______
      [0x0001, 0x0001, 0x0001, 0x0001, 0x0001, 0x0001],
    ],
    layoutMacroName: "LAYOUT_split_2_1",
  });
  assert.equal(source, [
    "const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {",
    "  [KGL_MAIN] = LAYOUT_split_2_1( /* Default Layer */",
    "    LT(KGL_NUM, KC_A), KC_B   , /**/ KC_C   , KC_D   ,",
    "                       XXXXXXX, /**/ _______",
    "  ),",
    "  [KGL_NUM] = LAYOUT_split_2_1( /* Numbers and Symbols Layer */",
    "    _______          , _______, /**/ _______, _______,",
    "                       _______, /**/ _______",
    "  ),",
    "};",
  ].join("\n"));
});
