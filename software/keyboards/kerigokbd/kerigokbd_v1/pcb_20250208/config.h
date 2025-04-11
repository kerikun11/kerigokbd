// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// config.h for KERIgoKBD v1

#pragma once

/* USB */
#define USB_VBUS_PIN GP28

/* I2C */
#define I2C_DRIVER I2CD1 // see https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf#page=13
#define I2C1_SDA_PIN GP26
#define I2C1_SCL_PIN GP27
