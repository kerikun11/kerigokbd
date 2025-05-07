// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// Common Definitions for KERIgoKBD

#pragma once

#include <quantum.h>
#include <keymap_japanese.h>

/* Special Keys */
#define KG_NUM MO(1)
#define KG_FUN MO(2)
#define KG_ALT LALT_T(JP_MHEN)
#define KG_WIN RWIN_T(JP_HENK)
#define KG_EXUL MO(5)      //< Extra Upper Left Key
#define KG_EXUR MO(5)      //< Extra Upper Right Key
#define KG_EXBL KC_PSCR    //< Extra Bottom Left Key
#define KG_EXBR A(KC_PSCR) //< Extra Bottom Right Key

/* Custom Keycodes */
enum kerigokbd_keycodes {
    // full name
    KG_POINTING_SLOW   = QK_KB_0,
    KG_POINTING_SCROLL = QK_KB_1,
    // aliases
    KG_SLOW = KG_POINTING_SLOW,
    KG_SCRL = KG_POINTING_SCROLL,
};
