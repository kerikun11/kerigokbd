// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// keymap.c for KERIgoKBD v1

#include QMK_KEYBOARD_H
#include "kerigokbd.h"

// clang-format off
#ifdef LAYOUT_split_6_7_7_4
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
  [KGL_MAIN] = LAYOUT_split_6_7_7_4( /* Default Layer */
    KC_TAB , KC_Q   , KC_W   , KC_E   , KC_R   , KC_T   ,          /**/          KC_Y   , KC_U   , KC_I   , KC_O   , KC_P   , KC_BSPC,
    KC_LCTL, KC_A   , KC_S   , KC_D   , KC_F   , KC_G   , KG_EXTL, /**/ KG_EXTR, KC_H   , KC_J   , KC_K   , KC_L   , JP_MINS, KC_ENT ,
    KC_LSFT, KC_Z   , KC_X   , KC_C   , KC_V   , KC_B   , KG_EXBL, /**/ KG_EXBR, KC_N   , KC_M   , JP_COMM, JP_DOT , JP_SLSH, KC_DEL ,
                               KG_L4  , KG_LALT, KG_NUM , KG_ESC , /**/ KG_SPC , KG_FUN , KG_RWIN, KG_R4
  ),
  [KGL_NUM] = LAYOUT_split_6_7_7_4( /* Numbers and Symbols Layer */
    _______, JP_EXLM, JP_DQUO, JP_HASH, JP_DLR , JP_PERC,          /**/          JP_AMPR, JP_QUOT, JP_EQL , JP_TILD, JP_PIPE, _______,
    _______, KC_1   , KC_2   , KC_3   , KC_4   , KC_5   , KC_PSCR, /**/ KC_VOLU, KC_6   , KC_7   , KC_8   , KC_9   , KC_0   , _______,
    KC_LWIN, JP_GRV , JP_AT  , JP_SCLN, JP_COLN, JP_UNDS, KG_APRS, /**/ KC_VOLD, JP_CIRC, JP_PLUS, JP_ASTR, JP_DOT , JP_BSLS, _______,
                               JP_ZKHK, KC_LWIN, _______, _______, /**/ _______, _______, KC_RALT, KC_RSFT
  ),
  [KGL_FUN] = LAYOUT_split_6_7_7_4( /* Functions and Navigation Layer */
    _______, KC_F1  , KC_F2  , KC_F3  , KC_F4  , KC_F5  ,          /**/          KC_F6  , KC_F7  , KC_F8  , KC_F9  , KC_F10 , _______,
    _______, JP_LPRN, JP_LCBR, JP_RCBR, JP_LBRC ,JP_RBRC,  KC_F11, /**/ MS_BTN3, KC_LEFT, KC_DOWN, KC_UP  , KC_RGHT, JP_RPRN, _______,
    KC_LSFT, MS_BTN2, MS_WHLL, MS_WHLU, MS_WHLD, MS_WHLR,  KC_F12, /**/ MS_BTN2, MS_LEFT, MS_DOWN, MS_UP  , MS_RGHT, MS_BTN1, _______,
                               JP_ZKHK, KC_LWIN, _______, _______, /**/ _______, _______, KC_RALT, KC_RSFT
  ),
  [KGL_ESC] = LAYOUT_split_6_7_7_4( /* Tenkey and Left Hand Device */
    _______,   KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5,          /**/          KC_P7  , KC_P8  , KC_P9  , KC_PMNS, KC_PENT, _______,
    _______, A(KC_1), A(KC_2), A(KC_3), A(KC_4), A(KC_5),  KC_F11, /**/ KC_PSLS, KC_P4  , KC_P5  , KC_P6  , KC_PPLS, KC_UP  , _______,
    _______, MS_BTN1, MS_BTN3, MS_BTN2, KC_DEL , KC_BSPC,  KC_F12, /**/ KC_PAST, KC_P1  , KC_P2  , KC_P3  , KC_LEFT, KC_DOWN, KC_RGHT,
                               XXXXXXX, XXXXXXX,  KC_NUM, KG_MAIN, /**/ JP_LPRN, JP_RPRN, KC_P0  , KC_PDOT
  ),
  [KGL_TEMP] = LAYOUT_split_6_7_7_4( /* Tentative Layer */
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,          /**/          XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
    _______, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, _______,
                               XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX
  ),
  [KGL_CONF] = LAYOUT_split_6_7_7_4( /* Config Layer */
    XXXXXXX, RM_SATU, RM_HUEU, RM_VALU, RM_SPDU, RM_NEXT,          /**/          RM_NEXT, RM_SPDU, RM_VALU, RM_HUEU, RM_SATU, XXXXXXX,
    XXXXXXX, RM_SATD, RM_HUED, RM_VALD, RM_SPDD, RM_PREV, RM_TOGG, /**/ RM_TOGG, RM_PREV, RM_SPDD, RM_VALD, RM_HUED, RM_SATD, XXXXXXX,
    QK_BOOT, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, QK_BOOT,
                               XXXXXXX, XXXXXXX, KG_TNUM, KG_TESC, /**/ KG_TESC, KG_TFUN, XXXXXXX, XXXXXXX
  ),
  [KGL_AM] = LAYOUT_split_6_7_7_4( /* Auto Mouse Layer (PointingDevice only) */
    KC_TAB , XXXXXXX, XXXXXXX, MS_BTN3, XXXXXXX, XXXXXXX,          /**/          XXXXXXX, XXXXXXX, MS_BTN3, XXXXXXX, XXXXXXX, XXXXXXX,
    KC_LCTL, XXXXXXX, MS_BTN1, KG_SCRL, MS_BTN2, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, MS_BTN1, KG_SCRL, MS_BTN2, XXXXXXX, XXXXXXX,
    KC_LSFT, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,
                               KC_LWIN, KC_LALT, MS_BTN1, KC_ESC , /**/ XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX
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
