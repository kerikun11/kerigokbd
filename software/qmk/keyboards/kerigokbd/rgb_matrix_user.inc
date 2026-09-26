// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

RGB_MATRIX_EFFECT(keyfunc)

#ifdef RGB_MATRIX_CUSTOM_EFFECT_IMPLS

#    include "keyfunc.h"
#    include <color.h>

static void keyfunc_prepare_rgb_colors(rgb_t rgb_colors[KFC_COUNT], uint8_t brightness) {
    uint8_t v = hsv_to_rgb((hsv_t){0, 0, brightness}).r; // apply CIE1931 correction (same as solid_color)
    for (uint8_t i = 0; i < KFC_COUNT; i++) {
        rgb_t color   = keyfunc_category_color(i);
        rgb_colors[i] = (rgb_t){
            ((uint16_t)color.r * v) / UINT8_MAX,
            ((uint16_t)color.g * v) / UINT8_MAX,
            ((uint16_t)color.b * v) / UINT8_MAX,
        };
    }
}

static inline void keyfunc_set_color(uint8_t index, rgb_t color) {
    rgb_matrix_set_color(index, color.r, color.g, color.b);
}

static bool keyfunc(effect_params_t *params) {
    RGB_MATRIX_USE_LIMITS(led_min, led_max);

    static rgb_t         rgb_colors[KFC_COUNT];
    static rgb_t         led_colors[RGB_MATRIX_LED_COUNT];
    static layer_state_t cached_layer_state;
    static uint8_t       cached_brightness;
    static uint8_t       cached_generation;

    const layer_state_t cur_layer_state = layer_state | default_layer_state;
    const uint8_t       cur_brightness  = rgb_matrix_config.hsv.v;
    const uint8_t       cur_generation  = keyfunc_generation();

    if (params->init || cur_brightness != cached_brightness) {
        keyfunc_prepare_rgb_colors(rgb_colors, cur_brightness);
    }
    if (params->init || cur_layer_state != cached_layer_state || cur_brightness != cached_brightness || cur_generation != cached_generation) {
        for (uint8_t i = 0; i < RGB_MATRIX_LED_COUNT; i++)
            led_colors[i] = rgb_colors[keyfunc_led_category(i, cur_layer_state)];
        cached_layer_state = cur_layer_state;
        cached_brightness  = cur_brightness;
        cached_generation  = cur_generation;
    }

    for (uint8_t i = led_min; i < led_max; i++)
        keyfunc_set_color(i, led_colors[i]);
    return rgb_matrix_check_finished_leds(led_max);
}

#endif // RGB_MATRIX_CUSTOM_EFFECT_IMPLS
