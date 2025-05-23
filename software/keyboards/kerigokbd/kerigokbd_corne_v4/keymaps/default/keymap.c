// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// keymap.c for KERIgoKBD Corne V4

#include QMK_KEYBOARD_H
#include "kerigokbd.h"

// clang-format off
#ifdef LAYOUT_split_3x6_3_ex2
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
  [0] = LAYOUT_split_3x6_3_ex2(
     KC_TAB,    KC_Q,    KC_W,    KC_E,    KC_R,    KC_T, KG_EXUL, /**/ KG_EXUR,    KC_Y,    KC_U,    KC_I,    KC_O,    KC_P, KC_BSPC,
    KC_LCTL,    KC_A,    KC_S,    KC_D,    KC_F,    KC_G, KG_EXBL, /**/ KG_EXBR,    KC_H,    KC_J,    KC_K,    KC_L, JP_MINS,  KC_ENT,
    KC_LSFT,    KC_Z,    KC_X,    KC_C,    KC_V,    KC_B,          /**/             KC_N,    KC_M, JP_COMM,  JP_DOT, JP_SLSH,  KC_DEL,
                                         KG_ALT,  KG_NUM,  KC_ESC, /**/  KC_SPC,  KG_FUN,  KG_WIN
  ),
  [1] = LAYOUT_split_3x6_3_ex2(
    _______, JP_EXLM, JP_DQUO, JP_HASH,  JP_DLR, JP_PERC, KC_VOLU, /**/ KC_BRIU, JP_AMPR, JP_QUOT, JP_ASTR, JP_CIRC, JP_TILD, _______,
    _______,    KC_1,    KC_2,    KC_3,    KC_4,    KC_5, KC_VOLD, /**/ KC_BRID,    KC_6,    KC_7,    KC_8,    KC_9,    KC_0, _______,
    _______,  JP_GRV,   JP_AT, JP_SCLN, JP_COLN, JP_UNDS,          /**/          JP_PIPE, JP_PLUS,  JP_EQL,  JP_DOT, JP_BSLS, _______,
                                        KC_LWIN, _______, _______, /**/ _______, _______, KC_RALT
  ),
  [2] = LAYOUT_split_3x6_3_ex2(
    _______,   KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5,  KC_F11, /**/  KC_F12,   KC_F6,   KC_F7,   KC_F8,   KC_F9,  KC_F10, _______,
    _______, JP_LPRN, JP_LCBR, JP_RCBR, JP_LBRC, JP_RBRC, MS_BTN3, /**/ MS_BTN3, KC_LEFT, KC_DOWN,   KC_UP, KC_RGHT, JP_RPRN, _______,
    _______, MS_BTN2, MS_WHLL, MS_WHLU, MS_WHLD, MS_WHLR,          /**/          MS_LEFT, MS_DOWN,   MS_UP, MS_RGHT, MS_BTN1, _______,
                                        KC_LWIN, _______, _______, /**/ _______, _______, KC_RALT
  ),
  [3] = LAYOUT_split_3x6_3_ex2(
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,          /**/          XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
                                        _______, _______, _______, /**/ _______, _______, _______
  ),
  [4] = LAYOUT_split_3x6_3_ex2(
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,          /**/          XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
                                        _______, _______, _______, /**/ _______, _______, _______
  ),
  [5] = LAYOUT_split_3x6_3_ex2(
    XXXXXXX, RGB_SAI, RGB_HUI, RGB_VAI, RGB_SPI, RGB_MOD, RGB_TOG, /**/ RGB_TOG, RGB_MOD, RGB_SPI, RGB_VAI, RGB_HUI, RGB_SAI, XXXXXXX,
    XXXXXXX, RGB_SAD, RGB_HUD, RGB_VAD, RGB_SPD,RGB_RMOD, RGB_M_R, /**/ RGB_M_R,RGB_RMOD, RGB_SPD, RGB_VAD, RGB_HUD, RGB_SAD, XXXXXXX,
    XXXXXXX,RGB_M_TW,RGB_M_SW, RGB_M_G, RGB_M_B, RGB_M_P,          /**/          RGB_M_P, RGB_M_B, RGB_M_G,RGB_M_SW,RGB_M_TW, XXXXXXX,
                                        XXXXXXX,   TO(1), QK_BOOT, /**/ QK_BOOT,   TO(2), XXXXXXX
  ),
};
#endif

#ifdef ENCODER_MAP_ENABLE
const uint16_t PROGMEM encoder_map[][NUM_ENCODERS][NUM_DIRECTIONS] = {
  [0] = { ENCODER_CCW_CW(RGB_MOD, RGB_RMOD), ENCODER_CCW_CW(RGB_HUI, RGB_HUD), ENCODER_CCW_CW(RGB_VAI, RGB_VAD), ENCODER_CCW_CW(RGB_SAI, RGB_SAD), },
  [1] = { ENCODER_CCW_CW(RGB_MOD, RGB_RMOD), ENCODER_CCW_CW(RGB_HUI, RGB_HUD), ENCODER_CCW_CW(RGB_VAI, RGB_VAD), ENCODER_CCW_CW(RGB_SAI, RGB_SAD), },
  [2] = { ENCODER_CCW_CW(RGB_MOD, RGB_RMOD), ENCODER_CCW_CW(RGB_HUI, RGB_HUD), ENCODER_CCW_CW(RGB_VAI, RGB_VAD), ENCODER_CCW_CW(RGB_SAI, RGB_SAD), },
  [3] = { ENCODER_CCW_CW(RGB_MOD, RGB_RMOD), ENCODER_CCW_CW(RGB_HUI, RGB_HUD), ENCODER_CCW_CW(RGB_VAI, RGB_VAD), ENCODER_CCW_CW(RGB_SAI, RGB_SAD), },
  [4] = { ENCODER_CCW_CW(RGB_MOD, RGB_RMOD), ENCODER_CCW_CW(RGB_HUI, RGB_HUD), ENCODER_CCW_CW(RGB_VAI, RGB_VAD), ENCODER_CCW_CW(RGB_SAI, RGB_SAD), },
  [5] = { ENCODER_CCW_CW(RGB_MOD, RGB_RMOD), ENCODER_CCW_CW(RGB_HUI, RGB_HUD), ENCODER_CCW_CW(RGB_VAI, RGB_VAD), ENCODER_CCW_CW(RGB_SAI, RGB_SAD), },
};
#endif
// clang-format on
