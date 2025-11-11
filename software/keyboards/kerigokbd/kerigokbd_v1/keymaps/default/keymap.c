// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// keymap.c for KERIgoKBD v1

#include QMK_KEYBOARD_H
#include "kerigokbd.h"

// clang-format off
#ifdef LAYOUT_split_6_7_7_4
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
  [0] = LAYOUT_split_6_7_7_4( /* Default Layer */
    KC_TAB , KC_Q   , KC_W   , KC_E   , KC_R   , KC_T   ,          /**/          KC_Y   , KC_U   , KC_I   , KC_O   , KC_P   , KC_BSPC,
    KC_LCTL, KC_A   , KC_S   , KC_D   , KC_F   , KC_G   , KG_EXTL, /**/ KG_EXTR, KC_H   , KC_J   , KC_K   , KC_L   , JP_MINS, KC_ENT ,
    KC_LSFT, KC_Z   , KC_X   , KC_C   , KC_V   , KC_B   , KG_EXBL, /**/ KG_EXBR, KC_N   , KC_M   , JP_COMM, JP_DOT , JP_SLSH, KC_DEL ,
                               KG_WIN , KG_ALT , KG_NUM , KG_ESC , /**/ KC_SPC , KG_FUN , KG_WIN , KG_ALT
  ),
  [1] = LAYOUT_split_6_7_7_4( /* Numbers and Symbols Layer */
    _______, JP_EXLM, JP_AT  , JP_HASH, JP_DLR , JP_PERC,          /**/          JP_CIRC, JP_AMPR, JP_ASTR, JP_PLUS, JP_PIPE, _______,
    _______, KC_1   , KC_2   , KC_3   , KC_4   , KC_5   , JP_DQUO, /**/ JP_QUOT, KC_6   , KC_7   , KC_8   , KC_9   , KC_0   , JP_DOT ,
    KC_LWIN, JP_GRV , JP_TILD, JP_SCLN, JP_COLN, JP_UNDS, KC_VOLD, /**/ KC_VOLU, JP_LBRC ,JP_RBRC, JP_LCBR, JP_RCBR, JP_BSLS, JP_EQL ,
                               _______, _______, _______, _______, /**/ _______, JP_LPRN, JP_RPRN, _______
  ),
  [2] = LAYOUT_split_6_7_7_4( /* Functions and Navigation Layer */
    _______,   KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5,          /**/            KC_F6,   KC_F7,   KC_F8,   KC_F9,  KC_F10, _______,
    _______, KC_HOME, MS_BTN1, MS_WHLU, MS_BTN2, KC_PGUP,  KC_F11, /**/  KC_F12, KC_LEFT, KC_DOWN,   KC_UP, KC_RGHT, MS_BTN2,  KC_ENT,
    KC_LSFT,  KC_END, MS_WHLL, MS_WHLD, MS_WHLR, KC_PGDN, MS_BTN3, /**/ MS_BTN3, MS_LEFT, MS_DOWN,   MS_UP, MS_RGHT, MS_BTN1,  KC_DEL,
                               _______, _______, _______, _______, /**/ _______,  KG_FUN,  KG_WIN, _______
  ),
  [3] = LAYOUT_split_6_7_7_4( /* Tenkey and Left Hand Device */
    _______,   KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5,          /**/          KC_P7  , KC_P8  , KC_P9  , KC_PMNS,  KC_TAB, _______,
    _______, A(KC_1), A(KC_2), A(KC_3), A(KC_4), A(KC_5),  KC_F11, /**/ KC_PSLS, KC_P4  , KC_P5  , KC_P6  , KC_PPLS,   KC_UP, _______,
    _______, C(KC_Z), C(KC_X), C(KC_C), C(KC_V), C(KC_B),  KC_F12, /**/ KC_PAST, KC_P1  , KC_P2  , KC_P3  , KC_LEFT, KC_DOWN, KC_RGHT,
                               XXXXXXX, XXXXXXX, XXXXXXX, KG_MAIN, /**/ KC_NUM , MO(4)  , KC_P0  , KC_PDOT
  ),
  [4] = LAYOUT_split_6_7_7_4( /* Tentative Layer */
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,          /**/          XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, KC_LEFT, KC_DOWN,   KC_UP, KC_RGHT, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, KC_DEL ,
                               _______, _______, _______, KG_MAIN, /**/ _______, _______, _______, _______
  ),
  [5] = LAYOUT_split_6_7_7_4( /* Auto Mouse Layer (PointingDevice only) */
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,          /**/          XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, KG_SCRL, KG_SLOW, XXXXXXX, MS_BTN2, /**/ MS_BTN2, XXXXXXX, KG_SLOW, KG_SCRL, MS_BTN3, MS_BTN1, _______,
    _______, MS_BTN2, MS_WHLL, MS_WHLU, MS_WHLD, MS_WHLR, MS_BTN3, /**/ MS_BTN3, MS_LEFT, MS_DOWN,   MS_UP, MS_RGHT, MS_BTN1, _______,
                               KC_LWIN, KC_LALT, MS_BTN1, XXXXXXX, /**/ MS_BTN1, XXXXXXX, MS_BTN3, MS_BTN2
  ),
  [6] = LAYOUT_split_6_7_7_4( /* Config Layer */
    XXXXXXX, RGB_SAI, RGB_HUI, RGB_VAI, RGB_SPI, RGB_MOD,          /**/          RGB_MOD, RGB_SPI, RGB_VAI, RGB_HUI, RGB_SAI, XXXXXXX,
    XXXXXXX, RGB_SAD, RGB_HUD, RGB_VAD, RGB_SPD,RGB_RMOD, RGB_TOG, /**/ RGB_TOG,RGB_RMOD, RGB_SPD, RGB_VAD, RGB_HUD, RGB_SAD, XXXXXXX,
    QK_BOOT, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, QK_BOOT,
                               XXXXXXX, XXXXXXX, KG_TNUM, KG_TTEN, /**/ XXXXXXX, KG_TFUN, XXXXXXX, XXXXXXX
  ),
};
#endif
// clang-format on

#if 0
void keyboard_post_init_user(void) {
    debug_enable   = true;
    debug_matrix   = true;
    debug_keyboard = true;
    debug_mouse    = true;
}
#endif
