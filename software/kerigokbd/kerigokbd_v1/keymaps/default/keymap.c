#include QMK_KEYBOARD_H
#include <kerigokbd.h>

#ifdef LAYOUT_split_6_7_7_4
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
  [0] = LAYOUT_split_6_7_7_4(
      KC_TAB,     KC_Q,    KC_W,    KC_E,    KC_R,    KC_T,                         KC_Y,    KC_U,    KC_I,    KC_O,   KC_P,  KC_BSPC,
      KC_LCTL,    KC_A,    KC_S,    KC_D,    KC_F,    KC_G, MO(5),          MO(5),  KC_H,    KC_J,    KC_K,    KC_L, JP_MINS,  KC_ENT,
      KC_LSFT,    KC_Z,    KC_X,    KC_C,    KC_V,    KC_B, LSG(KC_S), A(KC_PSCR),  KC_N,    KC_M, JP_COMM,  JP_DOT, JP_SLSH,  KC_DEL,
                                 KC_LGUI, KEY_ALT, KEY_NUM,  KC_ESC,     KC_SPC, KEY_FUN, KEY_WIN, KC_RALT
  ),
  [1] = LAYOUT_split_6_7_7_4(
      _______, JP_EXLM, JP_DQUO, JP_HASH,  JP_DLR, JP_PERC,                      JP_AMPR, JP_QUOT, JP_ASTR, JP_CIRC, JP_TILD, _______,
      _______,    KC_1,    KC_2,    KC_3,    KC_4,    KC_5, KC_VOLU,    KC_BRIU,    KC_6,    KC_7,    KC_8,    KC_9,    KC_0, _______,
      _______,  JP_GRV,   JP_AT, JP_SCLN, JP_COLN, JP_UNDS, KC_VOLD,    KC_BRID, JP_PIPE, JP_PLUS,  JP_EQL, _______, JP_BSLS, _______,
                                 _______, _______, _______, _______,    _______, _______, _______, _______
  ),
  [2] = LAYOUT_split_6_7_7_4(
      _______,   KC_F1,   KC_F2,   KC_F3,   KC_F4,   KC_F5,                        KC_F6,   KC_F7,   KC_F8,   KC_F9,  KC_F10, _______,
      _______, JP_LPRN, JP_LCBR, JP_RCBR, JP_LBRC, JP_RBRC,  KC_F11,     KC_F12, KC_LEFT, KC_DOWN,   KC_UP, KC_RGHT, JP_RPRN, _______,
      _______, MS_BTN2, MS_WHLL, MS_WHLD, MS_WHLU, MS_WHLR, _______,    _______, MS_LEFT, MS_DOWN,   MS_UP, MS_RGHT, MS_BTN1, _______,
                                 _______, _______, _______, _______,    _______, _______, _______, _______
  ),
  [3] = LAYOUT_split_6_7_7_4(
      XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,                      XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,
      XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,    XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,
      XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,    XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,
                                 _______, _______, _______, _______,    _______, _______, _______, _______
  ),
  [4] = LAYOUT_split_6_7_7_4(
      XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,                      XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,
      XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,    XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,
      XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,    XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,
                                 _______, _______, _______, _______,    _______, _______, _______, _______
  ),
  [5] = LAYOUT_split_6_7_7_4(
      XXXXXXX, RGB_SPI, RGB_VAI, RGB_SAI, RGB_HUI, RGB_MOD,                      XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,
      XXXXXXX, RGB_SPD, RGB_VAD, RGB_SAD, RGB_HUD,RGB_RMOD, RGB_M_R,    RGB_TOG, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,
      XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, RGB_M_R,    RGB_TOG, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX, XXXXXXX,
                                 XXXXXXX, XXXXXXX, XXXXXXX, QK_BOOT,    QK_BOOT, XXXXXXX, XXXXXXX, XXXXXXX
  ),
};
#endif