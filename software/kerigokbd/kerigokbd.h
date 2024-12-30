#pragma once

#include <quantum.h>
#include <keymap_japanese.h>
#include <color.h>

/* Special Keys */
#define KEY_NUM MO(1)
#define KEY_FUN MO(2)
#define KEY_ALT LALT_T(JP_MHEN)
#define KEY_WIN RWIN_T(JP_HENK)

/* LED Color defintions */
#define LED_VALUE 192
#define COLOR_RED LED_VALUE * 2 / 3, 0, 0
#define COLOR_GREEN 0, LED_VALUE * 2 / 3, 0
#define COLOR_BLUE 0, 0, LED_VALUE * 2 / 3
#define COLOR_MAGENTA LED_VALUE * 2 / 3, 0, LED_VALUE * 2 / 3
#define COLOR_YELLOW LED_VALUE, LED_VALUE * 2 / 3, 0
#define COLOR_CYAN 0, LED_VALUE * 2 / 3, LED_VALUE * 2 / 3
#define COLOR_WHITE LED_VALUE * 2 / 3, LED_VALUE * 2 / 3, LED_VALUE * 2 / 3
#define COLOR_ORANGE LED_VALUE, LED_VALUE / 4, 0
#define COLOR_PURPLE RGB_PURPLE

/* RGB Matrix */
#define RGB_MATRIX_CUSTOM_EFFECT_IMPLS
#ifdef RGB_MATRIX_CUSTOM_EFFECT_IMPLS
bool rgb_matrix_user_keyfunc(void);
#endif // RGB_MATRIX_CUSTOM_EFFECT_IMPLS
