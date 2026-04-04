// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// config.h for KERIgoKBD v1

#pragma once

/* USB */
#undef USB_VBUS_PIN
#define USB_VBUS_PIN GP26

/* I2C */
#undef I2C_DRIVER
#undef I2C1_SDA_PIN
#undef I2C1_SCL_PIN
// #define I2C_DRIVER I2CD1 // see https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf#page=13
// #define I2C1_SDA_PIN GP28
// #define I2C1_SCL_PIN GP29
