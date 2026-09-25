// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// Common Definitions for KERIgoKBD

#pragma once

#include <quantum.h>
#include <keymap_japanese.h>

/* Layer Numbers */
enum kerigokbd_layers {
    KGL_MAIN, // 0: Default Layer
    KGL_NUM,  // 1: Numbers and Symbols Layer
    KGL_FUN,  // 2: Functions and Navigation Layer
    KGL_EXT,  // 3: Extra Layer
    KGL_RES,  // 4: Reserved Layer
    KGL_CONF, // 5: Config Layer
    KGL_AM,   // 6: Auto Mouse Layer (PointingDevice only)
};

/* Thumb Keys */
#define KG_LWIN KC_LWIN
#define KG_LALT KC_LALT
#define KG_NUM LT(KGL_NUM, JP_MHEN)
#define KG_ESC LT(KGL_EXT, KC_ESC)

#define KG_SPC LSFT_T(KC_SPC)
#define KG_FUN LT(KGL_FUN, JP_HENK)
#define KG_RWIN KC_RWIN
#define KG_RALT KC_RALT

/* Central Extra Keys */
#define KG_EXTL LT(KGL_RES, KC_PGUP)  //< Central Extra Key (Top Left)
#define KG_EXBL LT(KGL_CONF, KC_PGDN) //< Central Extra Key (Bottom Left)
#define KG_EXTR RWIN_T(KC_HOME)       //< Central Extra Key (Top Right)
#define KG_EXBR LT(KGL_CONF, KC_END)  //< Central Extra Key (Bottom Right)

/* Aliases */
#define KG_MAIN TO(KGL_MAIN) // TO_MAIN
#define KG_TNUM TO(KGL_NUM)  // TO_NUM
#define KG_TFUN TO(KGL_FUN)  // TO_FUN
#define KG_TEXT TO(KGL_EXT)  // TO_EXT
#define KG_APRS A(KC_PSCR)

/* Custom Keycodes */
enum kerigokbd_keycodes {
    // Pointing Device Keycodes
    KG_POINTING_SCROLL = QK_KB_1,
    KG_POINTING_ZOOM   = QK_KB_2,
    // Mouse keycodes that do not enter AutoMouseLayer.
    KG_MOUSE_LEFT        = QK_KB_3,
    KG_MOUSE_DOWN        = QK_KB_4,
    KG_MOUSE_UP          = QK_KB_5,
    KG_MOUSE_RIGHT       = QK_KB_6,
    KG_MOUSE_WHEEL_LEFT  = QK_KB_7,
    KG_MOUSE_WHEEL_DOWN  = QK_KB_8,
    KG_MOUSE_WHEEL_UP    = QK_KB_9,
    KG_MOUSE_WHEEL_RIGHT = QK_KB_10,

    // aliases
    KG_SCRL = KG_POINTING_SCROLL,
    KG_ZOOM = KG_POINTING_ZOOM,
    KG_MSL  = KG_MOUSE_LEFT,
    KG_MSD  = KG_MOUSE_DOWN,
    KG_MSU  = KG_MOUSE_UP,
    KG_MSR  = KG_MOUSE_RIGHT,
    KG_MWLL = KG_MOUSE_WHEEL_LEFT,
    KG_MWLD = KG_MOUSE_WHEEL_DOWN,
    KG_MWLU = KG_MOUSE_WHEEL_UP,
    KG_MWLR = KG_MOUSE_WHEEL_RIGHT,
};
