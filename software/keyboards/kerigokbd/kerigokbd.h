// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// Common Definitions for KERIgoKBD

#pragma once

#include <quantum.h>
#include <keymap_japanese.h>

/* Special Keys */
#define KEY_NUM MO(1)
#define KEY_FUN MO(2)
#define KEY_ALT LALT_T(JP_MHEN)
#define KEY_WIN RWIN_T(JP_HENK)
#define K_PSCR LSG(KC_S)
#define K_APSCR A(KC_PSCR)
