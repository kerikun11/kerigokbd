// SPDX-License-Identifier: GPL-2.0-or-later
// Copyright 2025 KERI's Lab
// config.h for KERIgoKBD

#pragma once

/* RP2040- and hardware-specific config */
#define RP2040_BOOTLOADER_DOUBLE_TAP_RESET
#define RP2040_BOOTLOADER_DOUBLE_TAP_RESET_TIMEOUT 500U
#define PICO_XOSC_STARTUP_DELAY_MULTIPLIER 64

/* RGB Matrix */
#define RGB_MATRIX_DEFAULT_MODE RGB_MATRIX_CUSTOM_keyfunc // c.f. rgb_matrix_user.inc
