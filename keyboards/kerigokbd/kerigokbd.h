#pragma once

#include <quantum.h>
#include <keymap_japanese.h>
#include <color.h>

/* Special Keys */
#define KEY_NUM MO(1)
#define KEY_FUN MO(2)
#define KEY_ALT LALT_T(JP_MHEN)
#define KEY_WIN RWIN_T(JP_HENK)

bool rgb_matrix_user_keyfunc(void);
