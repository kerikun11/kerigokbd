#include "kerigokbd.h"

/* LED defintions */
#define LED_VALUE 192
#define COLOR_ALPHA 0, 0, LED_VALUE * 2 / 3
#define COLOR_SPECIAL 0, LED_VALUE * 2 / 3, 0
#define COLOR_NUMBER LED_VALUE, 0, LED_VALUE
#define COLOR_SYMBOL LED_VALUE, LED_VALUE * 2 / 3, 0
#define COLOR_FUNCTION 0, LED_VALUE * 2 / 3, LED_VALUE * 2 / 3
#define COLOR_ARROW LED_VALUE, LED_VALUE / 4, 0
#define COLOR_OTHER LED_VALUE * 2 / 3, LED_VALUE * 2 / 3, LED_VALUE * 2 / 3

extern bool rgb_matrix_user_keyfunc(void);

bool rgb_matrix_user_keyfunc(void) {
    for (uint8_t row = 0; row < MATRIX_ROWS; row++) {
        for (uint8_t col = 0; col < MATRIX_COLS; col++) {
            uint8_t index = g_led_config.matrix_co[row][col];
            if (index == NO_LED) continue;
            int8_t   layer   = get_highest_layer(layer_state);
            uint16_t keycode = dynamic_keymap_get_keycode(layer, row, col);
            for (; layer >= 0 && keycode == KC_TRNS; layer--)
                keycode = dynamic_keymap_get_keycode(layer, row, col);
            if (keycode == KC_NO || keycode == KC_TRNS) {
                rgb_matrix_set_color(index, RGB_OFF);
            } else if (keycode >= KC_A && keycode <= KC_Z) {
                rgb_matrix_set_color(index, COLOR_ALPHA);
            } else if (keycode >= KC_1 && keycode <= KC_0) {
                rgb_matrix_set_color(index, COLOR_NUMBER);
            } else if ((keycode >= S(JP_1) && keycode <= S(JP_0)) || (keycode >= KC_MINS && keycode <= KC_QUOT) || (keycode >= KC_COMM && keycode <= KC_SLSH) || (keycode >= S(KC_MINS) && keycode <= S(KC_SLSH))) {
                rgb_matrix_set_color(index, COLOR_SYMBOL);
            } else if (keycode == JP_BSLS || keycode == JP_UNDS || keycode == JP_PIPE || keycode == JP_YEN) {
                rgb_matrix_set_color(index, COLOR_SYMBOL);
            } else if (keycode >= KC_F1 && keycode <= KC_F12) {
                rgb_matrix_set_color(index, COLOR_FUNCTION);
            } else if (keycode >= KC_RIGHT && keycode <= KC_UP) {
                rgb_matrix_set_color(index, COLOR_ARROW);
            } else if (keycode == KC_LCTL || keycode == KC_RCTL || keycode == KC_LSFT || keycode == KC_RSFT || keycode == KC_LALT || keycode == KC_RALT || keycode == KC_LWIN || keycode == KC_RWIN || keycode == KC_ENT || keycode == KC_SPC || keycode == KC_TAB || keycode == KC_BSPC || keycode == KC_DEL || keycode == KC_ESC) {
                rgb_matrix_set_color(index, COLOR_SPECIAL);
            } else if (keycode == KEY_ALT || keycode == KEY_WIN) {
                rgb_matrix_set_color(index, COLOR_SPECIAL);
            } else if (keycode == KEY_NUM) {
                rgb_matrix_set_color(index, COLOR_NUMBER);
            } else if (keycode == KEY_FUN) {
                rgb_matrix_set_color(index, COLOR_FUNCTION);
            } else {
                rgb_matrix_set_color(index, COLOR_OTHER);
            }
        }
    }
    return false;
}
