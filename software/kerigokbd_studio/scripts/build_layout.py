#!/usr/bin/env python3
"""Generate physical keyboard layout data for the realtime keymap editor.

This script does not read keymap.c at all: the editor fetches keycode
values live from the keyboard over WebHID, addressed by (layer, row, col).
It only needs the physical key geometry and matrix coordinates, taken from
info.json/via.json, in the same order VIA's LAYOUT_xxx(...) macro expects
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

KEYBOARD_CONFIGS = {
    "kerigokbd_v1": {"layerCount": 6, "trackpad": None},
    "kerigokbd_v2": {
        "layerCount": 7,
        "trackpad": {
            **TRACKPAD_GEOMETRY,
            "replaces": [list(matrix) for matrix in TRACKPAD_REPLACED_MATRIXES],
        },
    },
}


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


def validate_positions(
    positions: list[dict[str, object]],
    geometries: dict[tuple[int, int], dict[str, float]],
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
    info = json.loads((root / "info.json").read_text(encoding="utf-8"))
    via = json.loads((root / "keymaps/via/via.json").read_text(encoding="utf-8"))

    layout_name = next(iter(info["layouts"]))
    positions = info["layouts"][layout_name]["layout"]
    geometries = parse_via_layout(via["layouts"]["keymap"])
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
