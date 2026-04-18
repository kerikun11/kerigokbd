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

// Trackpad tap gestures:
// - タップ成立: TRACKPAD_TAP_TERM以内、TRACKPAD_TAP_MOVE以内で離す。
// - release補完: タッチ中の最後の有効データからTRACKPAD_RELEASE_TERMで離した扱い。
// - タップ/ダブル/トリプル: 各タップ成立時にBTN1クリックを1回送る。
// - BTN1クリック列: 押下/解除/次クリックまでの各間隔はTRACKPAD_CLICK_TERM。
// - ダブルタップホールド: 直前タップからTRACKPAD_TAP_TERM以内の次タッチを
//   TRACKPAD_TAP_MOVE超えまたはTRACKPAD_TAP_TERM以上保持でBTN1ドラッグ。
// - 直前タップなしのホールド/移動はBTN1なしのカーソル移動。
// - タップ/複数タップ/ドラッグ候補中はカーソル移動を止める。
// - 左USB時のみTRACKPAD_TOUCH_MARKERでAutoMouseLayer保持をsplit同期する。
// - スクロールモード: x/yをh/vへ変換し、BTN1と判定中のタップ/クリック/ドラッグ状態を破棄する。
//   AutoMouseLayer保持は継続し、スクロール解除時にscroll_accumをリセットする。
#    define TRACKPAD_TAP_TERM 200
#    define TRACKPAD_CLICK_TERM 20
#    define TRACKPAD_TAP_MOVE 48
#    define TRACKPAD_RELEASE_TERM 30
#    define TRACKPAD_TOUCH_MARKER MOUSE_REPORT_HV_MIN

typedef struct {
    bool     down;
    bool     was_down;
    bool     moved;
    bool     button_down;
    bool     click;
    bool     click_gap;
    bool     tap_drag_pending;
    bool     auto_mouse_active;
    uint8_t  tap_count;
    uint8_t  clicks_pending;
    uint16_t timer;
    uint16_t last_tap_timer;
    uint16_t click_timer;
    uint16_t data_timer;
    uint16_t start_x;
    uint16_t start_y;
    uint16_t x;
    uint16_t y;
} trackpad_state_t;

static bool             scroll_mode  = false;
static float            move_accum_x = 0, move_accum_y = 0;
static float            scroll_accum_x = 0, scroll_accum_y = 0;
static float            smooth_speed                      = 0.0f;
static bool             trackpad_auto_mouse_report_active = false;
static trackpad_state_t trackpad                          = {0};

static inline void set_trackpad_auto_mouse_(bool active) {
#    ifdef POINTING_DEVICE_AUTO_MOUSE_ENABLE
    if (trackpad.auto_mouse_active != active && is_keyboard_master()) {
        auto_mouse_keyevent(active);
    }
#    endif
    trackpad.auto_mouse_active = active;
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

static void update_trackpad_taps_(void);
static bool trackpad_pointer_frozen_(void);
static void freeze_pointer_(report_mouse_t *r);
static void apply_trackpad_buttons_(report_mouse_t *r);
static void mark_trackpad_auto_mouse_(report_mouse_t *r);
static report_mouse_t finish_trackpad_report_(report_mouse_t r);
static void update_auto_mouse_from_trackpad_report_(report_mouse_t *r);

#    if defined(POINTING_DEVICE_DRIVER_custom) && defined(POINTING_DEVICE_DRIVER_cirque_pinnacle_i2c)
bool pointing_device_driver_init(void) {
    return cirque_pinnacle_init();
}

report_mouse_t pointing_device_driver_get_report(report_mouse_t mouse_report) {
    static uint16_t x = 0, y = 0, last_scale = 0;
    uint16_t        scale     = cirque_pinnacle_get_scale();
    pinnacle_data_t touchData = cirque_pinnacle_read_data();

    if (!touchData.valid) {
        if (trackpad.down && timer_elapsed(trackpad.data_timer) >= TRACKPAD_RELEASE_TERM) {
            trackpad.down = false;
        }
        return finish_trackpad_report_(mouse_report);
    }

    trackpad.data_timer = timer_read();
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

    return finish_trackpad_report_(mouse_report);
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

static inline bool trackpad_tap_term_expired_(uint16_t timer) {
    return timer_elapsed(timer) > TRACKPAD_TAP_TERM;
}

static inline void clear_trackpad_taps_(void) {
    trackpad.tap_count        = 0;
    trackpad.tap_drag_pending = false;
}

static inline void cancel_trackpad_clicks_(void) {
    clear_trackpad_taps_();
    trackpad.button_down    = false;
    trackpad.click          = false;
    trackpad.click_gap      = false;
    trackpad.clicks_pending = 0;
}

static inline bool trackpad_tap_window_active_(void) {
    return trackpad.tap_count && !trackpad_tap_term_expired_(trackpad.last_tap_timer);
}

static inline bool trackpad_click_idle_(void) {
    return !trackpad.click && !trackpad.click_gap && !trackpad.clicks_pending;
}

static inline void start_trackpad_clicks_(uint8_t count) {
    if (!count) return;
    if (!trackpad_click_idle_()) {
        trackpad.clicks_pending += count;
        return;
    }
    trackpad.click          = true;
    trackpad.clicks_pending = count - 1;
    trackpad.click_timer    = timer_read();
}

static inline void update_trackpad_auto_mouse_(void) {
    set_trackpad_auto_mouse_(trackpad.down || trackpad.tap_drag_pending || trackpad.button_down || !trackpad_click_idle_());
}

static inline void update_trackpad_clicks_(void) {
    if (trackpad.click && timer_elapsed(trackpad.click_timer) >= TRACKPAD_CLICK_TERM) {
        trackpad.click       = false;
        trackpad.click_timer = timer_read();
        if (trackpad.clicks_pending) {
            trackpad.click_gap = true;
        }
    } else if (trackpad.click_gap && timer_elapsed(trackpad.click_timer) >= TRACKPAD_CLICK_TERM) {
        trackpad.click_gap = false;
        trackpad.click     = true;
        trackpad.clicks_pending--;
        trackpad.click_timer = timer_read();
    }
}

static inline void register_trackpad_tap_(void) {
    if (trackpad_tap_window_active_()) {
        trackpad.tap_count++;
    } else {
        trackpad.tap_count = 1;
    }
    trackpad.last_tap_timer = timer_read();

    start_trackpad_clicks_(1);
    if (trackpad.tap_count >= 3) {
        trackpad.tap_count = 0;
    }
}

static inline bool trackpad_pointer_frozen_(void) {
    if (!trackpad.down || trackpad.button_down || trackpad.moved) return false;
    return trackpad.tap_drag_pending || trackpad_tap_window_active_() || !trackpad_tap_term_expired_(trackpad.timer);
}

static void update_trackpad_taps_(void) {
    bool pressed  = trackpad.down && !trackpad.was_down;
    bool released = trackpad.was_down && !trackpad.down;

    if (trackpad.tap_count && trackpad_tap_term_expired_(trackpad.last_tap_timer) && !trackpad.down) {
        trackpad.tap_count = 0;
    }

    if (pressed) {
        bool multi_tap = trackpad_tap_window_active_();
        bool tap_drag  = multi_tap;

        trackpad.timer            = timer_read();
        trackpad.start_x          = trackpad.x;
        trackpad.start_y          = trackpad.y;
        trackpad.moved            = false;
        trackpad.button_down      = false;
        trackpad.tap_drag_pending = tap_drag;
        if (!multi_tap) {
            clear_trackpad_taps_();
        }
    }

    if (trackpad.down && trackpad_tap_moved_()) {
        trackpad.moved = true;
    }

    if (trackpad.tap_drag_pending && trackpad.down && (trackpad.moved || timer_elapsed(trackpad.timer) >= TRACKPAD_TAP_TERM)) {
        trackpad.button_down = true;
        clear_trackpad_taps_();
    }

    if (released) {
        if (trackpad.tap_drag_pending) {
            register_trackpad_tap_();
            trackpad.tap_drag_pending = false;
        } else if (trackpad.button_down) {
            clear_trackpad_taps_();
        } else if (!trackpad.moved && !trackpad_tap_term_expired_(trackpad.timer)) {
            register_trackpad_tap_();
        } else {
            clear_trackpad_taps_();
        }
        trackpad.button_down = false;
    }

    update_trackpad_auto_mouse_();
}

static void freeze_pointer_(report_mouse_t *r) {
    r->x = r->y  = 0;
    move_accum_x = move_accum_y = smooth_speed = 0.0f;
}

static void apply_trackpad_buttons_(report_mouse_t *r) {
    r->buttons &= ~MOUSE_BTN1;
    if (trackpad.button_down || trackpad.click) {
        r->buttons |= MOUSE_BTN1;
    }
    update_trackpad_clicks_();
    update_trackpad_auto_mouse_();
}

static void mark_trackpad_auto_mouse_(report_mouse_t *r) {
    // Keep a stable marker while active. Split pointing only fetches the full report
    // when the checksum changes, so this costs one payload transfer on and one off.
    if (trackpad.auto_mouse_active && !is_keyboard_master()) {
        r->h = TRACKPAD_TOUCH_MARKER;
    }
}

static report_mouse_t finish_trackpad_report_(report_mouse_t r) {
    update_trackpad_taps_();
    if (trackpad_pointer_frozen_()) {
        freeze_pointer_(&r);
    }
    apply_trackpad_buttons_(&r);
    mark_trackpad_auto_mouse_(&r);
    trackpad.was_down = trackpad.down;
    return r;
}

static void apply_scroll_(report_mouse_t *r) {
    float raw_speed    = (float)(abs(r->x) + abs(r->y));
    float scroll_scale = 1.0f + SCROLL_ACCEL * raw_speed;
    r->h               = accum_(&scroll_accum_x, -(float)r->x * scroll_scale / SCROLL_DIVISOR);
    r->v               = accum_(&scroll_accum_y, (float)r->y * scroll_scale / SCROLL_DIVISOR);
    r->x = r->y  = 0;
    move_accum_x = move_accum_y = smooth_speed = 0.0f;
}

static void apply_pointer_(report_mouse_t *r) {
    float raw_speed = (float)(abs(r->x) + abs(r->y));
    smooth_speed += SPEED_SMOOTH_ALPHA * (raw_speed - smooth_speed);
    float scale    = POINTER_SCALE_MIN + POINTER_ACCEL * sqrtf(smooth_speed);
    r->x           = accum_(&move_accum_x, (float)r->x * scale);
    r->y           = accum_(&move_accum_y, (float)r->y * scale);
    scroll_accum_x = scroll_accum_y = 0.0f;
}

report_mouse_t pointing_device_task_kb(report_mouse_t r) {
    update_auto_mouse_from_trackpad_report_(&r);

    if (scroll_mode) {
        apply_scroll_(&r);
        r.buttons &= ~MOUSE_BTN1;
        cancel_trackpad_clicks_();
        update_trackpad_auto_mouse_();
    } else {
        apply_pointer_(&r);
    }

    return pointing_device_task_user(r);
}

static void update_auto_mouse_from_trackpad_report_(report_mouse_t *r) {
    bool active = r->h == TRACKPAD_TOUCH_MARKER;
    if (active) r->h = 0;

#    ifdef POINTING_DEVICE_AUTO_MOUSE_ENABLE
    if (trackpad_auto_mouse_report_active == active) return;
    auto_mouse_keyevent(active);
#    endif
    trackpad_auto_mouse_report_active = active;
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
        report_mouse_t r                = {0};
        update_auto_mouse_from_trackpad_report_(&r);
        reset_trackpad_taps_();
    }
    return layer_state_set_user(state);
}

#endif // POINTING_DEVICE_ENABLE
