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
    KGL_ESC,  // 3: Tenkey and Left Hand Device
    KGL_TEMP, // 4: Tentative Layer
    KGL_CONF, // 5: Config Layer
    KGL_AM,   // 6: Auto Mouse Layer (PointingDevice only)
};

/* Thumb Keys */
#define KG_L4 LWIN_T(JP_HENK)
#define KG_LALT LALT_T(JP_MHEN)
#define KG_NUM MO(KGL_NUM)
#define KG_ESC LT(KGL_ESC, KC_ESC)

#define KG_SPC KC_SPC
#define KG_FUN MO(KGL_FUN)
#define KG_RWIN RWIN_T(JP_HENK)
#define KG_R4 KC_RCTL

/* Central Extra Keys */
#define KG_EXTL LT(KGL_TEMP, KC_PGUP) //< Central Extra Key (Top Left)
#define KG_EXBL LT(KGL_CONF, KC_PGDN) //< Central Extra Key (Bottom Left)
#define KG_EXTR RWIN_T(KC_HOME)       //< Central Extra Key (Top Right)
#define KG_EXBR LT(KGL_CONF, KC_END)  //< Central Extra Key (Bottom Right)

/* Aliases */
#define KG_MAIN TO(KGL_MAIN) // TO_MAIN
#define KG_TNUM TO(KGL_NUM)  // TO_NUM
#define KG_TFUN TO(KGL_FUN)  // TO_FUN
#define KG_TESC TO(KGL_ESC)  // TO_ESC
#define KG_APRS A(KC_PSCR)

/* Custom Keycodes */
enum kerigokbd_keycodes {
    // full name
    KG_POINTING_SCROLL = QK_KB_1,

    // aliases
    KG_SCRL = KG_POINTING_SCROLL,
};
