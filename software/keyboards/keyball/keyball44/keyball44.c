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

#include "lib/keyball/keyball.h"

//////////////////////////////////////////////////////////////////////////////

// clang-format off
matrix_row_t matrix_mask[MATRIX_ROWS] = {
    0b00111111,
    0b00111111,
    0b00111111,
    0b00111110,
    0b00111111,
    0b00111111,
    0b00111111,
    0b00111110,
};
// clang-format on

void keyball_on_adjust_layout(keyball_adjust_t v) {
#ifdef RGBLIGHT_ENABLE
    // adjust RGBLIGHT's clipping and effect ranges
    uint8_t lednum_this = keyball.this_have_ball ? 29 : 30;
    uint8_t lednum_that = !keyball.that_enable ? 0 : keyball.that_have_ball ? 29 : 30;
    rgblight_set_clipping_range(is_keyboard_left() ? 0 : lednum_that, lednum_this);
    rgblight_set_effect_range(0, lednum_this + lednum_that);
#endif
}

#define RGBLIGHT_TIMEOUT 30000
static uint32_t last_activity_time = 0;
static bool     rgblight_active    = true;
void matrix_scan_user(void) {
    uint32_t current_time = timer_read32();
    if (rgblight_active && (current_time - last_activity_time > RGBLIGHT_TIMEOUT)) {
        rgblight_disable();
        rgblight_active = false;
    }
}
bool process_record_user(uint16_t keycode, keyrecord_t *record) {
    if (record->event.pressed) {
        last_activity_time = timer_read32();
        if (!rgblight_active) {
            rgblight_enable();
            rgblight_active = true;
        }
    }
    return true;
}
