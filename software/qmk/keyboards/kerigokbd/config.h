// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// config.h for KERIgoKBD

#pragma once

/* RP2040- and hardware-specific config */
#define RP2040_BOOTLOADER_DOUBLE_TAP_RESET
#define RP2040_BOOTLOADER_DOUBLE_TAP_RESET_TIMEOUT 200U
#define PICO_XOSC_STARTUP_DELAY_MULTIPLIER 64

/* RGB Matrix */
#define RGB_MATRIX_DEFAULT_MODE RGB_MATRIX_CUSTOM_keyfunc // c.f. rgb_matrix_user.inc

/* Split RPC: keyfunc LED category table (master -> slave), c.f. keyfunc.c */
#define SPLIT_TRANSACTION_IDS_KB RPC_ID_KB_KEYFUNC_SYNC

/* Tap-Hold (https://docs.qmk.fm/tap_hold#hold-on-other-key-press) */
#define HOLD_ON_OTHER_KEY_PRESS
