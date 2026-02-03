// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// Common Definitions for KERIgoKBD

#pragma once

#include <quantum.h>
#include <keymap_japanese.h>

/* Special Keys */
#define KG_MAIN TO(0)
#define KG_NUM MO(1)
#define KG_FUN MO(2)
#define KG_ESC LT(3, KC_ESC)
#define KG_TNUM TO(1) // TO_NUM
#define KG_TFUN TO(2) // TO_FUN
#define KG_TESC TO(3) // TO_ESC
#define KG_LALT LALT_T(JP_MHEN)
#define KG_RWIN RWIN_T(JP_HENK)
#define KG_LWIN LWIN_T(KC_PSCR)
#define KG_RALT RALT_T(KC_APP)
#define KG_EXTL LT(6, KC_HOME) //< Central Extra Key (Top Left)
#define KG_EXTR LT(6, KC_PGUP) //< Central Extra Key (Top Right)
#define KG_EXBL KC_END         //< Central Extra Key (Bottom Left)
#define KG_EXBR KC_PGDN        //< Central Extra Key (Bottom Right)
#define KG_APRS A(KC_PSCR)

/* Custom Keycodes */
enum kerigokbd_keycodes {
    // full name
    KG_POINTING_SLOW   = QK_KB_0,
    KG_POINTING_SCROLL = QK_KB_1,

    // aliases
    KG_SLOW = KG_POINTING_SLOW,
    KG_SCRL = KG_POINTING_SCROLL,
};
