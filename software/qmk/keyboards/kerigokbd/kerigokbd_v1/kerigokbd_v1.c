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

// Pointer: scale = POINTER_SCALE_MIN + POINTER_ACCEL * sqrt(smooth_speed)
#    define POINTER_SCALE_MIN 0.1f  //< 低速時の感度倍率
#    define POINTER_ACCEL 0.3f      //< 加速係数
#    define SPEED_SMOOTH_ALPHA 0.1f //< EMA平滑化係数 (0〜1: 小さいほど滑らか)

// Scroll: step += raw * scroll_scale / SCROLL_DIVISOR
#    define SCROLL_DIVISOR 32.0f //< スクロール感度 (大きいほど遅い)
#    define SCROLL_ACCEL 0.05f   //< スクロール加速係数

static bool  scroll_mode  = false;
static float move_accum_x = 0, move_accum_y = 0;
static float scroll_accum_x = 0, scroll_accum_y = 0;
static float smooth_speed = 0.0f;

// 整数キャストで truncf を回避 (Cortex-M0+ はFPUなし、ライブラリ呼び出し削減)
static inline int8_t accum_(float *a, float v) {
    *a += v;
    int16_t out = (int16_t)*a; // truncate toward zero (C standard)
    if (out > 127)
        out = 127;
    else if (out < -127)
        out = -127;
    *a -= (float)out;
    return (int8_t)out;
}

report_mouse_t pointing_device_task_kb(report_mouse_t r) {
    if (scroll_mode) {
        float raw_speed    = (float)(abs(r.x) + abs(r.y));
        float scroll_scale = 1.0f + SCROLL_ACCEL * raw_speed;
        r.h                = accum_(&scroll_accum_x, -(float)r.x * scroll_scale / SCROLL_DIVISOR);
        r.v                = accum_(&scroll_accum_y, (float)r.y * scroll_scale / SCROLL_DIVISOR);
        r.x = r.y    = 0;
        move_accum_x = move_accum_y = smooth_speed = 0.0f;
    } else {
        float raw_speed = (float)(abs(r.x) + abs(r.y));
        smooth_speed += SPEED_SMOOTH_ALPHA * (raw_speed - smooth_speed); // 乗算1回
        float scale    = POINTER_SCALE_MIN + POINTER_ACCEL * sqrtf(smooth_speed);
        r.x            = accum_(&move_accum_x, (float)r.x * scale);
        r.y            = accum_(&move_accum_y, (float)r.y * scale);
        scroll_accum_x = scroll_accum_y = 0.0f;
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
        smooth_speed                    = 0.0f;
    }
    return layer_state_set_user(state);
}

#endif // POINTING_DEVICE_ENABLE
