// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

#include QMK_KEYBOARD_H

#ifdef POINTING_DEVICE_ENABLE

#    ifdef POINTING_DEVICE_AUTO_MOUSE_ENABLE
void pointing_device_init_kb(void) {
    set_auto_mouse_enable(true);
    pointing_device_init_user();
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
#    define SLOW_DIVISOR 4.0f

static bool scroll_mode = false;
static bool slow_mode   = false;

static float accum_h      = 0.0f;
static float accum_v      = 0.0f;
static float accum_slow_x = 0.0f;
static float accum_slow_y = 0.0f;

report_mouse_t pointing_device_task_kb(report_mouse_t mouse_report) {
    float divisor = SCROLL_DIVISOR;

    if (slow_mode) {
        accum_slow_x += (float)mouse_report.x / SLOW_DIVISOR;
        accum_slow_y += (float)mouse_report.y / SLOW_DIVISOR;
        mouse_report.x = (int8_t)accum_slow_x;
        mouse_report.y = (int8_t)accum_slow_y;
        accum_slow_x -= mouse_report.x;
        accum_slow_y -= mouse_report.y;

        divisor *= 2.0f;
    } else {
        accum_slow_x = 0.0f;
        accum_slow_y = 0.0f;
    }

    if (scroll_mode) {
        accum_h += (float)mouse_report.x / divisor;
        accum_v += (float)mouse_report.y / divisor;
        mouse_report.h = (int8_t)accum_h;
        mouse_report.v = (int8_t)accum_v;
        accum_h -= mouse_report.h;
        accum_v -= mouse_report.v;
        mouse_report.x = 0;
        mouse_report.y = 0;
    } else {
        accum_h = 0.0f;
        accum_v = 0.0f;
    }

    return pointing_device_task_user(mouse_report);
}

bool process_record_kb(uint16_t keycode, keyrecord_t *record) {
    switch (keycode) {
        case KG_POINTING_SCROLL:
            scroll_mode = record->event.pressed;
            break;
        case KG_POINTING_SLOW:
            slow_mode = record->event.pressed;
            break;
    }
    return process_record_user(keycode, record);
}

layer_state_t layer_state_set_kb(layer_state_t state) {
    if (get_highest_layer(state) != AUTO_MOUSE_DEFAULT_LAYER) {
        scroll_mode  = false;
        slow_mode    = false;
        accum_h      = 0.0f;
        accum_v      = 0.0f;
        accum_slow_x = 0.0f;
        accum_slow_y = 0.0f;
    }
    return layer_state_set_user(state);
}

#endif // POINTING_DEVICE_ENABLE
