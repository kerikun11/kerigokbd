// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// keymap.c for Keyball44 default (via)

#include QMK_KEYBOARD_H
#include <keycodes.h>

// clang-format off
const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
  [0] = LAYOUT(
    KC_BTN1,
    KC_BTN2,
    QK_KB_4,
    QK_KB_6,
    QK_BOOT
  ),
};
// clang-format on
