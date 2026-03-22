// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

#include QMK_KEYBOARD_H
#include <math.h>

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
#    endif

#    define SCROLL_DIVISOR 16.0f

#    define POINTER_ACCEL 0.22f
#    define SCROLL_ACCEL 0.10f
#    define POINTER_SCALE_MIN 0.28f
#    define POINTER_SCALE_MAX 2.20f
#    define SCROLL_SCALE_MIN 0.40f
#    define SCROLL_SCALE_MAX 1.60f

typedef struct {
    float x;
    float y;
} axis_accum_t;

static bool scroll_mode = false;

static axis_accum_t move_accum         = {0};
static axis_accum_t scroll_speed_accum = {0};
static axis_accum_t scroll_step_accum  = {0};

static void clear_axis_accum(axis_accum_t *a) {
    a->x = 0.0f;
    a->y = 0.0f;
}

static int16_t abs16_(int16_t v) {
    return (v < 0) ? -v : v;
}

static float clampf_(float v, float lo, float hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
}

static float calc_speed_(int16_t x, int16_t y) {
    return (float)(abs16_(x) + abs16_(y));
}

static float calc_accel_scale_(int16_t x, int16_t y, float accel, float scale_min, float scale_max) {
    float speed = calc_speed_(x, y);
    float scale = scale_min + accel * sqrtf(speed);
    return clampf_(scale, scale_min, scale_max);
}

static int8_t accum_scale_(float *accum, int16_t value, float scale) {
    *accum += (float)value * scale;

    float out_f = truncf(*accum);
    if (out_f > 127.0f) out_f = 127.0f;
    if (out_f < -127.0f) out_f = -127.0f;

    int8_t out = (int8_t)out_f;
    *accum -= out_f;
    return out;
}

static int8_t accum_div_(float *accum, int16_t value, float divisor) {
    *accum += (float)value / divisor;

    float out_f = truncf(*accum);
    if (out_f > 127.0f) out_f = 127.0f;
    if (out_f < -127.0f) out_f = -127.0f;

    int8_t out = (int8_t)out_f;
    *accum -= out_f;
    return out;
}

static void apply_pointer_accel_(report_mouse_t *report) {
    float scale = calc_accel_scale_(report->x, report->y, POINTER_ACCEL, POINTER_SCALE_MIN, POINTER_SCALE_MAX);

    report->x = accum_scale_(&move_accum.x, report->x, scale);
    report->y = accum_scale_(&move_accum.y, report->y, scale);
}

static void apply_scroll_mode_(report_mouse_t *report) {
    float scale = calc_accel_scale_(report->x, report->y, SCROLL_ACCEL, SCROLL_SCALE_MIN, SCROLL_SCALE_MAX);

    int8_t sx = accum_scale_(&scroll_speed_accum.x, report->x, scale);
    int8_t sy = accum_scale_(&scroll_speed_accum.y, report->y, scale);

    report->h = -accum_div_(&scroll_step_accum.x, sx, SCROLL_DIVISOR);
    report->v = -accum_div_(&scroll_step_accum.y, sy, SCROLL_DIVISOR);

    report->x = 0;
    report->y = 0;
}

report_mouse_t pointing_device_task_kb(report_mouse_t mouse_report) {
    apply_pointer_accel_(&mouse_report);

    if (scroll_mode) {
        apply_scroll_mode_(&mouse_report);
    } else {
        clear_axis_accum(&scroll_speed_accum);
        clear_axis_accum(&scroll_step_accum);
    }

    return pointing_device_task_user(mouse_report);
}

bool process_record_kb(uint16_t keycode, keyrecord_t *record) {
    switch (keycode) {
        case KG_POINTING_SCROLL:
            scroll_mode = record->event.pressed;

            if (!scroll_mode) {
                clear_axis_accum(&scroll_speed_accum);
                clear_axis_accum(&scroll_step_accum);
            }
            break;
    }

    return process_record_user(keycode, record);
}

layer_state_t layer_state_set_kb(layer_state_t state) {
    if (get_highest_layer(state) != AUTO_MOUSE_DEFAULT_LAYER) {
        scroll_mode = false;

        clear_axis_accum(&move_accum);
        clear_axis_accum(&scroll_speed_accum);
        clear_axis_accum(&scroll_step_accum);
    }

    return layer_state_set_user(state);
}

#endif
