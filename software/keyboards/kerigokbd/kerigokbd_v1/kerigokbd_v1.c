// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

#include QMK_KEYBOARD_H

void keyboard_pre_init_user(void) {
    setPinInputHigh(SPLIT_HAND_PIN);
}
