// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

#include QMK_KEYBOARD_H

void keyboard_pre_init_user(void) {
    setPinInputHigh(SPLIT_HAND_PIN);
}

#ifdef POINTING_DEVICE_ENABLE

#    if defined(POINTING_DEVICE_AUTO_MOUSE_ENABLE)
void pointing_device_init_user(void) {
    set_auto_mouse_enable(true); // always required before the auto mouse feature will work
}
bool is_mouse_record_kb(uint16_t keycode, keyrecord_t *record) {
    switch (keycode) {
        case QK_KB_0 ... QK_KB_1:
            return true;
    }
    return is_mouse_record_user(keycode, record);
}
#    endif // POINTING_DEVICE_AUTO_MOUSE_ENABLE

#    define SCROLL_DIVISOR 16.0f

static bool scroll_mode = false;
static bool slow_mode   = false;

static float accum_h = 0;
static float accum_v = 0;

report_mouse_t pointing_device_task_user(report_mouse_t mouse_report) {
    float divisor = SCROLL_DIVISOR;
    if (slow_mode) {
        mouse_report.x /= 4;
        mouse_report.y /= 4;
        divisor *= 2;
    }
    if (scroll_mode) {
        accum_h += (float)mouse_report.x / divisor; // as float
        accum_v += (float)mouse_report.y / divisor; // as float
        mouse_report.h = (int8_t)accum_h;           // cast to integer
        mouse_report.v = (int8_t)accum_v;           // cast to integer
        accum_h -= mouse_report.h;                  // remove integer part
        accum_v -= mouse_report.v;                  // remove integer part
        mouse_report.x = 0;
        mouse_report.y = 0;
    }
    return mouse_report;
}

bool process_record_user(uint16_t keycode, keyrecord_t *record) {
    switch (keycode) {
        case KG_POINTING_SCROLL:
            scroll_mode = record->event.pressed;
            break;
        case KG_POINTING_SLOW:
            slow_mode = record->event.pressed;
            break;
    }
    return true;
}

layer_state_t layer_state_set_user(layer_state_t state) {
    if (get_highest_layer(state) != AUTO_MOUSE_DEFAULT_LAYER) {
        scroll_mode = false;
        slow_mode   = false;
    }
    return state;
}

#endif // POINTING_DEVICE_ENABLE
