// SPDX-License-Identifier: GPL-2.0-or-later
// Copyright 2025 KERI's Lab

#include "kerigokbd.h"

/* RGB Matrix Custom Effect "keyfunc" */
#ifdef RGB_MATRIX_CUSTOM_USER

static bool is_keycode_special(uint16_t keycode) {
    if (IS_MODIFIER_KEYCODE(keycode)) return true;               //< Ctrl, Alt, Shift, Win
    if (KC_ENTER <= keycode && keycode <= KC_SPACE) return true; //< ENT, ESC, BSPC, TAB, SPC
    if (keycode == KC_DEL || keycode == KEY_ALT || keycode == KEY_WIN) return true;
    return false;
}

static bool is_keycode_symbol(uint16_t keycode) {
    if (S(KC_1) <= keycode && keycode <= S(KC_0)) return true;
    if (KC_MINS <= keycode && keycode <= KC_QUOT) return true; // exclude JP_ZKHK(KC_GRV)
    if (KC_COMM <= keycode && keycode <= KC_SLSH) return true;
    if (S(KC_MINS) <= keycode && keycode <= S(KC_SLSH)) return true;
    if (keycode == JP_BSLS || keycode == JP_UNDS || keycode == JP_PIPE || keycode == JP_YEN) return true;
    return false;
}

/* called by rgb_matrix_user.inc */
bool rgb_matrix_user_keyfunc(void) {
    for (uint8_t row = 0; row < MATRIX_ROWS; row++) {
        for (uint8_t col = 0; col < MATRIX_COLS; col++) {
            /* get keycode */
            uint8_t index = g_led_config.matrix_co[row][col];
            if (index == NO_LED) continue;
            int8_t   layer   = get_highest_layer(layer_state);
            uint16_t keycode = keymap_key_to_keycode(layer, (keypos_t){col, row});
            for (; layer >= 0 && keycode == KC_TRNS; layer--)
                keycode = keymap_key_to_keycode(layer, (keypos_t){col, row});
            /* set color */
            if (keycode == KC_NO) {
                /* Empty */ rgb_matrix_set_color(index, RGB_OFF);
            } else if (keycode >= KC_A && keycode <= KC_Z) {
                /* Alphabet */ rgb_matrix_set_color(index, COLOR_BLUE);
            } else if (is_keycode_special(keycode)) {
                /* Special */ rgb_matrix_set_color(index, COLOR_GREEN);
            } else if (is_keycode_symbol(keycode)) {
                /* Symbol */ rgb_matrix_set_color(index, COLOR_YELLOW);
            } else if ((keycode >= KC_1 && keycode <= KC_0) || keycode == KEY_NUM) {
                /* Number */ rgb_matrix_set_color(index, COLOR_MAGENTA);
            } else if ((keycode >= KC_F1 && keycode <= KC_F12) || keycode == KEY_FUN) {
                /* Function */ rgb_matrix_set_color(index, COLOR_CYAN);
            } else if (keycode >= KC_RIGHT && keycode <= KC_UP) {
                /* Arrow */ rgb_matrix_set_color(index, COLOR_ORANGE);
            } else if (keycode == QK_BOOTLOADER) {
                /* Bootloader */ rgb_matrix_set_color(index, COLOR_RED);
            } else if (IS_MOUSEKEY_MOVE(keycode) || IS_MOUSEKEY_WHEEL(keycode)) {
                /* Mouse (Move) */ rgb_matrix_set_color(index, COLOR_PURPLE);
            } else if (IS_MOUSEKEY_BUTTON(keycode)) {
                /* Mouse (Button) */ rgb_matrix_set_color(index, COLOR_BLUE);
            } else if (IS_UNDERGLOW_KEYCODE(keycode)) {
                /* LED */ rgb_matrix_set_color(index, COLOR_MAGENTA);
            } else {
                /* Other */ rgb_matrix_set_color(index, COLOR_WHITE);
            }
        }
    }
    return false;
}
#endif // RGB_MATRIX_CUSTOM_USER
