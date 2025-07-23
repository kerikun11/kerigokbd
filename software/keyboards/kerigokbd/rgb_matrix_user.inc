// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

RGB_MATRIX_EFFECT(keyfunc)

#ifdef RGB_MATRIX_CUSTOM_EFFECT_IMPLS

#    include "kerigokbd.h"
#    include <color.h>

/* LED Color definitions */
#    define LED_VALUE 96
#    define COLOR_RED LED_VALUE * 2 / 3, 0, 0
#    define COLOR_GREEN 0, LED_VALUE * 2 / 3, 0
#    define COLOR_BLUE 0, 0, LED_VALUE * 2 / 3
#    define COLOR_MAGENTA LED_VALUE * 2 / 3, 0, LED_VALUE * 2 / 3
#    define COLOR_YELLOW LED_VALUE, LED_VALUE * 2 / 3, 0
#    define COLOR_CYAN 0, LED_VALUE * 2 / 3, LED_VALUE * 2 / 3
#    define COLOR_WHITE LED_VALUE * 2 / 3, LED_VALUE * 2 / 3, LED_VALUE * 2 / 3
#    define COLOR_ORANGE LED_VALUE, LED_VALUE / 4, 0
#    define COLOR_PURPLE LED_VALUE / 2, 0, LED_VALUE

static bool is_keycode_special(uint16_t keycode) {
    if (IS_MODIFIER_KEYCODE(keycode)) return true; //< Ctrl, Alt, Shift, Win
    switch (keycode) {
        case KC_ENTER ... KC_SPACE: //< ENT, ESC, BSPC, TAB, SPC
        case KC_DEL:
        case KG_ALT:
        case KG_WIN:
        case KG_ESC:
        case KC_VOLU ... KC_VOLD:
            return true;
    }
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

static bool keyfunc(effect_params_t* params) {
    for (uint8_t row = 0; row < MATRIX_ROWS; row++) {
        for (uint8_t col = 0; col < MATRIX_COLS; col++) {
            /* get keycode */
            uint8_t index = g_led_config.matrix_co[row][col];
            if (index == NO_LED) continue;
            int8_t   layer   = get_highest_layer(layer_state);
            uint16_t keycode = KC_TRNS;
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
            } else if ((keycode >= KC_1 && keycode <= KC_0) || keycode == KG_NUM) {
                /* Number */ rgb_matrix_set_color(index, COLOR_MAGENTA);
            } else if ((keycode >= KC_F1 && keycode <= KC_F12) || keycode == KG_FUN) {
                /* Function */ rgb_matrix_set_color(index, COLOR_CYAN);
            } else if (keycode >= KC_RIGHT && keycode <= KC_UP) {
                /* Arrow */ rgb_matrix_set_color(index, COLOR_ORANGE);
            } else if (keycode == QK_BOOTLOADER) {
                /* Bootloader */ rgb_matrix_set_color(index, COLOR_RED);
            } else if (IS_MOUSEKEY_MOVE(keycode) || IS_MOUSEKEY_WHEEL(keycode)) {
                /* Mouse (Move) */ rgb_matrix_set_color(index, COLOR_PURPLE);
            } else if (keycode == MS_BTN1) {
                /* Mouse (Button Right) */ rgb_matrix_set_color(index, COLOR_BLUE);
            } else if (keycode == MS_BTN2) {
                /* Mouse (Button Left) */ rgb_matrix_set_color(index, COLOR_GREEN);
            } else if (keycode == MS_BTN3) {
                /* Mouse (Button Center) */ rgb_matrix_set_color(index, COLOR_ORANGE);
            } else if (keycode == MS_BTN4 || keycode == MS_BTN5) {
                /* Mouse (Button 4/5) */ rgb_matrix_set_color(index, COLOR_ORANGE);
            } else if (keycode >= A(KC_1) && keycode <= A(KC_0)) {
                /* Alt+Num */ rgb_matrix_set_color(index, COLOR_GREEN);
            } else if (keycode >= KG_POINTING_SLOW && keycode <= KG_POINTING_SCROLL) {
                /* KG */ rgb_matrix_set_color(index, COLOR_CYAN);
            } else if (IS_UNDERGLOW_KEYCODE(keycode)) {
                /* LED */ rgb_matrix_set_color(index, COLOR_GREEN);
            } else {
                /* Other */ rgb_matrix_set_color(index, COLOR_WHITE);
            }
        }
    }
    return false;
}

#endif // RGB_MATRIX_CUSTOM_EFFECT_IMPLS
