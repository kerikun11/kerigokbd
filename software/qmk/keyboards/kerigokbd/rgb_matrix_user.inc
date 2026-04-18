// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

RGB_MATRIX_EFFECT(keyfunc)

#ifdef RGB_MATRIX_CUSTOM_EFFECT_IMPLS

#    include "kerigokbd.h"
#    include <color.h>

enum {
    KFI_OFF,
    KFI_RED,
    KFI_GREEN,
    KFI_BLUE,
    KFI_MAGENTA,
    KFI_YELLOW,
    KFI_CYAN,
    KFI_WHITE,
    KFI_ORANGE,
    KFI_PURPLE,
    KFI_SOFT_RED,
    KFI_COUNT,
};

static const rgb_t keyfunc_base_colors[KFI_COUNT] = {
    [KFI_OFF]      = {0, 0, 0},       //
    [KFI_RED]      = {255, 0, 0},     //
    [KFI_GREEN]    = {0, 255, 0},     //
    [KFI_BLUE]     = {0, 0, 255},     //
    [KFI_MAGENTA]  = {255, 0, 255},   //
    [KFI_YELLOW]   = {255, 255, 0},   //
    [KFI_CYAN]     = {0, 255, 255},   //
    [KFI_WHITE]    = {255, 255, 255}, //
    [KFI_ORANGE]   = {255, 128, 0},   //
    [KFI_PURPLE]   = {129, 0, 255},   //
    [KFI_SOFT_RED] = {255, 50, 50},   //
};

static void keyfunc_prepare_rgb_colors(rgb_t rgb_colors[KFI_COUNT], uint8_t brightness) {
    uint8_t v = hsv_to_rgb((hsv_t){0, 0, brightness}).r; // apply CIE1931 correction (same as solid_color)
    for (uint8_t i = 0; i < KFI_COUNT; i++) {
        rgb_t color   = keyfunc_base_colors[i];
        rgb_colors[i] = (rgb_t){
            ((uint16_t)color.r * v) / UINT8_MAX,
            ((uint16_t)color.g * v) / UINT8_MAX,
            ((uint16_t)color.b * v) / UINT8_MAX,
        };
    }
}

static rgb_t *keyfunc_rgb_colors(void) {
    static rgb_t   rgb_colors[KFI_COUNT];
    static uint8_t cached_brightness;
    static bool    initialized = false;

    const uint8_t brightness = rgb_matrix_config.hsv.v;
    if (!initialized || cached_brightness != brightness) {
        keyfunc_prepare_rgb_colors(rgb_colors, brightness);
        cached_brightness = brightness;
        initialized       = true;
    }
    return rgb_colors;
}

static inline void keyfunc_set_color(uint8_t index, rgb_t color) {
    rgb_matrix_set_color(index, color.r, color.g, color.b);
}

static inline bool is_keycode_special(uint16_t keycode) {
    if (IS_MODIFIER_KEYCODE(keycode)) return true; //< Ctrl, Alt, Shift, Win
    switch (keycode) {
        case KC_ENTER ... KC_SPACE: //< ENT, ESC, BSPC, TAB, SPC
        case KC_DEL:
        case KC_KP_ENTER:
        case KG_L4:
        case KG_LALT:
        case KG_ESC:
        case KG_RWIN:
        case KG_R4:
            return true;
    }
    return false;
}

static inline bool is_keycode_symbol(uint16_t keycode) {
    switch (keycode) {
        case S(KC_1)... S(KC_0):
        case S(KC_MINS)... S(KC_SLSH):
        case KC_COMM ... KC_SLSH:
        case KC_MINS ... KC_QUOT: // exclude JP_ZKHK(KC_GRV)
        case JP_BSLS:
        case JP_UNDS:
        case JP_PIPE:
        case JP_YEN:
        case KC_KP_SLASH ... KC_KP_PLUS:
        case KC_KP_DOT:
        case KC_KP_EQUAL:
            return true;
    }
    return false;
}

static inline rgb_t keyfunc_color_for_keycode(uint16_t keycode, const rgb_t *colors) {
    /* Special */
    if (is_keycode_special(keycode)) return colors[KFI_GREEN];
    /* Symbol */
    if (is_keycode_symbol(keycode)) return colors[KFI_YELLOW];
    /* Mouse (Move/Wheel) */
    if (IS_MOUSEKEY_MOVE(keycode) || IS_MOUSEKEY_WHEEL(keycode)) return colors[KFI_PURPLE];
    /* LED */
    if (IS_UNDERGLOW_KEYCODE(keycode)) return colors[KFI_GREEN];
    switch (keycode) {
        /* Empty */
        case KC_NO:
            return colors[KFI_OFF];
        /* Alphabet */
        case KC_A ... KC_Z:
            return colors[KFI_BLUE];
        /* Number */
        case KC_1 ... KC_0:
        case KG_NUM:
        case KG_TNUM:
            return colors[KFI_MAGENTA];
        /* Function */
        case KC_F1 ... KC_F12:
        case KG_FUN:
        case KG_TFUN:
            return colors[KFI_CYAN];
        /* Arrow */
        case KC_RIGHT ... KC_UP:
            return colors[KFI_ORANGE];
        /* Numpad */
        case KC_P1 ... KC_P0:
            return colors[KFI_MAGENTA];
        /* Bootloader */
        case QK_BOOTLOADER:
            return colors[KFI_RED];
        /* Mouse (Button Left) */
        case MS_BTN1:
            return colors[KFI_BLUE];
        /* Mouse (Button Right) */
        case MS_BTN2:
            return colors[KFI_SOFT_RED];
        /* Mouse (Button 3/4/5) */
        case MS_BTN3 ... MS_BTN5:
            return colors[KFI_ORANGE];
        /* Audio */
        case KC_MUTE ... KC_VOLD:
            return colors[KFI_BLUE];
        /* PrintScreen */
        case KC_PSCR:
        case A(KC_PSCR):
            return colors[KFI_BLUE];
        /* Alt+Num */
        case A(KC_1)... A(KC_0):
            return colors[KFI_GREEN];
        /* KG */
        case KG_POINTING_SCROLL:
            return colors[KFI_CYAN];
        /* To Numpad Layer */
        case KG_TESC:
            return colors[KFI_ORANGE];
        /* To Main Layer */
        case KG_MAIN:
            return colors[KFI_BLUE];
        /* Other */
        default:
            return colors[KFI_WHITE];
    }
}

static bool keyfunc(effect_params_t *params) {
    static rgb_t    led_colors[RGB_MATRIX_LED_COUNT];
    static uint32_t cached_layer_state = UINT32_MAX;
    static uint8_t  cached_brightness  = UINT8_MAX;

    const uint32_t cur_layer_state = layer_state;
    const uint8_t  cur_brightness  = rgb_matrix_config.hsv.v;

    if (params->init || cur_layer_state != cached_layer_state || cur_brightness != cached_brightness) {
        const rgb_t *rgb_colors = keyfunc_rgb_colors();
        const int8_t top_layer  = get_highest_layer(cur_layer_state);
        for (uint8_t row = 0; row < MATRIX_ROWS; row++) {
            for (uint8_t col = 0; col < MATRIX_COLS; col++) {
                uint8_t index = g_led_config.matrix_co[row][col];
                if (index == NO_LED) continue;
                int8_t   layer   = top_layer;
                uint16_t keycode = KC_TRNS;
                for (; layer >= 0 && keycode == KC_TRNS; layer--)
                    keycode = keymap_key_to_keycode(layer, (keypos_t){col, row});
                led_colors[index] = keyfunc_color_for_keycode(keycode, rgb_colors);
            }
        }
        cached_layer_state = cur_layer_state;
        cached_brightness  = cur_brightness;
    }

    for (uint8_t i = 0; i < RGB_MATRIX_LED_COUNT; i++)
        keyfunc_set_color(i, led_colors[i]);
    return false;
}

#endif // RGB_MATRIX_CUSTOM_EFFECT_IMPLS
