import sys
import unittest
from pathlib import Path


SCRIPT_DIRECTORY = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPT_DIRECTORY))

import generate  # noqa: E402


class GenerateTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.definitions = generate.parse_definitions(
            generate.DEFINITIONS_PATH.read_text(encoding="utf-8")
        )
        cls.layers = generate.parse_layers(generate.KEYMAP_PATH.read_text(encoding="utf-8"))

    def test_visible_layers_have_48_keys(self):
        for layer in generate.VISIBLE_LAYERS:
            self.assertEqual(len(self.layers[layer]), 48)

    def test_modifier_tap_labels(self):
        self.assertEqual(generate.label_for("KG_LALT", self.definitions), "無変換")
        self.assertEqual(generate.hold_label("KG_LALT", self.definitions), "Alt")

    def test_layer_tap_labels(self):
        self.assertEqual(generate.label_for("KG_ESC", self.definitions), "Esc")
        self.assertEqual(generate.hold_label("KG_ESC", self.definitions), "")
        self.assertEqual(generate.hold_label("MO(KGL_NUM)", self.definitions), "Num")
        self.assertEqual(generate.hold_label("MO(KGL_AM)", self.definitions), "Mouse")

    def test_layers_outside_quick_reference_are_hidden(self):
        for expression in ("KG_ESC", "KG_TEMP", "KG_EXBL", "KG_EXBR"):
            self.assertEqual(generate.hold_label(expression, self.definitions), "")

    def test_compact_key_labels(self):
        self.assertEqual(generate.label_for("KC_DEL", self.definitions), "Delete")
        self.assertEqual(generate.label_for("KC_BSPC", self.definitions), "Backspace")
        self.assertEqual(generate.label_for("KG_APRS", self.definitions), "Alt+PrSc")

    def test_bold_arrow_labels(self):
        self.assertEqual(generate.label_for("KC_RGHT", self.definitions), "➡")
        self.assertEqual(generate.label_for("KG_MSL", self.definitions), "M⬅")
        self.assertEqual(generate.label_for("KG_MWLU", self.definitions), "W⬆")

    def test_auto_mouse_uses_compact_key_symbols(self):
        self.assertEqual(generate.auto_mouse_label("KC_TAB", self.definitions), "⇥")
        self.assertEqual(generate.auto_mouse_label("KC_ENT", self.definitions), "↵")
        self.assertEqual(generate.auto_mouse_label("MS_BTN1", self.definitions), "M1")
        self.assertEqual(generate.auto_mouse_label("KG_ZOOM", self.definitions), "Zoom")
        self.assertEqual(
            generate.auto_mouse_label("KC_TAB", self.definitions, "Tab"),
            "",
        )
        self.assertEqual(
            generate.auto_mouse_label("KC_LWIN", self.definitions, "変換", "Win"),
            "",
        )
        self.assertEqual(
            generate.auto_mouse_label("KC_LALT", self.definitions, "無変換", "Alt"),
            "",
        )
        self.assertEqual(
            generate.auto_mouse_label("KC_BSPC", self.definitions, "Backspace"),
            "",
        )
        self.assertEqual(
            generate.auto_mouse_label("KC_DEL", self.definitions, "Delete"),
            "",
        )

    def test_main_shift_labels(self):
        self.assertEqual(generate.main_shift_label("JP_COMM", self.definitions), "<")
        self.assertEqual(generate.main_shift_label("JP_DOT", self.definitions), ">")
        self.assertEqual(generate.main_shift_label("JP_SLSH", self.definitions), "?")
        self.assertEqual(generate.main_shift_label("KC_A", self.definitions), "")

    def test_duplicate_func_label_is_hidden(self):
        self.assertEqual(
            generate.layer_label("func", "KC_LSFT", self.definitions, "Shift"),
            "",
        )
        self.assertEqual(
            generate.layer_label("nums", "KC_LSFT", self.definitions, "Shift"),
            "Shift",
        )

    def test_nested_commas_are_not_split(self):
        self.assertEqual(generate.split_arguments("KC_A, LT(KGL_ESC, KC_ESC), KC_B"), [
            "KC_A", "LT(KGL_ESC, KC_ESC)", "KC_B"
        ])

    def test_via_layout_contains_all_keys_and_thumb_rotations(self):
        via = generate.json.loads(generate.VIA_PATH.read_text(encoding="utf-8"))
        geometries = generate.parse_via_layout(via["layouts"]["keymap"])
        self.assertEqual(len(geometries), 48)
        self.assertEqual(geometries[(3, 5)]["rotation"], 10)
        self.assertEqual(geometries[(3, 6)]["rotation"], 20)
        self.assertEqual(geometries[(7, 6)]["rotation"], -20)

    def test_info_layout_matches_via_layout(self):
        info = generate.json.loads(generate.INFO_PATH.read_text(encoding="utf-8"))
        via = generate.json.loads(generate.VIA_PATH.read_text(encoding="utf-8"))
        geometries = generate.parse_via_layout(via["layouts"]["keymap"])
        layout = info["layouts"]["LAYOUT_split_6_7_7_4"]["layout"]
        self.assertEqual(len(layout), len(geometries))

        for key in layout:
            expected = geometries[tuple(key["matrix"])]
            actual = {
                "x": float(key["x"]),
                "y": float(key["y"]),
                "width": float(key.get("w", 1)),
                "height": float(key.get("h", 1)),
                "rotation": float(key.get("r", 0)),
                "rotationX": float(key.get("rx", 0)),
                "rotationY": float(key.get("ry", 0)),
            }
            self.assertEqual(actual, expected, key["matrix"])

    def test_trackpad_replaces_two_unused_right_thumb_keys(self):
        info = generate.json.loads(generate.INFO_PATH.read_text(encoding="utf-8"))
        layout = info["layouts"]["LAYOUT_split_6_7_7_4"]["layout"]
        for matrix in generate.TRACKPAD_REPLACED_MATRIXES:
            key_index = next(
                index
                for index, key in enumerate(layout)
                if tuple(key["matrix"]) == matrix
            )
            self.assertEqual(self.layers["KGL_MAIN"][key_index], "XXXXXXX")

    def test_trackpad_is_compact_and_centered(self):
        geometry = generate.TRACKPAD_GEOMETRY
        self.assertEqual(geometry["width"], geometry["height"])
        self.assertEqual(geometry["x"] + geometry["width"] / 2, 11)


if __name__ == "__main__":
    unittest.main()
