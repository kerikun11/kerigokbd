// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

#include QMK_KEYBOARD_H
#include <math.h>

void keyboard_pre_init_kb(void) {
    setPinInputHigh(SPLIT_HAND_PIN);
    keyboard_pre_init_user();
}

#ifdef POINTING_DEVICE_ENABLE

#    ifdef POINTING_DEVICE_AUTO_MOUSE_ENABLE
_Static_assert(AUTO_MOUSE_DEFAULT_LAYER == KGL_AM, "AUTO_MOUSE_DEFAULT_LAYER must match KGL_AM");
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

// Pointer: scale = POINTER_SCALE_MIN + POINTER_ACCEL * sqrt(speed)
#    define POINTER_SCALE_MIN 0.28f //< 低速時の感度倍率
#    define POINTER_ACCEL 0.22f     //< 加速係数

// Scroll (linear): step += raw / SCROLL_DIVISOR
#    define SCROLL_DIVISOR 32.0f //< スクロール感度 (大きいほど遅い)

static bool  scroll_mode  = false;
static float move_accum_x = 0, move_accum_y = 0;
static float scroll_accum_x = 0, scroll_accum_y = 0;

static int8_t accum_(float *a, float v) {
    *a += v;
    float out = truncf(*a);
    if (out > 127.0f) out = 127.0f;
    if (out < -127.0f) out = -127.0f;
    *a -= out;
    return (int8_t)out;
}

report_mouse_t pointing_device_task_kb(report_mouse_t r) {
    if (scroll_mode) {
        r.h          = accum_(&scroll_accum_x, (float)r.x / SCROLL_DIVISOR);
        r.v          = accum_(&scroll_accum_y, (float)r.y / SCROLL_DIVISOR);
        r.x          = 0;
        r.y          = 0;
        move_accum_x = move_accum_y = 0;
    } else {
        float speed    = (float)(abs(r.x) + abs(r.y));
        float scale    = POINTER_SCALE_MIN + POINTER_ACCEL * sqrtf(speed);
        r.x            = accum_(&move_accum_x, (float)r.x * scale);
        r.y            = accum_(&move_accum_y, (float)r.y * scale);
        scroll_accum_x = scroll_accum_y = 0;
    }
    return pointing_device_task_user(r);
}

bool process_record_kb(uint16_t keycode, keyrecord_t *record) {
    if (keycode == KG_POINTING_SCROLL) {
        scroll_mode = record->event.pressed;
        if (!scroll_mode) scroll_accum_x = scroll_accum_y = 0;
    }
    return process_record_user(keycode, record);
}

layer_state_t layer_state_set_kb(layer_state_t state) {
    if (get_highest_layer(state) != AUTO_MOUSE_DEFAULT_LAYER) {
        scroll_mode  = false;
        move_accum_x = move_accum_y = 0;
        scroll_accum_x = scroll_accum_y = 0;
    }
    return layer_state_set_user(state);
}

#endif // POINTING_DEVICE_ENABLE
