#!/usr/bin/env python3
"""Generate physical keyboard layout data for the realtime keymap editor.

This script does not read keymap.c at all: the editor fetches keycode
values live from the keyboard over WebHID, addressed by (layer, row, col).
It only needs the physical key geometry and matrix coordinates, taken from
info.json (or keyboard.json)/via.json, in the same order VIA's LAYOUT_xxx(...) macro expects
(which matters for exporting the live keymap back to C source).
"""

from __future__ import annotations

import json
import re
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
KEYBOARD_ROOT = REPOSITORY_ROOT / "software/qmk/keyboards/kerigokbd"
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public/generated"

TRACKPAD_REPLACED_MATRIXES = ((7, 4), (7, 3))
TRACKPAD_GEOMETRY = {"x": 10.125, "y": 3.15, "width": 1.75, "height": 1.75}

# keyball44rp's right trackball (config.h: POINTING_DEVICE_RIGHT), over the
# two right thumb keys VIA hides when "Ball availability" is "Right".
TRACKBALL_REPLACED_MATRIXES = ((7, 2), (7, 3))
TRACKBALL_GEOMETRY = {"x": 11.3, "y": 3.05, "width": 2.0, "height": 2.0}

# "layoutOptions" picks a VIA layout option's choice by option index
# (unlisted options use choice 0, VIA's own default).
KEYBOARD_CONFIGS = {
    "kerigokbd_v1": {"layerCount": 6, "trackpad": None},
    "kerigokbd_corne_v4": {"layerCount": 6, "trackpad": None},
    "kerigokbd_v2": {
        "layerCount": 7,
        "trackpad": {
            **TRACKPAD_GEOMETRY,
            "label": "Trackpad",  # also names its KGL_AM layer
            "labelJa": "トラックパッド",
            "activeText": "接触中",
            "tapClick": True,  # tapping the pad left-clicks (kerigokbd_v2.c)
            "replaces": [list(matrix) for matrix in TRACKPAD_REPLACED_MATRIXES],
        },
    },
    "keyball44rp": {
        "layerCount": 7,
        "layoutOptions": {0: 1},  # Ball availability: Right
        "trackpad": {
            **TRACKBALL_GEOMETRY,
            "label": "Trackball",
            "labelJa": "トラックボール",
            "activeText": "操作中",
            "tapClick": False,
            "replaces": [list(matrix) for matrix in TRACKBALL_REPLACED_MATRIXES],
        },
    },
}


Geometry = dict[str, float]


def parse_via_layout(
    rows: list[list[object]],
    layout_options: dict[int, int],
) -> tuple[dict[tuple[int, int], Geometry], dict[tuple[int, int], Geometry]]:
    """Parse the KLE-compatible physical layout stored in VIA JSON.

    VIA's layout options put "option,choice" in a key's 4th legend line;
    only keys of the chosen choice (`layout_options`, else choice 0) are
    drawn. Returns the drawn keys, plus where each matrix that isn't drawn
    under the chosen choices sits in another choice -- keyball44rp's thumb
    keys under its trackball still need a position in the edit view.
    """
    geometries: dict[tuple[int, int], Geometry] = {}
    hidden: dict[tuple[int, int], Geometry] = {}
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
                if "ry" in item:
                    rotation_y = float(item["ry"])
                # Like KLE, setting either rotation origin moves the cursor to
                # the (possibly inherited) origin -- kerigokbd_corne_v4's
                # right thumb sets only rx and keeps the previous ry.
                if "rx" in item or "ry" in item:
                    cursor_x = rotation_x
                    cursor_y = rotation_y
                cursor_x += float(item.get("x", 0))
                cursor_y += float(item.get("y", 0))
                width = float(item.get("w", width))
                height = float(item.get("h", height))
                continue

            if not isinstance(item, str):
                raise ValueError(f"Unsupported VIA layout key: {item!r}")
            legends = item.split("\n")
            option = legends[3] if len(legends) > 3 else ""
            if option and not re.fullmatch(r"\d+,\d+", option):
                raise ValueError(f"Unsupported VIA layout option: {item!r}")
            if not legends[0]:
                matrix = None  # a blank placeholder (e.g. where a ball sits)
            elif re.fullmatch(r"\d+,\d+", legends[0]):
                matrix = tuple(int(value) for value in legends[0].split(","))
            else:
                raise ValueError(f"Unsupported VIA layout key: {item!r}")
            drawn = True
            if option:
                option_index, choice = (int(value) for value in option.split(","))
                drawn = layout_options.get(option_index, 0) == choice
            target = geometries if drawn else hidden
            if matrix is None or (not drawn and matrix in hidden):
                cursor_x += width
                width = 1.0
                height = 1.0
                continue
            if drawn and matrix in geometries:
                raise ValueError(f"Duplicate matrix in VIA layout: {matrix}")
            target[matrix] = {
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

    return geometries, {matrix: geometry for matrix, geometry in hidden.items() if matrix not in geometries}


def validate_positions(
    positions: list[dict[str, object]],
    geometries: dict[tuple[int, int], Geometry],
) -> None:
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


def build_layout(keyboard_id: str) -> dict[str, object]:
    config = KEYBOARD_CONFIGS[keyboard_id]
    root = KEYBOARD_ROOT / keyboard_id
    # Newer QMK keyboards (kerigokbd_corne_v4) name it keyboard.json.
    info_path = root / "info.json"
    if not info_path.exists():
        info_path = root / "keyboard.json"
    info = json.loads(info_path.read_text(encoding="utf-8"))
    via = json.loads((root / "keymaps/via/via.json").read_text(encoding="utf-8"))

    layout_name = next(iter(info["layouts"]))
    positions = info["layouts"][layout_name]["layout"]
    geometries, hidden = parse_via_layout(via["layouts"]["keymap"], config.get("layoutOptions", {}))
    # Keys a pointing device covers aren't drawn by VIA under the chosen
    # option, but stay editable (at their position in another choice).
    for matrix in (config["trackpad"] or {}).get("replaces", []):
        matrix = tuple(matrix)
        if matrix not in geometries and matrix in hidden:
            geometries[matrix] = hidden[matrix]
    validate_positions(positions, geometries)

    matrices = [tuple(position["matrix"]) for position in positions]
    matrix_rows = max(matrix[0] for matrix in matrices) + 1
    matrix_cols = max(matrix[1] for matrix in matrices) + 1

    keys = [
        {"matrix": list(matrix), **geometries[matrix]}
        for matrix in matrices
    ]

    return {
        "id": keyboard_id,
        "keyboard": info["keyboard_name"],
        "layoutName": layout_name,
        "matrixRows": matrix_rows,
        "matrixCols": matrix_cols,
        "layerCount": config["layerCount"],
        # Identifies a connected device as this keyboard (WebHID filters,
        # and selecting this layout when it connects).
        "usb": {"vendorId": int(info["usb"]["vid"], 16), "productId": int(info["usb"]["pid"], 16)},
        "trackpad": config["trackpad"],
        "keys": keys,
    }


def write_layout(keyboard_id: str, layout: dict[str, object]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"layout-{keyboard_id}.js"
    serialized = json.dumps(layout, ensure_ascii=False, indent=2)
    output_path.write_text(
        f"// Generated by scripts/build_layout.py. Do not edit by hand.\n"
        f"export const LAYOUT = {serialized};\n",
        encoding="utf-8",
    )
    print(f"Generated {output_path.relative_to(REPOSITORY_ROOT)}")


def main() -> None:
    for keyboard_id in KEYBOARD_CONFIGS:
        write_layout(keyboard_id, build_layout(keyboard_id))


if __name__ == "__main__":
    main()
