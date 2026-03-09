// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// keymap.c for Keyball44 default (via)

#include QMK_KEYBOARD_H
#include "kerigokbd.h"

// clang-format off
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
  [0] = LAYOUT_universal( /* Default Layer */
    KC_TAB , KC_Q   , KC_W   , KC_E   , KC_R   , KC_T   , /**/ KC_Y   , KC_U   , KC_I   , KC_O   , KC_P   , KC_BSPC,
    KC_LCTL, KC_A   , KC_S   , KC_D   , KC_F   , KC_G   , /**/ KC_H   , KC_J   , KC_K   , KC_L   , JP_MINS, KC_ENT ,
    KC_LSFT, KC_Z   , KC_X   , KC_C   , KC_V   , KC_B   , /**/ KC_N   , KC_M   , JP_COMM, JP_DOT , JP_SLSH, KC_DEL ,
      KG_R4, KG_L4  ,     /**/ KG_LALT, KG_NUM , KG_ESC , /**/ KC_SPC , KG_FUN ,   /**/   XXXXXXX, XXXXXXX, /**/ KG_RWIN
  ),
  [1] = LAYOUT_universal( /* Numbers and Symbols Layer */
    _______, JP_EXLM, JP_DQUO, JP_HASH, JP_DLR , JP_PERC, /**/ JP_AMPR, JP_QUOT, JP_EQL , JP_TILD, JP_PIPE, _______,
    _______, KC_1   , KC_2   , KC_3   , KC_4   , KC_5   , /**/ KC_6   , KC_7   , KC_8   , KC_9   , KC_0   , _______,
    KC_LWIN, JP_GRV , JP_AT  , JP_SCLN, JP_COLN, JP_UNDS, /**/ JP_CIRC, JP_PLUS, JP_ASTR, JP_DOT , JP_BSLS, _______,
    _______, _______,    /**/  _______, _______, _______, /**/ _______, _______,    /**/  XXXXXXX, XXXXXXX, /**/ _______
  ),
  [2] = LAYOUT_universal( /* Functions and Navigation Layer */
    _______, KC_F1  , KC_F2  , KC_F3  , KC_F4  , KC_F5  , /**/ KC_F6  , KC_F7  , KC_F8  , KC_F9  , KC_F10 , _______,
    _______, JP_LPRN, JP_LCBR, JP_RCBR, JP_LBRC ,JP_RBRC, /**/ KC_LEFT, KC_DOWN, KC_UP  , KC_RGHT, JP_RPRN, _______,
    KC_LSFT, MS_BTN2, MS_WHLL, MS_WHLU, MS_WHLD, MS_WHLR, /**/ MS_LEFT, MS_DOWN, MS_UP  , MS_RGHT, MS_BTN1, _______,
     KC_F11,  KC_F12,    /**/  KC_LWIN, _______, _______, /**/ _______, _______,    /**/  XXXXXXX, XXXXXXX, /**/ _______
  ),
  [3] = LAYOUT_universal( /* Tenkey and Left Hand Device */
    _______,   KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5, /**/ KC_P7  , KC_P8  , KC_P9  , KC_PMNS, KC_TAB , _______,
    _______, A(KC_1), A(KC_2), A(KC_3), A(KC_4), A(KC_5), /**/ KC_P4  , KC_P5  , KC_P6  , KC_PPLS, KC_UP  , _______,
    _______, C(KC_Z), C(KC_X), C(KC_C), C(KC_V), C(KC_B), /**/ KC_P1  , KC_P2  , KC_P3  , KC_LEFT, KC_DOWN, KC_RGHT,
    QK_BOOT, XXXXXXX,    /**/  MS_BTN2, MS_BTN1,  KC_NUM, /**/ KC_P0  , KC_PDOT,    /**/  XXXXXXX, XXXXXXX, /**/ KG_MAIN
  ),
  [4] = LAYOUT_universal( /* Auto Mouse Layer */
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, KG_SLOW, KG_SCRL, XXXXXXX, /**/ MS_BTN2, MS_BTN1, MS_BTN3, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    QK_BOOT, XXXXXXX,    /**/  MS_BTN2, MS_BTN1, XXXXXXX, /**/ MS_BTN3, XXXXXXX,    /**/  XXXXXXX, XXXXXXX, /**/ QK_BOOT
  ),
  [5] = LAYOUT_universal(
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ RGB_MOD, RGB_SPI, RGB_VAI, RGB_HUI, RGB_SAI, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/RGB_RMOD, RGB_SPD, RGB_VAD, RGB_HUD, RGB_SAD, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ RGB_M_P, RGB_M_R,RGB_M_SW, RGB_M_G,RGB_M_TW, _______,
    KC_VOLD, KC_VOLU,    /**/  _______,   TO(1), _______, /**/ _______,   TO(2),    /**/  XXXXXXX, XXXXXXX, /**/ _______
  ),
};
// clang-format on
