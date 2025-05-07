// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// keymap.c for Keyball44 default (via)

#include QMK_KEYBOARD_H
#include "kerigokbd.h"
#include "lib/trackpad.h"

// clang-format off
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
  [0] = LAYOUT_universal(
    KC_TAB ,    KC_Q,    KC_W,    KC_E,    KC_R,    KC_T, /**/    KC_Y,    KC_U,    KC_I,    KC_O,   KC_P,  KC_BSPC,
    KC_LCTL,    KC_A,    KC_S,    KC_D,    KC_F,    KC_G, /**/    KC_H,    KC_J,    KC_K,    KC_L, JP_MINS,  KC_ENT,
    KC_LSFT,    KC_Z,    KC_X,    KC_C,    KC_V,    KC_B, /**/    KC_N,    KC_M, JP_COMM,  JP_DOT, JP_SLSH,  KC_DEL,
      MO(3),  KG_WIN,    /**/   KG_ALT,   MO(1),  KC_ESC, /**/  KC_SPC,   MO(2),    /**/  XXXXXXX, XXXXXXX, /**/ KC_PSCR
  ),
  [1] = LAYOUT_universal(
    _______, JP_EXLM, JP_DQUO, JP_HASH,  JP_DLR, JP_PERC, /**/ JP_AMPR, JP_QUOT, JP_ASTR, JP_CIRC, JP_TILD, _______,
    _______,    KC_1,    KC_2,    KC_3,    KC_4,    KC_5, /**/    KC_6,    KC_7,    KC_8,    KC_9,    KC_0, _______,
    _______,  JP_GRV,   JP_AT, JP_SCLN, JP_COLN, JP_UNDS, /**/ JP_PIPE, JP_PLUS,  JP_EQL,  JP_DOT, JP_BSLS, _______,
    _______, _______,    /**/  _______, _______, _______, /**/ _______, _______,    /**/  XXXXXXX, XXXXXXX, /**/ QK_BOOT
  ),
  [2] = LAYOUT_universal(
    _______,   KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5, /**/   KC_F6,   KC_F7,   KC_F8,   KC_F9,  KC_F10, _______,
    _______, JP_LPRN, JP_LCBR, JP_RCBR, JP_LBRC, JP_RBRC, /**/ KC_LEFT, KC_DOWN,   KC_UP, KC_RGHT, JP_RPRN, _______,
    _______, MS_BTN2, MS_WHLL, MS_WHLU, MS_WHLD, MS_WHLR, /**/ MS_LEFT, MS_DOWN,   MS_UP, MS_RGHT, MS_BTN1, _______,
     KC_F11,  KC_F12,    /**/  _______, _______, _______, /**/ _______, _______,    /**/  XXXXXXX, XXXXXXX, /**/ QK_BOOT
  ),
  [3] = LAYOUT_universal(
    _______,   SN_RV,   SN_FW, DRGSCRL,  DPI_FW,  DPI_RV, /**/ RGB_MOD, RGB_SPI, RGB_VAI, RGB_HUI, RGB_SAI, _______,
    _______, MS_BTN4, MS_BTN2, MS_BTN3, MS_BTN1, MS_BTN5, /**/RGB_RMOD, RGB_SPD, RGB_VAD, RGB_HUD, RGB_SAD, _______,
    _______, DRG_TOG, SNP_TOG, SNIPING, JP_MHEN, JP_HENK, /**/ RGB_M_P, RGB_M_R,RGB_M_SW, RGB_M_G,RGB_M_TW, _______,
    KC_VOLD, KC_VOLU,    /**/  _______,   TO(1), _______, /**/ _______,   TO(2),    /**/  XXXXXXX, XXXXXXX, /**/ QK_BOOT
  ),
  [4] = LAYOUT_universal(
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, QK_KB_6, QK_KB_4, XXXXXXX, /**/ MS_BTN2, MS_BTN1, MS_BTN3, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    XXXXXXX, XXXXXXX,    /**/  MS_BTN2, MS_BTN1, XXXXXXX, /**/ MS_BTN3, XXXXXXX,    /**/  XXXXXXX, XXXXXXX, /**/ QK_BOOT
  ),
};
// clang-format on
