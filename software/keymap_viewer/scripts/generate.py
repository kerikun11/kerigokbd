#!/usr/bin/env python3
"""Generate the KERIgoKBD quick-reference data from QMK sources."""

from __future__ import annotations

import json
import re
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
KEYBOARD_ROOT = REPOSITORY_ROOT / "software/qmk/keyboards/kerigokbd"
KEYMAP_PATH = KEYBOARD_ROOT / "kerigokbd_v2/keymaps/default/keymap.c"
INFO_PATH = KEYBOARD_ROOT / "kerigokbd_v2/info.json"
VIA_PATH = KEYBOARD_ROOT / "kerigokbd_v2/keymaps/via/via.json"
DEFINITIONS_PATH = KEYBOARD_ROOT / "kerigokbd.h"
OUTPUT_PATH = Path(__file__).resolve(
).parents[1] / "public/generated/keymap-data.js"

VISIBLE_LAYERS = ("KGL_MAIN", "KGL_NUM", "KGL_FUN")
TRACKPAD_REPLACED_MATRIXES = ((7, 4), (7, 3))
TRACKPAD_GEOMETRY = {"x": 10.125, "y": 3.15, "width": 1.75, "height": 1.75}
LAYOUT_VERSION = "v2026.09.12a"
LAYER_LABELS = {
    "KGL_MAIN": "Main",
    "KGL_NUM": "Nums",
    "KGL_FUN": "Func",
    "KGL_ESC": "Tenkey",
    "KGL_TEMP": "Temporary",
    "KGL_CONF": "Config",
    "KGL_AM": "Auto Mouse",
}

KEY_LABELS = {
    "KC_TAB": "Tab", "KC_LCTL": "Ctrl", "KC_RCTL": "Ctrl",
    "KC_LSFT": "Shift", "KC_RSFT": "Shift", "KC_LALT": "Alt",
    "KC_RALT": "Alt", "KC_LWIN": "Win", "KC_RWIN": "Win",
    "KC_BSPC": "Backspace", "KC_ENT": "Enter", "KC_DEL": "Delete",
    "KC_ESC": "Esc", "KC_SPC": "Space", "KC_PSCR": "PrSc",
    "KC_VOLU": "Vol+", "KC_VOLD": "Vol-", "KC_LEFT": "⬅",
    "KC_DOWN": "⬇", "KC_UP": "⬆", "KC_RGHT": "➡",
    "KC_HOME": "Home", "KC_END": "End", "KC_PGUP": "PgUp",
    "KC_PGDN": "PgDn", "KC_SLEP": "Sleep", "KC_NUM": "Num Lock",
    "KC_P7": "7", "KC_P8": "8", "KC_P9": "9", "KC_PMNS": "−",
    "KC_PSLS": "÷", "KC_P4": "4", "KC_P5": "5", "KC_P6": "6",
    "KC_PPLS": "+", "KC_PENT": "Enter", "KC_PAST": "×",
    "KC_P1": "1", "KC_P2": "2", "KC_P3": "3", "KC_PDOT": ".",
    "KC_P0": "0", "QK_BOOT": "Boot",
    "MS_BTN1": "M1", "MS_BTN2": "M2", "MS_BTN3": "M3",
    "RM_TOGG": "RGB", "RM_NEXT": "RGB Next", "RM_PREV": "RGB Prev",
    "RM_HUEU": "Hue +", "RM_HUED": "Hue −", "RM_SATU": "Sat +",
    "RM_SATD": "Sat −", "RM_VALU": "Bright +", "RM_VALD": "Bright −",
    "RM_SPDU": "Speed +", "RM_SPDD": "Speed −",
    "JP_HENK": "変換", "JP_MHEN": "無変換", "JP_ZKHK": "半角/全角",
    "JP_MINS": "-", "JP_COMM": ",", "JP_DOT": ".", "JP_SLSH": "/",
    "JP_EXLM": "!", "JP_DQUO": "\"", "JP_HASH": "#", "JP_DLR": "$",
    "JP_PERC": "%", "JP_AMPR": "&", "JP_QUOT": "'", "JP_EQL": "=",
    "JP_TILD": "~", "JP_PIPE": "|", "JP_GRV": "`", "JP_AT": "@",
    "JP_SCLN": ";", "JP_COLN": ":", "JP_UNDS": "_", "JP_CIRC": "^",
    "JP_PLUS": "+", "JP_ASTR": "*", "JP_BSLS": "\\",
    "JP_LPRN": "(", "JP_RPRN": ")", "JP_LCBR": "{", "JP_RCBR": "}",
    "JP_LBRC": "[", "JP_RBRC": "]",
    "KG_SCRL": "Scroll", "KG_ZOOM": "Zoom", "KG_MSL": "M⬅",
    "KG_MSD": "M⬇", "KG_MSU": "M⬆", "KG_MSR": "M➡",
    "KG_MWLL": "W⬅", "KG_MWLD": "W⬇", "KG_MWLU": "W⬆",
    "KG_MWLR": "W➡", "KG_APRS": "Alt+PrSc",
}

MODIFIER_LABELS = {
    "LCTL": "Ctrl", "RCTL": "Ctrl", "LSFT": "Shift", "RSFT": "Shift",
    "LALT": "Alt", "RALT": "Alt", "LGUI": "Win", "RGUI": "Win",
    "LWIN": "Win", "RWIN": "Win",
}


def strip_comments(text: str) -> str:
    return re.sub(r"/\*.*?\*/|//[^\n]*", "", text, flags=re.S)


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
    raise ValueError("Unclosed LAYOUT macro")


def parse_layers(source: str) -> dict[str, list[str]]:
    clean_source = strip_comments(source)
    declaration = re.compile(
        r"\[(KGL_[A-Z0-9_]+)\]\s*=\s*(LAYOUT_[A-Za-z0-9_]+)\s*\(")
    layers: dict[str, list[str]] = {}
    for match in declaration.finditer(clean_source):
        opening = match.end() - 1
        closing = matching_parenthesis(clean_source, opening)
        layers[match.group(1)] = split_arguments(
            clean_source[opening + 1:closing])
    return layers


def parse_via_layout(rows: list[list[object]]) -> dict[tuple[int, int], dict[str, float]]:
    """Parse the KLE-compatible physical layout stored in VIA JSON."""
    geometries: dict[tuple[int, int], dict[str, float]] = {}
    cursor_y = -1.0
    rotation = 0.0
    rotation_x = 0.0
    rotation_y = 0.0

    for row in rows:
        cursor_x = rotation_x
        cursor_y += 1
        width = 1.0
        height = 1.0
        for item in row:
            if isinstance(item, dict):
                if "r" in item:
                    rotation = float(item["r"])
                if "rx" in item:
                    rotation_x = float(item["rx"])
                    cursor_x = rotation_x
                if "ry" in item:
                    rotation_y = float(item["ry"])
                    cursor_y = rotation_y
                cursor_x += float(item.get("x", 0))
                cursor_y += float(item.get("y", 0))
                width = float(item.get("w", width))
                height = float(item.get("h", height))
                continue

            if not isinstance(item, str) or not re.fullmatch(r"\d+,\d+", item):
                raise ValueError(f"Unsupported VIA layout key: {item!r}")
            matrix = tuple(int(value) for value in item.split(","))
            geometries[matrix] = {
                "x": cursor_x,
                "y": cursor_y,
                "width": width,
                "height": height,
                "rotation": rotation,
                "rotationX": rotation_x,
                "rotationY": rotation_y,
            }
            cursor_x += width
            width = 1.0
            height = 1.0

    return geometries


def parse_definitions(source: str) -> dict[str, str]:
    definitions: dict[str, str] = {}
    for line in strip_comments(source).splitlines():
        match = re.match(r"\s*#define\s+([A-Z][A-Z0-9_]*)\s+(.+?)\s*$", line)
        if match and "(" not in match.group(1):
            definitions[match.group(1)] = match.group(2).strip()
    return definitions


def resolve(expression: str, definitions: dict[str, str]) -> str:
    resolved = expression.strip()
    visited: set[str] = set()
    while resolved in definitions and resolved not in visited:
        visited.add(resolved)
        resolved = definitions[resolved].strip()
    return resolved


def parse_call(expression: str) -> tuple[str, list[str]] | None:
    match = re.match(r"^([A-Z][A-Z0-9_]*)\s*\((.*)\)$",
                     expression.strip(), re.S)
    if not match:
        return None
    return match.group(1), split_arguments(match.group(2))


def label_for(expression: str, definitions: dict[str, str]) -> str:
    source = expression.strip()
    if source in ("_______", "KC_TRNS"):
        return ""
    if source in ("XXXXXXX", "KC_NO"):
        return ""
    if source in KEY_LABELS:
        return KEY_LABELS[source]

    resolved = resolve(source, definitions)
    if resolved in KEY_LABELS:
        return KEY_LABELS[resolved]
    if re.fullmatch(r"KC_[A-Z0-9]", resolved):
        return resolved[3:]
    if re.fullmatch(r"KC_F\d{1,2}", resolved):
        return resolved[3:]

    call = parse_call(resolved)
    if call:
        name, arguments = call
        if name == "LT" and len(arguments) == 2:
            return label_for(arguments[1], definitions)
        if name == "MO" and arguments:
            return ""
        if name == "TO" and arguments:
            return LAYER_LABELS.get(arguments[0], arguments[0])
        if name.endswith("_T") and arguments:
            return label_for(arguments[-1], definitions)
        if name in {"A", "LALT", "RALT"} and arguments:
            return f"Alt+{label_for(arguments[0], definitions)}"
        if name in {"C", "LCTL", "RCTL"} and arguments:
            return f"Ctrl+{label_for(arguments[0], definitions)}"
        if name in {"S", "LSFT", "RSFT"} and arguments:
            return f"Shift+{label_for(arguments[0], definitions)}"

    return source.removeprefix("KC_").replace("_", " ").title()


def hold_label(expression: str, definitions: dict[str, str]) -> str:
    resolved = resolve(expression, definitions)
    call = parse_call(resolved)
    if not call:
        return ""
    name, arguments = call
    if name == "LT" and len(arguments) == 2:
        layer = arguments[0]
        return LAYER_LABELS.get(layer, layer) if layer in VISIBLE_LAYERS else ""
    if name == "MO" and arguments:
        layer = arguments[0]
        return LAYER_LABELS.get(layer, layer) if layer in VISIBLE_LAYERS else ""
    if name.endswith("_T"):
        modifier = name[:-2]
        return MODIFIER_LABELS.get(modifier, modifier.title())
    return ""


def layer_label(
    output_name: str,
    expression: str,
    definitions: dict[str, str],
    main_label: str,
) -> str:
    label = label_for(expression, definitions)
    if output_name == "func" and label == main_label:
        return ""
    return label


def key_state(expression: str) -> str:
    if expression in ("_______", "KC_TRNS"):
        return "transparent"
    if expression in ("XXXXXXX", "KC_NO"):
        return "disabled"
    return "assigned"


def main() -> None:
    info = json.loads(INFO_PATH.read_text(encoding="utf-8"))
    via = json.loads(VIA_PATH.read_text(encoding="utf-8"))
    keymap_source = KEYMAP_PATH.read_text(encoding="utf-8")
    definitions = parse_definitions(
        DEFINITIONS_PATH.read_text(encoding="utf-8"))
    layers = parse_layers(keymap_source)

    layout_name = next(iter(info["layouts"]))
    positions = info["layouts"][layout_name]["layout"]
    geometries = parse_via_layout(via["layouts"]["keymap"])
    missing_layers = [layer for layer in VISIBLE_LAYERS if layer not in layers]
    if missing_layers:
        raise ValueError(f"Missing layers: {', '.join(missing_layers)}")
    for layer in VISIBLE_LAYERS:
        if len(layers[layer]) != len(positions):
            raise ValueError(
                f"{layer} has {len(layers[layer])} keys; layout has {len(positions)} positions"
            )

    keys = []
    for index, position in enumerate(positions):
        matrix = tuple(position["matrix"])
        if matrix not in geometries:
            raise ValueError(f"Matrix {matrix} is missing from VIA layout")
        geometry = geometries[matrix]
        main_source = layers["KGL_MAIN"][index]
        key = {
            "index": index,
            "matrix": position["matrix"],
            **geometry,
            "main": {
                "source": main_source,
                "expanded": resolve(main_source, definitions),
                "label": label_for(main_source, definitions),
                "hold": hold_label(main_source, definitions),
                "state": key_state(main_source),
            },
        }
        for output_name, layer_name in (("nums", "KGL_NUM"), ("func", "KGL_FUN")):
            source = layers[layer_name][index]
            key[output_name] = {
                "source": source,
                "expanded": resolve(source, definitions),
                "label": layer_label(
                    output_name, source, definitions, key["main"]["label"]
                ),
                "state": key_state(source),
            }
        keys.append(key)

    result = {
        "keyboard": info["keyboard_name"],
        "layoutVersion": LAYOUT_VERSION,
        "layout": layout_name,
        "source": str(KEYMAP_PATH.relative_to(REPOSITORY_ROOT)),
        "geometrySource": str(VIA_PATH.relative_to(REPOSITORY_ROOT)),
        "trackpad": {
            **TRACKPAD_GEOMETRY,
            "replaces": [list(matrix) for matrix in TRACKPAD_REPLACED_MATRIXES],
        },
        "keys": keys,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    OUTPUT_PATH.write_text(
        f"window.KEYMAP_DATA = {payload};\n", encoding="utf-8")
    print(
        f"Generated {OUTPUT_PATH.relative_to(REPOSITORY_ROOT)} ({len(keys)} keys)")


if __name__ == "__main__":
    main()
