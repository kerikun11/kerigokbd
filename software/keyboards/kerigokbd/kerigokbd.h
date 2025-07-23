// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// Common Definitions for KERIgoKBD

#pragma once

#include <quantum.h>
#include <keymap_japanese.h>

/* Special Keys */
#define KG_NUM MO(1)
#define KG_FUN MO(2)
#define KG_ESC LT(3, KC_ESC)
#define KG_ALT LALT_T(JP_MHEN)
#define KG_WIN RWIN_T(JP_HENK)
#define KG_EXTL MO(5)      //< Central Extra Key (Top Left)
#define KG_EXTR MO(5)      //< Central Extra Key (Top Right)
#define KG_EXBL KC_PSCR    //< Central Extra Key (Bottom Left)
#define KG_EXBR A(KC_PSCR) //< Central Extra Key (Bottom Right)

/* Custom Keycodes */
enum kerigokbd_keycodes {
    // full name
    KG_POINTING_SLOW   = QK_KB_0,
    KG_POINTING_SCROLL = QK_KB_1,

    // aliases
    KG_SLOW = KG_POINTING_SLOW,
    KG_SCRL = KG_POINTING_SCROLL,
};
