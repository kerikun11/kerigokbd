// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// config.h for Keyball RP2040

#pragma once

/* SPI */
#define SPI_DRIVER SPID0
#define SPI_SCK_PIN GP22
#define SPI_MISO_PIN GP20
#define SPI_MOSI_PIN GP23

/* Pointing Device */
#define POINTING_DEVICE_CS_PIN GP21
#define POINTING_DEVICE_RIGHT
#define POINTING_DEVICE_INVERT_X
#define POINTING_DEVICE_ROTATION_90

#define POINTING_DEVICE_AUTO_MOUSE_ENABLE
#define AUTO_MOUSE_DEFAULT_LAYER 4
#define AUTO_MOUSE_TIME 1000

/* Split */
#define SPLIT_HAND_MATRIX_GRID_LOW_IS_LEFT
#define SPLIT_POINTING_ENABLE
