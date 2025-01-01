// Copyright 2023 yinouet (@yinouet)
// SPDX-License-Identifier: GPL-2.0-or-later

#pragma once

/*
 * Feature disable options
 *  These options are also useful to firmware size reduction.
 */

/* disable debug print */
//#define NO_DEBUG

/* disable print */
//#define NO_PRINT

/* disable action features */
//#define NO_ACTION_LAYER
//#define NO_ACTION_TAPPING
//#define NO_ACTION_ONESHOT

/* Key matrix configuration. 
#define MATRIX_ROW_PINS \
    { GP29, GP28, GP27, GP26 }
#define MATRIX_COL_PINS \
    { GP4, GP5, GP6, GP7, GP8, GP9 }
*/

/* SPI & PMW3360 settings. */
#define SPI_DRIVER SPID0
#define SPI_SCK_PIN GP22
#define SPI_MISO_PIN GP20
#define SPI_MOSI_PIN GP23
#define POINTING_DEVICE_CS_PIN GP21

#define POINTING_DEVICE_INVERT_X
#define POINTING_DEVICE_ROTATION_90

/* Split parameters */
// #define SOFT_SERIAL_PIN    GP1    
#define SPLIT_HAND_MATRIX_GRID  GP27, GP9
#define SPLIT_USB_DETECT
#define SPLIT_USB_TIMEOUT       2500
