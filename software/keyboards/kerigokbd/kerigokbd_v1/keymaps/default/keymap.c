// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// keymap.c for KERIgoKBD v1

#include QMK_KEYBOARD_H
#include "kerigokbd.h"

// clang-format off
#ifdef LAYOUT_split_6_7_7_4
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
  [0] = LAYOUT_split_6_7_7_4(
     KC_TAB,    KC_Q,    KC_W,    KC_E,    KC_R,    KC_T,          /**/             KC_Y,    KC_U,    KC_I,    KC_O,   KC_P,  KC_BSPC,
    KC_LCTL,    KC_A,    KC_S,    KC_D,    KC_F,    KC_G,   MO(5), /**/   MO(5),    KC_H,    KC_J,    KC_K,    KC_L, JP_MINS,  KC_ENT,
    KC_LSFT,    KC_Z,    KC_X,    KC_C,    KC_V,    KC_B,  K_PSCR, /**/ K_APSCR,    KC_N,    KC_M, JP_COMM,  JP_DOT, JP_SLSH,  KC_DEL,
                               KC_LGUI, KEY_ALT, KEY_NUM,  KC_ESC, /**/  KC_SPC, KEY_FUN, KEY_WIN, KC_RALT
  ),
  [1] = LAYOUT_split_6_7_7_4(
    _______, JP_EXLM, JP_DQUO, JP_HASH,  JP_DLR, JP_PERC,          /**/          JP_AMPR, JP_QUOT, JP_ASTR, JP_CIRC, JP_TILD, _______,
    _______,    KC_1,    KC_2,    KC_3,    KC_4,    KC_5, KC_VOLU, /**/ KC_BRIU,    KC_6,    KC_7,    KC_8,    KC_9,    KC_0, _______,
    _______,  JP_GRV,   JP_AT, JP_SCLN, JP_COLN, JP_UNDS, KC_VOLD, /**/ KC_BRID, JP_PIPE, JP_PLUS,  JP_EQL,  JP_DOT, JP_BSLS, _______,
                               _______, _______, _______, _______, /**/ _______, _______, _______, _______
  ),
  [2] = LAYOUT_split_6_7_7_4(
    _______,   KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5,          /**/            KC_F6,   KC_F7,   KC_F8,   KC_F9,  KC_F10, _______,
    _______, JP_LPRN, JP_LCBR, JP_RCBR, JP_LBRC, JP_RBRC,  KC_F11, /**/  KC_F12, KC_LEFT, KC_DOWN,   KC_UP, KC_RGHT, JP_RPRN, _______,
    _______, MS_BTN2, MS_WHLL, MS_WHLU, MS_WHLD, MS_WHLR, MS_BTN3, /**/ MS_BTN3, MS_LEFT, MS_DOWN,   MS_UP, MS_RGHT, MS_BTN1, _______,
                               _______, _______, _______, _______, /**/ _______, _______, _______, _______
  ),
  [3] = LAYOUT_split_6_7_7_4(
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,          /**/          XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
                               _______, _______, _______, _______, /**/ _______, _______, _______, _______
  ),
  [4] = LAYOUT_split_6_7_7_4(
    _______, QK_KB_0, QK_KB_2, MS_BTN3, XXXXXXX, XXXXXXX,          /**/          XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, QK_KB_1, QK_KB_3, QK_KB_6, QK_KB_4, XXXXXXX, XXXXXXX, /**/ MS_BTN2, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ MS_BTN1, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
                               XXXXXXX, MS_BTN2, MS_BTN1, XXXXXXX, /**/ MS_BTN3, XXXXXXX, XXXXXXX, XXXXXXX
  ),
  [5] = LAYOUT_split_6_7_7_4(
    XXXXXXX, RGB_SAI, RGB_HUI, RGB_VAI, RGB_SPI, RGB_MOD,          /**/          RGB_MOD, RGB_SPI, RGB_VAI, RGB_HUI, RGB_SAI, XXXXXXX,
    XXXXXXX, RGB_SAD, RGB_HUD, RGB_VAD, RGB_SPD,RGB_RMOD, RGB_TOG, /**/ RGB_TOG,RGB_RMOD, RGB_SPD, RGB_VAD, RGB_HUD, RGB_SAD, XXXXXXX,
    XXXXXXX,RGB_M_TW,RGB_M_SW, RGB_M_G, RGB_M_B, RGB_M_P, RGB_M_R, /**/ RGB_M_R, RGB_M_P, RGB_M_B, RGB_M_G,RGB_M_SW,RGB_M_TW, XXXXXXX,
                               XXXXXXX, XXXXXXX,   TO(1), QK_BOOT, /**/ QK_BOOT,   TO(2), XXXXXXX, XXXXXXX
  ),
};
#endif
// clang-format on

#ifdef POINTING_DEVICE_ENABLE
#    if defined(POINTING_DEVICE_AUTO_MOUSE_ENABLE)
void pointing_device_init_user(void) {
    set_auto_mouse_enable(true); // always required before the auto mouse feature will work
}
bool is_mouse_record_kb(uint16_t keycode, keyrecord_t *record) {
    switch (keycode) {
        case QK_KB_0 ... QK_KB_7:
            return true;
    }
    return is_mouse_record_user(keycode, record);
}
#    endif // POINTING_DEVICE_AUTO_MOUSE_ENABLE

enum custom_keycodes {
    DRAG_SCROLL = QK_KB_6,
};

bool set_scrolling = false;

// Modify these values to adjust the scrolling speed
#    define SCROLL_DIVISOR_H 16.0
#    define SCROLL_DIVISOR_V 16.0

// Variables to store accumulated scroll values
float scroll_accumulated_h = 0;
float scroll_accumulated_v = 0;

// Function to handle mouse reports and perform drag scrolling
report_mouse_t pointing_device_task_user(report_mouse_t mouse_report) {
    // Check if drag scrolling is active
    if (set_scrolling) {
        // Calculate and accumulate scroll values based on mouse movement and divisors
        scroll_accumulated_h += (float)mouse_report.x / SCROLL_DIVISOR_H;
        scroll_accumulated_v += (float)mouse_report.y / SCROLL_DIVISOR_V;

        // Assign integer parts of accumulated scroll values to the mouse report
        mouse_report.h = (int8_t)scroll_accumulated_h;
        mouse_report.v = (int8_t)scroll_accumulated_v;

        // Update accumulated scroll values by subtracting the integer parts
        scroll_accumulated_h -= (int8_t)scroll_accumulated_h;
        scroll_accumulated_v -= (int8_t)scroll_accumulated_v;

        // Clear the X and Y values of the mouse report
        mouse_report.x = 0;
        mouse_report.y = 0;
    }
    return mouse_report;
}

// Function to handle key events and enable/disable drag scrolling
bool process_record_user(uint16_t keycode, keyrecord_t *record) {
    switch (keycode) {
        case DRAG_SCROLL:
            // Toggle set_scrolling when DRAG_SCROLL key is pressed or released
            set_scrolling = record->event.pressed;
            break;
        default:
            break;
    }
    return true;
}

// Function to handle layer changes and disable drag scrolling when not in AUTO_MOUSE_DEFAULT_LAYER
layer_state_t layer_state_set_user(layer_state_t state) {
    // Disable set_scrolling if the current layer is not the AUTO_MOUSE_DEFAULT_LAYER
    if (get_highest_layer(state) != AUTO_MOUSE_DEFAULT_LAYER) {
        set_scrolling = false;
    }
    return state;
}
#endif // POINTING_DEVICE_ENABLE
