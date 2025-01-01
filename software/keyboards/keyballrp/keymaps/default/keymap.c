// Copyright 2023 QMK
// SPDX-License-Identifier: GPL-2.0-or-later

#include QMK_KEYBOARD_H

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {

  [0] = LAYOUT_right_ball(
    QK_BOOT  , KC_W     , KC_E     , KC_R     , KC_T     ,                            KC_Y     , KC_U     , KC_I     , DPI_MOD     , QK_BOOT  ,
    KC_A     , KC_S     , KC_D     , KC_F     , KC_G     ,                            KC_H     , KC_BTN1     , DRGSCRL     , DPI_RMOD     , KC_SCLN  ,
    EE_CLR   , KC_X     , KC_C     , KC_V     , KC_B     ,                            KC_N     , KC_M     , KC_COMM  , KC_DOT   , EE_CLR   ,
    KC_LCTL  , KC_LGUI  , KC_LALT  , KC_ESC   , KC_SPC   , KC_TAB   ,      KC_BSPC  , KC_ENT                                    , KC_RSFT
  )
};
