/*
Copyright 2022 @Yowkees
Copyright 2022 MURAOKA Taro (aka KoRoN, @kaoriya)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

#include QMK_KEYBOARD_H

#include "quantum.h"
#include "keymap_japanese.h"

// clang-format off
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
  // keymap for default (VIA)
  [0] = LAYOUT_universal(
    KC_TAB ,    KC_Q,    KC_W,    KC_E,    KC_R,    KC_T,        /* */ KC_Y,    KC_U,    KC_I,    KC_O,   KC_P,  KC_BSPC,
    KC_LCTL,    KC_A,    KC_S,    KC_D,    KC_F,    KC_G,        /* */ KC_H,    KC_J,    KC_K,    KC_L, JP_MINS,  KC_ENT,
    KC_LSFT,    KC_Z,    KC_X,    KC_C,    KC_V,    KC_B,        /* */ KC_N,    KC_M, JP_COMM,  JP_DOT, JP_SLSH,  KC_DEL,
    RWIN_T(JP_HENK), LALT_T(JP_MHEN), /**/ MO(1), MO(3), KC_ESC, /* */ KC_SPC, MO(2), /**/ _______, _______, /**/ A(KC_PSCR)
  ),
  [1] = LAYOUT_universal(
    _______, _______, _______, _______, _______, _______, /* */ RGB_MOD, RGB_SPI, RGB_VAI, RGB_HUI, RGB_SAI, _______,
    _______, _______, _______, _______, _______, _______, /* */RGB_RMOD, RGB_SPD, RGB_VAD, RGB_HUD, RGB_SAD, _______,
    _______, MS_BTN4, MS_BTN5, MS_BTN3, MS_BTN1, MS_BTN2, /* */ RGB_M_P, RGB_M_R,RGB_M_SW, RGB_M_G,RGB_M_TW, _______,
        _______, _______, /**/ _______, _______, _______, /* */ _______, _______, /* */ _______, _______, /**/ QK_BOOT
  ),
  [2] = LAYOUT_universal(
    _______,   KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5, /* */   KC_F6,   KC_F7,   KC_F8,   KC_F9,  KC_F10, _______,
    _______, JP_LPRN, JP_LCBR, JP_RCBR, JP_LBRC, JP_RBRC, /* */ KC_LEFT, KC_DOWN,   KC_UP, KC_RGHT, JP_RPRN, _______,
    _______, MS_BTN2, MS_WHLL, MS_WHLU, MS_WHLD, MS_WHLR, /* */ MS_LEFT, MS_DOWN,   MS_UP, MS_RGHT, MS_BTN1, _______,
         KC_F11,  KC_F12, /**/ _______, _______, _______, /* */ _______, _______, /* */ _______, _______, /**/ QK_BOOT
  ),
  [3] = LAYOUT_universal(
    _______, JP_EXLM, JP_DQUO, JP_HASH,  JP_DLR, JP_PERC, /* */ JP_AMPR, JP_QUOT, JP_ASTR, JP_CIRC, JP_TILD, _______,
    _______,    KC_1,    KC_2,    KC_3,    KC_4,    KC_5, /* */    KC_6,    KC_7,    KC_8,    KC_9,    KC_0, _______,
    _______,  JP_GRV,   JP_AT, JP_SCLN, JP_COLN, JP_UNDS, /* */ JP_PIPE, JP_PLUS,  JP_EQL, _______, JP_BSLS, _______,
        _______, _______, /**/ _______, _______, _______, /* */ _______, _______, /* */ _______, _______, /**/ QK_BOOT
  ),
};
// clang-format on

layer_state_t layer_state_set_user(layer_state_t state) {
    // Auto enable scroll mode when the highest layer is 3
    keyball_set_scroll_mode(get_highest_layer(state) == 3);
    return state;
}

#ifdef OLED_ENABLE

#    include "lib/oledkit/oledkit.h"

void oledkit_render_info_user(void) {
    keyball_oled_render_keyinfo();
    keyball_oled_render_ballinfo();
    keyball_oled_render_layerinfo();
}
#endif
