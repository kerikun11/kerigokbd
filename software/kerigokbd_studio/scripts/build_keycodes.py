#!/usr/bin/env python3
"""Generate the keycode lookup table for the realtime keymap editor.

Numeric keycode values come straight from QMK's own canonical keycode
registry (data/constants/keycodes/*.hjson), so this script never guesses
or hand-transcribes a value. Modifier-wrapped and layer-parameterized
keycodes (S(kc), LT(layer, kc), MO(layer), ...) are not literal entries in
that registry -- they are composed from documented, stable bit-packing
formulas (see quantum/quantum_keycodes.h), which src/keycodes/keycode-codec.js
re-implements in JS. This script only needs to resolve the small, fixed
set of Japanese keymap aliases (JP_*), which are plain #define chains in
keymap_japanese.h.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import hjson


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
FIRMWARE_ROOT = REPOSITORY_ROOT / "software/qmk/firmware"
KEYCODES_DIR = FIRMWARE_ROOT / "data/constants/keycodes"
KERIGOKBD_HEADER = REPOSITORY_ROOT / "software/qmk/keyboards/kerigokbd/kerigokbd.h"
JAPANESE_HEADER = next(FIRMWARE_ROOT.rglob("keymap_japanese.h"))
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "public/generated/keycodes.js"

# Curated, ascending-version list of QMK's canonical keycode registry files
# relevant to this keyboard. Later files override earlier ones for the same
# hex value (renames/new aliases). Groups not used by kerigokbd (audio,
# MIDI, joystick, steno, sequencer, swap-hands, programmable buttons,
# magic/layout-swap) are intentionally left out.
KEYCODE_SOURCE_FILES = (
    "keycodes_0.0.1_basic.hjson",
    "keycodes_0.0.2_basic.hjson",
    "keycodes_0.0.5_basic.hjson",
    "keycodes_0.0.1_quantum.hjson",
    "keycodes_0.0.2_quantum.hjson",
    "keycodes_0.0.3_quantum.hjson",
    "keycodes_0.0.6_quantum.hjson",  # QK_LAYER_LOCK (LAYER_LOCK_ENABLE in rules.mk)
    "keycodes_0.0.2_kb.hjson",
    "keycodes_0.0.1_lighting.hjson",
    "keycodes_0.0.4_lighting.hjson",
    "keycodes_0.0.8_lighting.hjson",
)

# Categories shown in the editor's keycode picker, in display order. Each
# maps to one or more QMK registry "group" values.
CATEGORY_GROUPS = (
    ("letters_numbers", ()),  # filled in separately below (KC_A..KC_0)
    ("punctuation", ()),
    ("modifiers", ("modifiers",)),
    ("navigation", ()),
    ("function", ()),
    ("media_system", ("media", "system")),
    ("numpad", ()),
    ("mouse", ("mouse",)),
    ("rgb", ("rgb_matrix", "rgb")),
    ("japanese", ()),
    ("kerigokbd", ("kb",)),
    ("layer_action", ()),
    ("special", ("internal",)),
)

# Explicit symbol allowlists for categories that are easier to enumerate by
# name than by QMK registry group (the registry groups mix many unrelated
# keycodes together, e.g. "basic" covers letters, numbers, punctuation,
# navigation and function keys all at once).
LETTERS_NUMBERS = [f"KC_{c}" for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ"] + [
    f"KC_{n}" for n in "1234567890"
]
PUNCTUATION = [
    "KC_MINS", "KC_EQL", "KC_LBRC", "KC_RBRC", "KC_BSLS", "KC_SCLN",
    "KC_QUOT", "KC_GRV", "KC_COMM", "KC_DOT", "KC_SLSH", "KC_SPC",
    "KC_TAB", "KC_ENT", "KC_ESC", "KC_BSPC", "KC_DEL",
]
NAVIGATION = [
    "KC_LEFT", "KC_RGHT", "KC_UP", "KC_DOWN", "KC_HOME", "KC_END",
    "KC_PGUP", "KC_PGDN", "KC_INS", "KC_PSCR", "KC_CAPS", "KC_NUM",
    "KC_SLEP",
]
FUNCTION = [f"KC_F{n}" for n in range(1, 25)]
NUMPAD = [
    "KC_P0", "KC_P1", "KC_P2", "KC_P3", "KC_P4", "KC_P5", "KC_P6",
    "KC_P7", "KC_P8", "KC_P9", "KC_PDOT", "KC_PCMM", "KC_PSLS",
    "KC_PAST", "KC_PMNS", "KC_PPLS", "KC_PENT", "KC_PEQL",
]
JAPANESE = None  # filled in from keymap_japanese.h below
LAYER_ACTION_BASE_SYMBOLS = ("KC_NO",)  # layer actions are composed, not looked up
SPECIAL = ["KC_NO", "KC_TRANSPARENT", "QK_LLCK", "QK_BOOT"]

CATEGORY_ALLOWLIST = {
    "letters_numbers": LETTERS_NUMBERS,
    "punctuation": PUNCTUATION,
    "navigation": NAVIGATION,
    "function": FUNCTION,
    "numpad": NUMPAD,
    "special": SPECIAL,
}


def strip_line_comments(text: str) -> str:
    return re.sub(r"//[^\n]*", "", text)


# --- Shared expression resolution (also used by build_defaults.py) --------
#
# Resolves any keymap.c-style expression (a bare symbol like "KG_ESC", or a
# call like "A(KC_1)" / "MO(KGL_NUM)" / "LT(KGL_EXT, KC_ESC)") down to the
# exact numeric keycode QMK would compile it to. Bit-packing constants are
# copied by value from public/keycodes/keycode-values.js (itself copied
# from quantum/quantum_keycodes.h / quantum/keycodes.h / quantum/modifiers.h),
# and cross-checked against real firmware values in
# ../tests/keycode-codec.test.js.

TRANSPARENT_KEYCODES = frozenset(("_______", "KC_TRNS"))
DISABLED_KEYCODES = frozenset(("XXXXXXX", "KC_NO"))

QK_MOD_TAP = 0x2000
QK_LAYER_TAP = 0x4000
QK_TO = 0x5200
QK_MOMENTARY = 0x5220
QK_DEF_LAYER = 0x5240
QK_TOGGLE_LAYER = 0x5260
QK_ONE_SHOT_LAYER = 0x5280

# Single-modifier wrap functions: name -> QK_* base bit.
MOD_WRAP_FUNCTIONS = {
    "C": 0x0100, "LCTL": 0x0100,
    "S": 0x0200, "LSFT": 0x0200,
    "A": 0x0400, "LALT": 0x0400,
    "G": 0x0800, "LGUI": 0x0800, "LWIN": 0x0800,
    "RCTL": 0x1100, "RSFT": 0x1200, "RALT": 0x1400, "RGUI": 0x1800, "RWIN": 0x1800,
}
# Multi-modifier combo wrap functions (quantum_keycodes.h LCS/LCA/.../HYPR/MEH).
MOD_COMBO_FUNCTIONS = {
    "LCS": 0x0100 | 0x0200, "LCA": 0x0100 | 0x0400, "LCG": 0x0100 | 0x0800,
    "LSA": 0x0200 | 0x0400, "LSG": 0x0200 | 0x0800, "LAG": 0x0400 | 0x0800,
    "LCSG": 0x0100 | 0x0200 | 0x0800, "LCAG": 0x0100 | 0x0400 | 0x0800, "LSAG": 0x0200 | 0x0400 | 0x0800,
    "RCA": 0x1100 | 0x1400, "RCS": 0x1100 | 0x1200, "RCG": 0x1100 | 0x1800,
    "RSA": 0x1200 | 0x1400, "RSG": 0x1200 | 0x1800, "RAG": 0x1400 | 0x1800,
    "RCSG": 0x1100 | 0x1200 | 0x1800, "RCAG": 0x1100 | 0x1400 | 0x1800, "RSAG": 0x1200 | 0x1400 | 0x1800,
    "HYPR": 0x0100 | 0x0200 | 0x0400 | 0x0800, "MEH": 0x0100 | 0x0200 | 0x0400,
}
# Mod-tap wrap functions: name -> 5-bit packed MOD_* value (modifiers.h).
MOD_TAP_FUNCTIONS = {
    "LCTL_T": 0x01, "LSFT_T": 0x02, "LALT_T": 0x04, "LGUI_T": 0x08, "LWIN_T": 0x08, "WIN_T": 0x08,
    "RCTL_T": 0x11, "RSFT_T": 0x12, "RALT_T": 0x14, "RGUI_T": 0x18, "RWIN_T": 0x18,
}
# Layer-parameterized functions: name -> (QK_* base, layer bit mask, shift).
LAYER_FUNCTIONS = {
    "MO": (QK_MOMENTARY, 0x1f, 0),
    "TO": (QK_TO, 0x1f, 0),
    "DF": (QK_DEF_LAYER, 0x1f, 0),
    "TG": (QK_TOGGLE_LAYER, 0x1f, 0),
    "OSL": (QK_ONE_SHOT_LAYER, 0x1f, 0),
}


def split_arguments(text: str) -> list[str]:
    arguments: list[str] = []
    start = 0
    depth = 0
    for index, character in enumerate(text):
        if character == "(":
            depth += 1
        elif character == ")":
            depth -= 1
        elif character == "," and depth == 0:
            arguments.append(text[start:index].strip())
            start = index + 1
    tail = text[start:].strip()
    if tail:
        arguments.append(tail)
    return arguments


def matching_parenthesis(text: str, opening: int) -> int:
    depth = 0
    for index in range(opening, len(text)):
        if text[index] == "(":
            depth += 1
        elif text[index] == ")":
            depth -= 1
            if depth == 0:
                return index
    raise ValueError("Unclosed parenthesis")


def parse_call(expression: str) -> tuple[str, list[str]] | None:
    match = re.match(r"^([A-Za-z][A-Za-z0-9_]*)\s*\((.*)\)$", expression.strip(), re.S)
    if not match:
        return None
    return match.group(1), split_arguments(match.group(2))


def parse_kerigokbd_macros(header_text: str) -> dict[str, str]:
    """`#define KG_X ...` chains from kerigokbd.h (Thumb/Central/Alias
    sections) -- text substitutions, unlike the `kerigokbd_keycodes` enum."""
    header_text = strip_line_comments(header_text)
    macros: dict[str, str] = {}
    for line in header_text.splitlines():
        match = re.match(r"\s*#define\s+([A-Z][A-Z0-9_]*)\s+(.+?)\s*$", line)
        if match and "(" not in match.group(1):
            macros[match.group(1)] = match.group(2).strip()
    return macros


class Resolver:
    """Resolves a key expression from keymap.c (e.g. "KG_ESC", "A(KC_1)",
    "MO(KGL_NUM)") down to the exact numeric keycode QMK would compile it
    to."""

    def __init__(self, values_by_symbol: dict[str, int], macros: dict[str, str], layer_index: dict[str, int]):
        self.values_by_symbol = values_by_symbol
        self.macros = macros
        self.layer_index = layer_index

    def resolve_layer(self, expression: str, seen: frozenset[str] = frozenset()) -> int:
        expression = expression.strip()
        if expression in self.layer_index:
            return self.layer_index[expression]
        if expression in self.macros and expression not in seen:
            return self.resolve_layer(self.macros[expression], seen | {expression})
        raise ValueError(f"Cannot resolve layer name: {expression}")

    def resolve_keycode(self, expression: str, seen: frozenset[str] = frozenset()) -> int:
        expression = expression.strip()
        if expression in TRANSPARENT_KEYCODES:
            return 0x0001
        if expression in DISABLED_KEYCODES:
            return 0x0000
        if expression in self.values_by_symbol:
            return self.values_by_symbol[expression]

        call = parse_call(expression)
        if call:
            name, arguments = call
            return self._resolve_call(name, arguments, seen)

        if expression in self.macros:
            if expression in seen:
                raise ValueError(f"Circular macro: {expression}")
            return self.resolve_keycode(self.macros[expression], seen | {expression})

        raise ValueError(f"Cannot resolve keycode expression: {expression!r}")

    def _resolve_call(self, name: str, arguments: list[str], seen: frozenset[str]) -> int:
        if name in LAYER_FUNCTIONS:
            base, mask, shift = LAYER_FUNCTIONS[name]
            layer = self.resolve_layer(arguments[0])
            return base | ((layer & mask) << shift)
        if name == "LT" and len(arguments) == 2:
            layer = self.resolve_layer(arguments[0])
            keycode = self.resolve_keycode(arguments[1], seen)
            return QK_LAYER_TAP | ((layer & 0xF) << 8) | (keycode & 0xFF)
        if name in MOD_WRAP_FUNCTIONS and len(arguments) == 1:
            keycode = self.resolve_keycode(arguments[0], seen)
            return MOD_WRAP_FUNCTIONS[name] | keycode
        if name in MOD_COMBO_FUNCTIONS and len(arguments) == 1:
            keycode = self.resolve_keycode(arguments[0], seen)
            return MOD_COMBO_FUNCTIONS[name] | keycode
        if name in MOD_TAP_FUNCTIONS and len(arguments) == 1:
            keycode = self.resolve_keycode(arguments[0], seen)
            return QK_MOD_TAP | (MOD_TAP_FUNCTIONS[name] << 8) | (keycode & 0xFF)
        if name == "MT" and len(arguments) == 2:
            mod = self.resolve_keycode(arguments[0], seen)  # MOD_* constants aren't keycodes, but happen to not collide here
            keycode = self.resolve_keycode(arguments[1], seen)
            return QK_MOD_TAP | ((mod & 0x1F) << 8) | (keycode & 0xFF)
        raise ValueError(f"Unsupported call in default keymap: {name}({', '.join(arguments)})")

# --- End shared expression resolution --------------------------------------


def load_keycode_registry() -> dict[int, dict[str, object]]:
    """Merge the curated QMK canonical keycode files into {value: entry}."""
    merged: dict[int, dict[str, object]] = {}
    for filename in KEYCODE_SOURCE_FILES:
        path = KEYCODES_DIR / filename
        try:
            data = hjson.loads(path.read_text(encoding="utf-8"))
        except (OSError, hjson.HjsonDecodeError) as error:
            raise ValueError(f"Failed to parse {path}: {error}") from error
        for hex_value, entry in data.get("keycodes", {}).items():
            # "!delete!" is QMK's marker for a value a later version removed.
            if entry == "!delete!":
                merged.pop(int(hex_value, 16), None)
                continue
            merged[int(hex_value, 16)] = entry
    return merged


def aliases_of(entry: dict[str, object]) -> list[str]:
    # "!reset!" is an hjson-merge marker meaning "ignore inherited aliases
    # from an earlier version file", not a real alias.
    return [alias for alias in entry.get("aliases", []) if alias != "!reset!"]


def build_symbol_table(registry: dict[int, dict[str, object]]) -> dict[str, int]:
    symbols: dict[str, int] = {}
    for value, entry in registry.items():
        key = entry.get("key")
        if key:
            symbols[key] = value
        for alias in aliases_of(entry):
            symbols[alias] = value
    return symbols


def preferred_symbol(entry: dict[str, object]) -> str:
    """Pick the short, conventional QMK alias (KC_LCTL, MS_LEFT, RM_TOGG, ...)
    over the newer, longer canonical name (KC_LEFT_CTRL, QK_MOUSE_CURSOR_LEFT,
    QK_RGB_MATRIX_TOGGLE, ...), since that's what kerigokbd's own keymap.c
    uses. On a length tie, prefer a "WIN"-named alias (KC_LWIN over
    KC_LGUI/KC_LCMD): kerigokbd's keymap.c consistently spells the
    GUI/Super/Cmd modifier that way."""
    candidates = [entry["key"], *aliases_of(entry)]
    return min(candidates, key=lambda candidate: (len(candidate), "WIN" not in candidate))


MODIFIER_BIT = {"C": 0x0100, "S": 0x0200, "A": 0x0400, "G": 0x0800}


def resolve_japanese_aliases(symbols: dict[str, int]) -> dict[str, int]:
    """Resolve keymap_japanese.h's `#define JP_X ...` chain to numeric values.

    Every definition is either a direct alias to an existing symbol (e.g.
    `JP_MINS KC_MINS`) or a single-level `S(other_symbol)` shift wrap, so a
    small fixed-point resolver covers the whole file without needing a full
    C expression parser.
    """
    raw_defines: dict[str, str] = {}
    pattern = re.compile(r"^#define\s+(JP_[A-Z0-9]+)\s+(\S+)")
    for line in strip_line_comments(JAPANESE_HEADER.read_text(encoding="utf-8")).splitlines():
        match = pattern.match(line.strip())
        if match:
            raw_defines[match.group(1)] = match.group(2)

    resolved: dict[str, int] = {}

    def resolve(symbol: str, seen: frozenset[str] = frozenset()) -> int:
        if symbol in resolved:
            return resolved[symbol]
        if symbol in symbols:
            return symbols[symbol]
        wrapped = re.match(r"^S\((\w+)\)$", raw_defines.get(symbol, ""))
        if wrapped:
            if symbol in seen:
                raise ValueError(f"Circular JP_* alias: {symbol}")
            value = MODIFIER_BIT["S"] | resolve(wrapped.group(1), seen | {symbol})
            resolved[symbol] = value
            return value
        target = raw_defines.get(symbol)
        if target in symbols:
            resolved[symbol] = symbols[target]
            return resolved[symbol]
        if target in raw_defines:
            value = resolve(target, seen | {symbol})
            resolved[symbol] = value
            return value
        raise ValueError(f"Cannot resolve JP_* alias: {symbol} -> {target!r}")

    for symbol in raw_defines:
        resolve(symbol)
    return resolved


def parse_layers(header_text: str) -> list[str]:
    header_text = strip_line_comments(header_text)
    match = re.search(r"enum\s+kerigokbd_layers\s*\{([^}]*)\}", header_text, re.S)
    if not match:
        raise ValueError("Could not find enum kerigokbd_layers in kerigokbd.h")
    names = []
    for entry in match.group(1).split(","):
        name = entry.strip()
        if not name:
            continue
        names.append(name.split("=")[0].strip())
    return names


def parse_layer_descriptions(header_text: str) -> list[str]:
    """Extracts the "N: Description" comment after each kerigokbd_layers
    entry (e.g. "KGL_MAIN, // 0: Default Layer" -> "Default Layer"), which
    doubles as the `/* ... */` header comment on each layer's
    `LAYOUT_xxx(...)` block in keymap.c. Each entry is on its own line, so
    this scans line by line rather than splitting on "," (which would pair
    a comment with the *next* entry's name instead of its own)."""
    match = re.search(r"enum\s+kerigokbd_layers\s*\{([^}]*)\}", header_text, re.S)
    if not match:
        raise ValueError("Could not find enum kerigokbd_layers in kerigokbd.h")
    pattern = re.compile(r"^\s*KGL_[A-Z0-9_]+\s*,?\s*//\s*\d+:\s*(.+?)\s*$")
    descriptions = []
    for line in match.group(1).splitlines():
        entry_match = pattern.match(line)
        if entry_match:
            descriptions.append(entry_match.group(1))
    return descriptions


def label_for(symbol: str, entry: dict[str, object] | None) -> str:
    # QMK calls the Windows key "GUI" ("Left GUI"); this editor says Win
    # everywhere, like kerigokbd's keymap.c (KC_LWIN).
    return _label_for(symbol, entry).replace("GUI", "Win")


def _label_for(symbol: str, entry: dict[str, object] | None) -> str:
    if entry is not None:
        label = entry.get("label")
        if label:
            return label
        if entry.get("group") == "internal":
            return ""
        # Prettify from the full canonical name (e.g. "KC_AUDIO_VOL_UP"),
        # not the short display symbol (e.g. "KC_VOLU"), for a readable label.
        symbol = entry.get("key", symbol)
    prettified = symbol
    for prefix in ("KC_", "QK_", "MS_", "RM_", "JP_"):
        if prettified.startswith(prefix):
            prettified = prettified[len(prefix):]
            break
    return prettified.replace("_", " ").title()


def build_entries(
    symbols: dict[str, str],
    values_by_symbol: dict[str, int],
    registry: dict[int, dict[str, object]],
) -> list[dict[str, object]]:
    entries = []
    seen_values: set[int] = set()
    for category, symbol_list in symbols.items():
        for symbol in symbol_list:
            value = values_by_symbol.get(symbol)
            if value is None:
                raise ValueError(f"Unknown keycode symbol: {symbol}")
            entry = registry.get(value)
            entries.append({
                "value": value,
                "symbol": symbol,
                "label": label_for(symbol, entry),
                "category": category,
            })
            seen_values.add(value)
    return entries


def collect_group_entries(
    registry: dict[int, dict[str, object]],
    groups: tuple[str, ...],
    category: str,
    exclude_values: set[int],
) -> list[dict[str, object]]:
    entries = []
    for value, entry in sorted(registry.items()):
        if entry.get("group") not in groups or value in exclude_values:
            continue
        if not entry.get("key"):
            continue
        entries.append({
            "value": value,
            "symbol": preferred_symbol(entry),
            "label": label_for(preferred_symbol(entry), entry),
            "category": category,
        })
    return entries


# Presentation labels for implemented kerigokbd custom keycodes.
KERIGOKBD_CUSTOM_LABELS = {
    "KG_WCAD": "Win/CAD",
    "KG_ATAB": "Alt/Alt+Tab",
    "KG_SCRL": "Scroll", "KG_ZOOM": "Zoom",
    "KG_MSL": "M⬅", "KG_MSD": "M⬇", "KG_MSU": "M⬆", "KG_MSR": "M➡",
    "KG_MWLL": "W⬅", "KG_MWLD": "W⬇", "KG_MWLU": "W⬆", "KG_MWLR": "W➡",
}


def parse_kerigokbd_custom_keycodes(header_text: str) -> dict[str, str]:
    """Resolve kerigokbd.h's `enum kerigokbd_keycodes { NAME = EXPR, ... }`
    aliases down to their QK_KB_N base symbol, so QK_KB_10 can be displayed
    as its friendlier alias KG_SCRL."""
    header_text = strip_line_comments(header_text)
    match = re.search(r"enum\s+kerigokbd_keycodes\s*\{([^}]*)\}", header_text, re.S)
    if not match:
        raise ValueError("Could not find enum kerigokbd_keycodes in kerigokbd.h")

    raw: dict[str, str] = {}
    for entry in match.group(1).split(","):
        entry = entry.strip()
        if not entry or "=" not in entry:
            continue
        name, expr = (part.strip() for part in entry.split("=", 1))
        raw[name] = expr

    resolved: dict[str, str] = {}

    def resolve(name: str) -> str:
        if name not in resolved:
            expr = raw[name]
            resolved[name] = expr if expr.startswith("QK_KB_") else resolve(expr)
        return resolved[name]

    return {name: resolve(name) for name in raw if name in KERIGOKBD_CUSTOM_LABELS}


def main() -> None:
    registry = load_keycode_registry()
    symbols = build_symbol_table(registry)
    japanese = resolve_japanese_aliases(symbols)
    values_by_symbol = {**symbols, **japanese}

    entries: list[dict[str, object]] = []
    exclude_values: set[int] = set()

    for category, allowlist in CATEGORY_ALLOWLIST.items():
        for item in build_entries({category: allowlist}, values_by_symbol, registry):
            entries.append(item)
            exclude_values.add(item["value"])

    entries += collect_group_entries(registry, ("modifiers",), "modifiers", exclude_values)
    for item in entries:
        exclude_values.add(item["value"])
    entries += collect_group_entries(registry, ("media", "system"), "media_system", exclude_values)
    for item in entries:
        exclude_values.add(item["value"])
    entries += collect_group_entries(registry, ("mouse",), "mouse", exclude_values)
    for item in entries:
        exclude_values.add(item["value"])
    entries += collect_group_entries(registry, ("rgb_matrix", "rgb"), "rgb", exclude_values)
    for item in entries:
        exclude_values.add(item["value"])
    entries += collect_group_entries(registry, ("kb",), "kerigokbd", exclude_values)

    # Only custom keycodes with configured presentation labels are meaningful
    # to assign from the editor. Prefer
    # kerigokbd.h's own friendlier aliases (KG_SCRL, KG_MSL, ...) over the
    # generic QK_KB_N symbol.
    base_symbol_by_alias = parse_kerigokbd_custom_keycodes(KERIGOKBD_HEADER.read_text(encoding="utf-8"))
    alias_by_base_symbol = {base: alias for alias, base in base_symbol_by_alias.items()}
    for entry in entries:
        if entry["category"] != "kerigokbd":
            continue
        alias = alias_by_base_symbol.get(entry["symbol"])
        if alias:
            entry["symbol"] = alias
            entry["label"] = KERIGOKBD_CUSTOM_LABELS[alias]
    # Hide reserved slots that have no implemented KG_* alias.
    entries = [e for e in entries if e["category"] != "kerigokbd" or e["symbol"].startswith("KG_")]

    japanese_entries = [
        {
            "value": value,
            "symbol": symbol,
            "label": symbol[3:],
            "category": "japanese",
        }
        for symbol, value in sorted(japanese.items(), key=lambda item: item[1])
    ]
    entries += japanese_entries

    entries.sort(key=lambda item: item["value"])

    header_text = KERIGOKBD_HEADER.read_text(encoding="utf-8")
    layer_names = parse_layers(header_text)
    layer_descriptions = parse_layer_descriptions(header_text)
    if len(layer_names) != len(layer_descriptions):
        raise ValueError(
            f"Parsed {len(layer_names)} layer names but {len(layer_descriptions)} "
            "descriptions -- every kerigokbd_layers entry must have a "
            "'// N: Description' comment on its own line."
        )
    layers = [
        {"index": index, "symbol": symbol, "description": description}
        for index, (symbol, description) in enumerate(zip(layer_names, layer_descriptions))
    ]

    # kerigokbd.h's own `#define KG_X ...` aliases (KG_ESC, KG_NUM, KG_EXTL,
    # ...) are what the real keymap.c actually uses for composed values like
    # LT()/MO()/mod-taps -- without preferring them, the editor's "export to
    # keymap.c" feature would expand every one of these back into its much
    # longer LT(KGL_EXT, KC_ESC)-style call, which is correct C but no
    # longer reads (or aligns) like the hand-written original.
    layer_index = {name: index for index, name in enumerate(layer_names)}
    macros = parse_kerigokbd_macros(header_text)
    resolver = Resolver(values_by_symbol, macros, layer_index)
    macro_aliases = []
    for macro_name in macros:
        try:
            value = resolver.resolve_keycode(macro_name)
        except ValueError:
            continue  # not every #define in kerigokbd.h resolves to a plain keycode
        macro_aliases.append({"symbol": macro_name, "value": value})
    macro_aliases.sort(key=lambda item: item["value"])

    payload = {"keycodes": entries, "layers": layers, "macroAliases": macro_aliases}
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, ensure_ascii=False, indent=2)
    OUTPUT_PATH.write_text(
        f"// Generated by scripts/build_keycodes.py. Do not edit by hand.\n"
        f"export const KEYCODE_DATA = {serialized};\n",
        encoding="utf-8",
    )
    print(f"Generated {OUTPUT_PATH.relative_to(REPOSITORY_ROOT)} ({len(entries)} keycodes, {len(layers)} layers)")


if __name__ == "__main__":
    main()
