import { test } from "node:test";
import assert from "node:assert/strict";
import { describeCheatSheetKey } from "../public/keycodes/cheat-sheet-labels.js";

test("shows the Main label, and passes through Num/Fn labels that differ from it", () => {
  const result = describeCheatSheetKey({ main: 0x0004, nums: 0x0005, func: 0x0006 }); // KC_A, KC_B, KC_C
  assert.equal(result.main, "A");
  assert.equal(result.nums, "B");
  assert.equal(result.func, "C");
  assert.equal(result.hold, null);
});

test("an explicit Num reassignment still shows even when it renders identically to Main -- that's a real fact about the keymap, not noise", () => {
  // The real "." key: Main is JP_DOT, and Num explicitly reassigns JP_DOT
  // again (keeping "." reachable while Num is held) instead of leaving it
  // transparent -- the cheat sheet should say so, not hide it as redundant.
  // Num never dedupes against Main (unlike Fn/Trackpad -- see the per-layer
  // tests below), matching keymap_viewer's own layer_label()/
  // auto_mouse_label() rules.
  const result = describeCheatSheetKey({ main: 55, nums: 55 }); // JP_DOT on both Main and Num
  assert.equal(result.main, ".");
  assert.equal(result.nums, ".");
});

test("a Fn reassignment identical to Main's tap label is deduped and hidden", () => {
  const result = describeCheatSheetKey({ main: 0x0004, func: 0x0004 }); // KC_A on both Main and Fn
  assert.equal(result.func, null);
});

test("Trackpad layer pass-through duplicates of Main's tap label are deduped and hidden -- the AutoMouse layer copies most of Main (Enter, Tab, Ctrl, ...) so typing keeps working while the trackpad is touched, and re-showing every one of those would bury the keys that are actually mouse-specific", () => {
  const result = describeCheatSheetKey({ main: 0x0004, mouse: 0x0004 }); // KC_A on both Main and Trackpad
  assert.equal(result.mouse, null);
});

test("Trackpad layer is also deduped against Main's own Hold label, not just its tap label", () => {
  // Main is LALT_T(JP_MHEN) -- tap "無変換", Hold "Alt". Trackpad plainly
  // retypes KC_LALT ("Alt") as its pass-through copy of the held modifier;
  // that's a match against Main's *Hold* label, not its tap label, and
  // should still be deduped away.
  const result = describeCheatSheetKey({ main: 0x248b, mouse: 0xe2 }); // LALT_T(JP_MHEN) / KC_LALT
  assert.equal(result.hold, "Alt");
  assert.equal(result.mouse, null);
});

test("Extra layer's own →Main (TO(KGL_MAIN), the built-in way back) is always hidden, even though other explicit Extra reassignments are not", () => {
  const result = describeCheatSheetKey({ main: 0x0004, extra: 0x5200 }); // TO(KGL_MAIN) on Extra
  assert.equal(result.extra, null);
});

test("a transparent Num/Fn value is hidden, not shown as the transparent glyph", () => {
  const result = describeCheatSheetKey({ main: 0x0004, nums: 0x0001, func: 0x0001 }); // _______
  assert.equal(result.nums, null);
  assert.equal(result.func, null);
});

test("KG_ESC = LT(KGL_EXT, KC_ESC) shows the readable 'Esc' as Main and Extra as Hold", () => {
  const result = describeCheatSheetKey({ main: 0x4329 });
  assert.equal(result.main, "Esc"); // not "ESC" -- see PRINTABLE_SYMBOL_LABELS in keycode-format.js
  assert.equal(result.hold, "Extra");
});

test("dedup against the Hold label is an exact match, not a substring check", () => {
  // TO(KGL_EXT) shows as "→Extra", which is close to but not identical to
  // KG_ESC's own Hold label ("Extra") -- it must still be shown, confirming
  // the dedup only ever hides an exact duplicate.
  const result = describeCheatSheetKey({ main: 0x4329, nums: 0x5203 }); // KG_ESC main, TO(KGL_EXT) on Num
  assert.equal(result.hold, "Extra");
  assert.equal(result.nums, "→Extra");
});

test("KC_NO is empty, not a Main label", () => {
  const result = describeCheatSheetKey({ main: 0x0000 });
  assert.equal(result.main, "");
  assert.equal(result.empty, true);
});

test("a transparent Main value renders the transparent glyph", () => {
  const result = describeCheatSheetKey({ main: 0x0001 });
  assert.equal(result.main, "▽");
  assert.equal(result.transparent, true);
});

test("an undefined layer value (not yet read / keyboard has no such layer) yields no overlay label", () => {
  const result = describeCheatSheetKey({ main: 0x0004, nums: undefined, func: undefined, mouse: undefined });
  assert.equal(result.nums, null);
  assert.equal(result.func, null);
  assert.equal(result.mouse, null);
});

test("Trackpad layer label is shown when it says something new", () => {
  const result = describeCheatSheetKey({ main: 0x0004, mouse: 0x0005 }); // KC_A main, KC_B on the Trackpad layer
  assert.equal(result.mouse, "B");
});

test("the cheat sheet always uses the printable/word label style, for readability when printed", () => {
  const result = describeCheatSheetKey({ main: 0x021e }); // JP_EXLM = S(JP_1)
  assert.equal(result.main, "!"); // not "EXLM", unlike the edit view's default
});

test("a mod-tap Hold label uses the plain word 'Alt', not the edit view's spelled-out LALT, and never an icon/glyph", () => {
  const result = describeCheatSheetKey({ main: 0x248b }); // KG_LALT = LALT_T(JP_MHEN)
  assert.equal(result.hold, "Alt");
});

test("a Hold that goes to Num, Fn or Extra is colored to match that layer", () => {
  assert.equal(describeCheatSheetKey({ main: 0x5221 }).holdColor, "nums"); // KG_NUM = MO(KGL_NUM)
  assert.equal(describeCheatSheetKey({ main: 0x5222 }).holdColor, "func"); // MO(KGL_FUN)
  assert.equal(describeCheatSheetKey({ main: 0x4329 }).holdColor, "extra"); // KG_ESC -> Hold "Extra"
  assert.equal(describeCheatSheetKey({ main: 0x0004 }).holdColor, null); // no Hold at all
});

test("a Hold that goes to Config or Reserved is hidden -- the cheat sheet only has overlay rows for Main/Num/Fn/Extra/Trackpad, so naming either would be a dangling reference", () => {
  const reserved = describeCheatSheetKey({ main: 0x5224 }); // MO(KGL_RES), the real PgUp key
  assert.equal(reserved.hold, null);
  assert.equal(reserved.holdColor, null);

  const config = describeCheatSheetKey({ main: 0x5225 }); // MO(KGL_CONF), the real PgDn key
  assert.equal(config.hold, null);
  assert.equal(config.holdColor, null);
});

test("Extra layer label is passed through the same way as Num/Fn/Trackpad", () => {
  assert.equal(describeCheatSheetKey({ main: 0x0004, extra: 0x0005 }).extra, "B");
  assert.equal(describeCheatSheetKey({ main: 0x0004, extra: 0x0004 }).extra, "A"); // explicit reassignment, still shown
  assert.equal(describeCheatSheetKey({ main: 0x0004, extra: undefined }).extra, null);
});

test("A(KC_1) on the Extra layer shows 'Alt+1' text, not a mod glyph/icon", () => {
  // The real Extra layer's own first key (v1/v2 default keymap.c).
  const result = describeCheatSheetKey({ main: 0x0004, extra: 0x041e });
  assert.equal(result.extra, "Alt+1");
});

test("the comma/period/slash keys report their Shift-symbol (<>?) alongside Main", () => {
  assert.equal(describeCheatSheetKey({ main: 54 }).mainShift, "<"); // JP_COMM
  assert.equal(describeCheatSheetKey({ main: 55 }).mainShift, ">"); // JP_DOT
  assert.equal(describeCheatSheetKey({ main: 56 }).mainShift, "?"); // JP_SLSH
  assert.equal(describeCheatSheetKey({ main: 0x0004 }).mainShift, null); // KC_A has none
  assert.equal(describeCheatSheetKey({ main: undefined }).mainShift, null);
});
