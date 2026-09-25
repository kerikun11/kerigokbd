// SPDX-License-Identifier: GPL-2.0-or-later
#include "kerigokbd.c"

uint16_t wcad_test_keymap_key_to_keycode(uint8_t layer, keypos_t key);
uint16_t keycode_at_keymap_location(uint8_t layer, uint8_t row, uint8_t col) {
    return wcad_test_keymap_key_to_keycode(layer, (keypos_t){.row = row, .col = col});
}
