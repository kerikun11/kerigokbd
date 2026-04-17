// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

#include QMK_KEYBOARD_H
#include <math.h>

#ifdef POINTING_DEVICE_DRIVER_cirque_pinnacle_i2c
#    include "drivers/sensors/cirque_pinnacle.h"
#endif

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

// Trackpad tap gestures
#    define TRACKPAD_TAP_TERM 200
#    define TRACKPAD_MULTI_TAP_TERM 350
#    define TRACKPAD_CLICK_TERM 20
#    define TRACKPAD_TAP_MOVE 48

typedef struct {
    bool     down;
    bool     was_down;
    bool     moved;
    bool     button_down;
    bool     click;
    bool     auto_mouse_active;
    uint8_t  tap_count;
    uint16_t timer;
    uint16_t last_tap_timer;
    uint16_t click_timer;
    uint16_t start_x;
    uint16_t start_y;
    uint16_t x;
    uint16_t y;
} trackpad_state_t;

static bool             scroll_mode    = false;
static float            move_accum_x   = 0, move_accum_y = 0;
static float            scroll_accum_x = 0, scroll_accum_y = 0;
static float            smooth_speed   = 0.0f;
static trackpad_state_t trackpad       = {0};

static inline void set_trackpad_auto_mouse_(bool active) {
#    ifdef POINTING_DEVICE_AUTO_MOUSE_ENABLE
    if (trackpad.auto_mouse_active == active) return;
    auto_mouse_keyevent(active);
    trackpad.auto_mouse_active = active;
#    endif
}

static inline void reset_trackpad_taps_(void) {
    set_trackpad_auto_mouse_(false);
    trackpad = (trackpad_state_t){0};
}

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

#    if defined(POINTING_DEVICE_DRIVER_custom) && defined(POINTING_DEVICE_DRIVER_cirque_pinnacle_i2c)
bool pointing_device_driver_init(void) {
    return cirque_pinnacle_init();
}

report_mouse_t pointing_device_driver_get_report(report_mouse_t mouse_report) {
    static uint16_t x = 0, y = 0, last_scale = 0;
    uint16_t        scale     = cirque_pinnacle_get_scale();
    pinnacle_data_t touchData = cirque_pinnacle_read_data();

    if (!touchData.valid) {
        return mouse_report;
    }

    trackpad.down = touchData.touchDown;
    if (touchData.touchDown) {
        trackpad.x = touchData.xValue;
        trackpad.y = touchData.yValue;
    }

    cirque_pinnacle_scale_data(&touchData, scale, scale);
    mouse_report.x = 0;
    mouse_report.y = 0;

    if (last_scale && scale == last_scale && x && y && touchData.xValue && touchData.yValue) {
        mouse_report.x = CONSTRAIN_HID_XY((int16_t)(touchData.xValue - x));
        mouse_report.y = CONSTRAIN_HID_XY((int16_t)(touchData.yValue - y));
    }

    x          = touchData.xValue;
    y          = touchData.yValue;
    last_scale = scale;

    return mouse_report;
}

uint16_t pointing_device_driver_get_cpi(void) {
    return cirque_pinnacle_get_cpi();
}

void pointing_device_driver_set_cpi(uint16_t cpi) {
    cirque_pinnacle_set_cpi(cpi);
}
#    endif

static inline bool trackpad_tap_moved_(void) {
    return abs((int16_t)(trackpad.x - trackpad.start_x)) + abs((int16_t)(trackpad.y - trackpad.start_y)) > TRACKPAD_TAP_MOVE;
}

static void update_trackpad_taps_(void) {
    bool pressed  = trackpad.down && !trackpad.was_down;
    bool released = trackpad.was_down && !trackpad.down;

    if (trackpad.tap_count && timer_elapsed(trackpad.last_tap_timer) > TRACKPAD_MULTI_TAP_TERM && !trackpad.down) {
        trackpad.tap_count = 0;
    }

    if (pressed) {
        set_trackpad_auto_mouse_(true);
        trackpad.timer       = timer_read();
        trackpad.start_x     = trackpad.x;
        trackpad.start_y     = trackpad.y;
        trackpad.moved       = false;
        trackpad.button_down = trackpad.tap_count && timer_elapsed(trackpad.last_tap_timer) <= TRACKPAD_MULTI_TAP_TERM;
    }

    if (trackpad.down && trackpad_tap_moved_()) {
        trackpad.moved = true;
    }

    if (released) {
        set_trackpad_auto_mouse_(false);
        if (!trackpad.moved && timer_elapsed(trackpad.timer) <= TRACKPAD_TAP_TERM) {
            if (trackpad.button_down) {
                trackpad.tap_count++;
            } else {
                trackpad.tap_count   = 1;
                trackpad.click       = true;
                trackpad.click_timer = timer_read();
            }
            if (trackpad.tap_count > 3) trackpad.tap_count = 1;
            trackpad.last_tap_timer = timer_read();
        } else {
            trackpad.tap_count = 0;
        }
        trackpad.button_down = false;
    }
}

static void apply_trackpad_buttons_(report_mouse_t *r) {
    r->buttons &= ~MOUSE_BTN1;
    if (trackpad.button_down || trackpad.click) {
        r->buttons |= MOUSE_BTN1;
    }
    if (trackpad.click && timer_elapsed(trackpad.click_timer) >= TRACKPAD_CLICK_TERM) {
        trackpad.click = false;
    }
}

static void apply_scroll_(report_mouse_t *r) {
    float raw_speed    = (float)(abs(r->x) + abs(r->y));
    float scroll_scale = 1.0f + SCROLL_ACCEL * raw_speed;
    r->h               = accum_(&scroll_accum_x, -(float)r->x * scroll_scale / SCROLL_DIVISOR);
    r->v               = accum_(&scroll_accum_y, (float)r->y * scroll_scale / SCROLL_DIVISOR);
    r->x = r->y = 0;
    move_accum_x = move_accum_y = smooth_speed = 0.0f;
}

static void apply_pointer_(report_mouse_t *r) {
    float raw_speed = (float)(abs(r->x) + abs(r->y));
    smooth_speed += SPEED_SMOOTH_ALPHA * (raw_speed - smooth_speed);
    float scale = POINTER_SCALE_MIN + POINTER_ACCEL * sqrtf(smooth_speed);
    r->x        = accum_(&move_accum_x, (float)r->x * scale);
    r->y        = accum_(&move_accum_y, (float)r->y * scale);
    scroll_accum_x = scroll_accum_y = 0.0f;
}

report_mouse_t pointing_device_task_kb(report_mouse_t r) {
    if (scroll_mode) {
        apply_scroll_(&r);
        reset_trackpad_taps_();
    } else {
        apply_pointer_(&r);
        update_trackpad_taps_();
        apply_trackpad_buttons_(&r);
    }
    trackpad.was_down = trackpad.down;

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
        reset_trackpad_taps_();
    }
    return layer_state_set_user(state);
}

#endif // POINTING_DEVICE_ENABLE
