#!/usr/bin/env python3
"""Generate the KERIgoKBD quick-reference data from QMK sources."""

from __future__ import annotations

import json
import re
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
KEYBOARD_ROOT = REPOSITORY_ROOT / "software/qmk/keyboards/kerigokbd"
KEYMAP_PATH = KEYBOARD_ROOT / "kerigokbd_v2/keymaps/default/keymap.c"
INFO_PATH = KEYBOARD_ROOT / "kerigokbd_v2/info.json"
VIA_PATH = KEYBOARD_ROOT / "kerigokbd_v2/keymaps/via/via.json"
DEFINITIONS_PATH = KEYBOARD_ROOT / "kerigokbd.h"
OUTPUT_PATH = Path(__file__).resolve(
).parents[1] / "public/generated/keymap-data.js"

VISIBLE_LAYERS = ("KGL_MAIN", "KGL_NUM", "KGL_FUN", "KGL_AM")
OUTPUT_LAYERS = (
    ("nums", "KGL_NUM"),
    ("func", "KGL_FUN"),
    ("autoMouse", "KGL_AM"),
    ("escape", "KGL_ESC"),
)
TRACKPAD_REPLACED_MATRIXES = ((7, 4), (7, 3))
TRACKPAD_GEOMETRY = {"x": 10.125, "y": 3.15, "width": 1.75, "height": 1.75}
KEYBOARD_CONFIGS = {
    "kerigokbd_v2": {
        "layers": (*VISIBLE_LAYERS, "KGL_ESC"),
        "trackpad": {
            **TRACKPAD_GEOMETRY,
            "replaces": [list(matrix) for matrix in TRACKPAD_REPLACED_MATRIXES],
        },
    },
    "kerigokbd_v1": {"layers": (*VISIBLE_LAYERS[:3], "KGL_ESC"), "trackpad": None},
}
LAYER_LABELS = {
    "KGL_MAIN": "Main",
    "KGL_NUM": "Num",
    "KGL_FUN": "Fn",
    "KGL_ESC": "Extra",
    "KGL_TEMP": "Temporary",
    "KGL_CONF": "Config",
    "KGL_AM": "Mouse",
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
    "KC_PGDN": "PgDn", "KC_SLEP": "Sleep", "KC_NUM": "NumLock",
    "KC_P7": "7", "KC_P8": "8", "KC_P9": "9", "KC_PMNS": "−",
    "KC_PSLS": "÷", "KC_P4": "4", "KC_P5": "5", "KC_P6": "6",
    "KC_PPLS": "+", "KC_PENT": "Enter", "KC_PAST": "×",
    "KC_P1": "1", "KC_P2": "2", "KC_P3": "3", "KC_PDOT": ".",
    "KC_P0": "0", "QK_BOOT": "Boot",
    "MS_LEFT": "M⬅", "MS_DOWN": "M⬇", "MS_UP": "M⬆", "MS_RGHT": "M➡",
    "MS_WHLL": "W⬅", "MS_WHLD": "W⬇", "MS_WHLU": "W⬆", "MS_WHLR": "W➡",
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

AUTO_MOUSE_LABELS = {
    "KC_TAB": "⇥",
    "KC_LCTL": "⌃",
    "KC_RCTL": "⌃",
    "KC_LSFT": "⇧",
    "KC_RSFT": "⇧",
    "KC_LWIN": "⊞",
    "KC_RWIN": "⊞",
    "KC_LALT": "⌥",
    "KC_RALT": "⌥",
    "KC_ENT": "↵",
    "KC_ESC": "⎋",
}

MAIN_SHIFT_LABELS = {
    "JP_COMM": "<",
    "JP_DOT": ">",
    "JP_SLSH": "?",
}

TRANSPARENT_KEYCODES = frozenset(("_______", "KC_TRNS"))
DISABLED_KEYCODES = frozenset(("XXXXXXX", "KC_NO"))


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
            if matrix in geometries:
                raise ValueError(f"Duplicate matrix in VIA layout: {matrix}")
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
    if source in TRANSPARENT_KEYCODES | DISABLED_KEYCODES:
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
        return LAYER_LABELS.get(layer, layer) if layer in (*VISIBLE_LAYERS, "KGL_ESC") else ""
    if name == "MO" and arguments:
        layer = arguments[0]
        return LAYER_LABELS.get(layer, layer) if layer in (*VISIBLE_LAYERS, "KGL_ESC") else ""
    if name.endswith("_T"):
        modifier = name[:-2]
        return MODIFIER_LABELS.get(modifier, modifier.title())
    return ""


def layer_label(
    output_name: str,
    expression: str,
    definitions: dict[str, str],
    main_label: str,
    main_hold: str = "",
) -> str:
    label = label_for(expression, definitions)
    if output_name == "escape" and key_state(expression) == "disabled":
        return ""
    if output_name == "func" and label == main_label:
        return ""
    if output_name == "escape" and main_hold == LAYER_LABELS["KGL_ESC"]:
        # The Extra layer's own hold key shows its "return to Main" entry here,
        # which is redundant with releasing the hold, so hide it exceptionally.
        return ""
    return label


def key_state(expression: str) -> str:
    if expression in TRANSPARENT_KEYCODES:
        return "transparent"
    if expression in DISABLED_KEYCODES:
        return "disabled"
    return "assigned"


def auto_mouse_label(
    expression: str,
    definitions: dict[str, str],
    main_label: str = "",
    main_hold: str = "",
) -> str:
    resolved = resolve(expression, definitions)
    label = label_for(expression, definitions)
    if label and label in {main_label, main_hold}:
        return ""
    return AUTO_MOUSE_LABELS.get(resolved, label)


def main_shift_label(expression: str, definitions: dict[str, str]) -> str:
    return MAIN_SHIFT_LABELS.get(resolve(expression, definitions), "")


def validate_sources(
    positions: list[dict[str, object]],
    geometries: dict[tuple[int, int], dict[str, float]],
    layers: dict[str, list[str]],
    required_layers: tuple[str, ...] = VISIBLE_LAYERS,
) -> None:
    missing_layers = [
        layer for layer in required_layers if layer not in layers]
    if missing_layers:
        raise ValueError(f"Missing layers: {', '.join(missing_layers)}")

    for layer in required_layers:
        if len(layers[layer]) != len(positions):
            raise ValueError(
                f"{layer} has {len(layers[layer])} keys; layout has {len(positions)} positions"
            )

    position_matrices = [tuple(position["matrix"]) for position in positions]
    if len(position_matrices) != len(set(position_matrices)):
        raise ValueError("Duplicate matrix in info.json layout")
    missing_geometry = set(position_matrices) - geometries.keys()
    if missing_geometry:
        missing = ", ".join(map(str, sorted(missing_geometry)))
        raise ValueError(f"Matrices missing from VIA layout: {missing}")
    unused_geometry = geometries.keys() - set(position_matrices)
    if unused_geometry:
        unused = ", ".join(map(str, sorted(unused_geometry)))
        raise ValueError(f"Matrices missing from info.json layout: {unused}")


def build_layer_entry(
    output_name: str,
    source: str,
    definitions: dict[str, str],
    main_entry: dict[str, str],
) -> dict[str, str]:
    label = (
        auto_mouse_label(
            source,
            definitions,
            main_entry["label"],
            main_entry["hold"],
        )
        if output_name == "autoMouse"
        else layer_label(
            output_name, source, definitions, main_entry["label"], main_entry["hold"]
        )
    )
    return {
        "source": source,
        "expanded": resolve(source, definitions),
        "label": label,
        "state": key_state(source),
    }


def build_key(
    index: int,
    position: dict[str, object],
    geometry: dict[str, float],
    layers: dict[str, list[str]],
    definitions: dict[str, str],
) -> dict[str, object]:
    main_source = layers["KGL_MAIN"][index]
    main_entry = {
        "source": main_source,
        "expanded": resolve(main_source, definitions),
        "label": label_for(main_source, definitions),
        "shift": main_shift_label(main_source, definitions),
        "hold": hold_label(main_source, definitions),
        "state": key_state(main_source),
    }
    key: dict[str, object] = {
        "index": index,
        "matrix": position["matrix"],
        **geometry,
        "main": main_entry,
    }
    for output_name, layer_name in OUTPUT_LAYERS:
        key[output_name] = build_layer_entry(
            output_name,
            layers[layer_name][index] if layer_name in layers else "XXXXXXX",
            definitions,
            main_entry,
        )
    return key


def layout_version(keymap_path: Path = KEYMAP_PATH) -> str:
    """Use committed keymap history, with daily revisions counted in JST."""
    def git(*args: str) -> str:
        return subprocess.check_output(
            ["git", "-C", str(REPOSITORY_ROOT), *args], text=True
        ).strip()

    if git("rev-parse", "--is-shallow-repository") == "true":
        raise ValueError(
            "Layout version requires full Git history (fetch-depth: 0).")
    history = git(
        "log", "--follow", "--format=%cI", "--",
        str(keymap_path.relative_to(REPOSITORY_ROOT)),
    )
    if not history:
        raise ValueError("No committed history found for keymap.c.")
    jst = timezone(timedelta(hours=9))
    dates = [datetime.fromisoformat(line).astimezone(jst).date()
             for line in history.splitlines()]
    latest = dates[0]
    revision = dates.count(latest)
    suffix = ""
    while revision:
        revision, remainder = divmod(revision - 1, 26)
        suffix = chr(ord("a") + remainder) + suffix
    return f"v{latest:%Y.%m.%d}{suffix}"


def build_payload(
    info: dict[str, object],
    via: dict[str, object],
    layers: dict[str, list[str]],
    definitions: dict[str, str],
    keyboard_id: str = "kerigokbd_v2",
) -> dict[str, object]:
    keyboard_root = KEYBOARD_ROOT / keyboard_id
    config = KEYBOARD_CONFIGS[keyboard_id]
    keymap_path = keyboard_root / "keymaps/default/keymap.c"
    via_path = keyboard_root / "keymaps/via/via.json"
    layout_name = next(iter(info["layouts"]))
    positions = info["layouts"][layout_name]["layout"]
    geometries = parse_via_layout(via["layouts"]["keymap"])
    validate_sources(positions, geometries, layers, config["layers"])

    keys = [
        build_key(index, position, geometries[tuple(
            position["matrix"])], layers, definitions)
        for index, position in enumerate(positions)
    ]

    return {
        "id": keyboard_id,
        "keyboard": info["keyboard_name"],
        "layoutVersion": layout_version(keymap_path),
        "layout": layout_name,
        "source": str(keymap_path.relative_to(REPOSITORY_ROOT)),
        "geometrySource": str(via_path.relative_to(REPOSITORY_ROOT)),
        "trackpad": config["trackpad"],
        "keys": keys,
    }


def write_payload(payload: dict[str, object]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, ensure_ascii=False, indent=2)
    OUTPUT_PATH.write_text(
        f"window.KEYMAP_DATA = {serialized};\n",
        encoding="utf-8",
    )


def build_keyboard(keyboard_id: str) -> dict[str, object]:
    if keyboard_id not in KEYBOARD_CONFIGS:
        raise ValueError(f"Unsupported keyboard: {keyboard_id}")
    root = KEYBOARD_ROOT / keyboard_id
    info = json.loads((root / "info.json").read_text(encoding="utf-8"))
    via = json.loads(
        (root / "keymaps/via/via.json").read_text(encoding="utf-8"))
    definitions = parse_definitions(
        DEFINITIONS_PATH.read_text(encoding="utf-8"))
    layers = parse_layers(
        (root / "keymaps/default/keymap.c").read_text(encoding="utf-8"))
    return build_payload(info, via, layers, definitions, keyboard_id)


def main() -> None:
    keyboards = {name: build_keyboard(name) for name in KEYBOARD_CONFIGS}
    write_payload({"keyboards": keyboards})
    print(
        f"Generated {OUTPUT_PATH.relative_to(REPOSITORY_ROOT)} ({len(keyboards)} keyboards)")


if __name__ == "__main__":
    main()
