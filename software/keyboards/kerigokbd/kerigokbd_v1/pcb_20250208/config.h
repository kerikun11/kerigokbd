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

/* Pointing Device (https://docs.qmk.fm/features/pointing_device#common-configuration) */
#define SPLIT_POINTING_ENABLE
#define POINTING_DEVICE_RIGHT
// #define POINTING_DEVICE_GESTURES_SCROLL_ENABLE // circular scroll

/* Auto Mouse Layer */
#define POINTING_DEVICE_AUTO_MOUSE_ENABLE
#define AUTO_MOUSE_DEFAULT_LAYER 4
#define AUTO_MOUSE_TIME 3000

/* Cirque Trackpad (https://docs.qmk.fm/features/pointing_device#cirque-trackpad) */
#define CIRQUE_PINNACLE_DIAMETER_MM 35
#define CIRQUE_PINNACLE_TAP_ENABLE
// #define CIRQUE_PINNACLE_ATTENUATION EXTREG__TRACK_ADCCONFIG__ADC_ATTENUATE_1X //< most sensitive
// #define CIRQUE_PINNACLE_ATTENUATION EXTREG__TRACK_ADCCONFIG__ADC_ATTENUATE_2X
#define CIRQUE_PINNACLE_ATTENUATION EXTREG__TRACK_ADCCONFIG__ADC_ATTENUATE_3X
// #define CIRQUE_PINNACLE_ATTENUATION EXTREG__TRACK_ADCCONFIG__ADC_ATTENUATE_4X //< least sensitive
