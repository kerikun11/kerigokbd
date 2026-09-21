import { test } from "node:test";
import assert from "node:assert/strict";
import { iconForLabel, compoundIconsForLabel } from "../public/keycodes/cheat-sheet-icons.js";

test("mouse click buttons map to left/right/middle click icons with no arrow", () => {
  assert.deepEqual(iconForLabel("BTN1"), { icon: "mouse-left", arrow: null });
  assert.deepEqual(iconForLabel("BTN2"), { icon: "mouse-right", arrow: null });
  assert.deepEqual(iconForLabel("BTN3"), { icon: "mouse-middle", arrow: null });
});

test("cursor movement (KG_MSL/MSD/MSU/MSR) maps to the mouse icon plus a direction arrow", () => {
  assert.deepEqual(iconForLabel("MSL"), { icon: "mouse", arrow: "⬅" });
  assert.deepEqual(iconForLabel("MSD"), { icon: "mouse", arrow: "⬇" });
  assert.deepEqual(iconForLabel("MSU"), { icon: "mouse", arrow: "⬆" });
  assert.deepEqual(iconForLabel("MSR"), { icon: "mouse", arrow: "➡" });
});

test("scroll wheel movement (KG_MWLL/MWLD/MWLU/MWLR) maps to the wheel icon plus a direction arrow", () => {
  assert.deepEqual(iconForLabel("MWLL"), { icon: "wheel", arrow: "⬅" });
  assert.deepEqual(iconForLabel("MWLR"), { icon: "wheel", arrow: "➡" });
});

test("Scroll/Zoom mode are icon-only, no arrow", () => {
  assert.deepEqual(iconForLabel("SCRL"), { icon: "scroll", arrow: null });
  assert.deepEqual(iconForLabel("ZOOM"), { icon: "zoom", arrow: null });
  assert.equal(iconForLabel("BSPC"), null);
  assert.equal(iconForLabel("Backspace"), null);
});

test("Delete has no icon -- it's always the plain word 'Delete' (keycode-format.js's PRINTABLE_SYMBOL_LABELS)", () => {
  assert.equal(iconForLabel("DEL"), null);
  assert.equal(iconForLabel("Delete"), null);
});

test("KC_PSCR (Print Screen) stays readable text", () => {
  assert.equal(iconForLabel("PSCR"), null);
  assert.equal(iconForLabel("PrSc"), null);
});

test("a mod-tap's own Hold word ('Alt', 'Win') has no icon mapping -- keycode-format.js never produces a glyph for it anymore", () => {
  assert.equal(iconForLabel("Alt"), null);
  assert.equal(iconForLabel("Win"), null);
});

test("d-pad arrow characters (from KC_LEFT/DOWN/UP/RGHT's printable label) have no icon mapping -- they render as the bare arrow character, same font as a mouse-move arrow", () => {
  assert.equal(iconForLabel("➡"), null);
  assert.equal(iconForLabel("⬇"), null);
  assert.equal(iconForLabel("⬅"), null);
  assert.equal(iconForLabel("⬆"), null);
});

test("VOLU/VOLD map to the volume-up/volume-down speaker pictographs, no arrow", () => {
  assert.deepEqual(iconForLabel("VOLU"), { icon: "volume-up", arrow: null });
  assert.deepEqual(iconForLabel("VOLD"), { icon: "volume-down", arrow: null });
});

test("numpad digit/symbol keys map to the numpad icon plus their character", () => {
  assert.deepEqual(iconForLabel("P0"), { icon: "numpad", arrow: "0" });
  assert.deepEqual(iconForLabel("P7"), { icon: "numpad", arrow: "7" });
  assert.deepEqual(iconForLabel("PDOT"), { icon: "numpad", arrow: "." });
  assert.deepEqual(iconForLabel("PMNS"), { icon: "numpad", arrow: "−" });
  assert.deepEqual(iconForLabel("PPLS"), { icon: "numpad", arrow: "+" });
  assert.deepEqual(iconForLabel("PSLS"), { icon: "numpad", arrow: "/" });
  assert.deepEqual(iconForLabel("PAST"), { icon: "numpad", arrow: "*" }); // KC_PAST shows as icon + "*"
  assert.deepEqual(iconForLabel("PENT"), { icon: "numpad", arrow: "Enter" }); // KC_PENT (numpad Enter) shows as icon + "Enter"
});

test("KC_PENT's icon+'Enter' label is distinct from plain KC_ENT's bare 'Enter' text -- iconForLabel only sees rendered text, so this depends on KC_PENT never getting a PRINTABLE_SYMBOL_LABELS entry that would also read 'Enter'", () => {
  assert.equal(iconForLabel("Enter"), null); // plain KC_ENT: no icon, just the word
});

test("a label with no icon mapping returns null so the caller falls back to plain text", () => {
  assert.equal(iconForLabel("A"), null);
  assert.equal(iconForLabel("ESC"), null);
  assert.equal(iconForLabel(""), null);
});

test("compoundIconsForLabel: 'Alt+PrSc' stays readable text", () => {
  assert.equal(compoundIconsForLabel("Alt+PrSc"), null);
});

test("compoundIconsForLabel: Win+Backspace stays readable text", () => {
  assert.equal(compoundIconsForLabel("Win+BSPC"), null);
  assert.equal(compoundIconsForLabel("Win+Backspace"), null);
});

test("compoundIconsForLabel: falls back to null when either half has no icon, so the caller keeps the readable text", () => {
  assert.equal(compoundIconsForLabel("Alt+1"), null); // "1" has no icon -- stays readable text
  assert.equal(compoundIconsForLabel("Ctrl+Z"), null); // "Ctrl" has no icon -- stays readable text
  assert.equal(compoundIconsForLabel("Win+DEL"), null); // Delete never gets an icon, even compounded
  assert.equal(compoundIconsForLabel("Alt+PrSc+1"), null); // more than one "+" doesn't match at all
});
