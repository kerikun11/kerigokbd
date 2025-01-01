/*
 * Copyright 2021 Quentin LEBASTARD <qlebastard@gmail.com>
 * Copyright 2021 Charly Delay <charly@codesink.dev> (@0xcharly)
 * Copyright 2023 Yu INOUE (@yinouet)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


#pragma once

// clang-format off
// #if defined(KEYBOARD_keyballrp_39)
// #    include "39.h"
// #elif defined(KEYBOARD_keyballrp_44)
// #    include "44.h"
// #elif defined(KEYBOARD_keyballrp_61)
// #    include "61.h"
// #else
// #    error "Unsuported format"
// #endif
// // clang-format on

#include "quantum.h"

#ifdef POINTING_DEVICE_ENABLE
#    ifndef NO_KEYBALL_KEYCODES
enum keyball_keycodes {
    POINTER_DEFAULT_DPI_FORWARD = QK_KB_0,
    POINTER_DEFAULT_DPI_REVERSE,
    POINTER_SNIPING_DPI_FORWARD,
    POINTER_SNIPING_DPI_REVERSE,
    SNIPING_MODE,
    SNIPING_MODE_TOGGLE,
    DRAGSCROLL_MODE,
    DRAGSCROLL_MODE_TOGGLE,
};

#        define DPI_MOD POINTER_DEFAULT_DPI_FORWARD
#        define DPI_RMOD POINTER_DEFAULT_DPI_REVERSE
#        define S_D_MOD POINTER_SNIPING_DPI_FORWARD
#        define S_D_RMOD POINTER_SNIPING_DPI_REVERSE
#        define SNIPING SNIPING_MODE
#        define SNP_TOG SNIPING_MODE_TOGGLE
#        define DRGSCRL DRAGSCROLL_MODE
#        define DRG_TOG DRAGSCROLL_MODE_TOGGLE
#    endif // !NO_KEYBALL_KEYCODES

/** \brief Return the current DPI value for the pointer's default mode. */
uint16_t keyball_get_pointer_default_dpi(void);

/**
 * \brief Update the pointer's default DPI to the next or previous step.
 *
 * Increases the DPI value if `forward` is `true`, decreases it otherwise.
 * The increment/decrement steps are equal to KEYBALL_DEFAULT_DPI_CONFIG_STEP.
 *
 * The new value is persisted in EEPROM.
 */
void keyball_cycle_pointer_default_dpi(bool forward);

/**
 * \brief Same as `keyball_cycle_pointer_default_dpi`, but do not write to
 * EEPROM.
 *
 * This means that reseting the board will revert the value to the last
 * persisted one.
 */
void keyball_cycle_pointer_default_dpi_noeeprom(bool forward);

/** \brief Return the current DPI value for the pointer's sniper-mode. */
uint16_t keyball_get_pointer_sniping_dpi(void);

/**
 * \brief Update the pointer's sniper-mode DPI to the next or previous step.
 *
 * Increases the DPI value if `forward` is `true`, decreases it otherwise.
 * The increment/decrement steps are equal to KEYBALL_SNIPING_DPI_CONFIG_STEP.
 *
 * The new value is persisted in EEPROM.
 */
void keyball_cycle_pointer_sniping_dpi(bool forward);

/**
 * \brief Same as `keyball_cycle_pointer_sniping_dpi`, but do not write to
 * EEPROM.
 *
 * This means that reseting the board will revert the value to the last
 * persisted one.
 */
void keyball_cycle_pointer_sniping_dpi_noeeprom(bool forward);

/** \brief Whether sniper-mode is enabled. */
bool keyball_get_pointer_sniping_enabled(void);

/**
 * \brief Enable/disable sniper mode.
 *
 * When sniper mode is enabled the dpi is reduced to slow down the pointer for
 * more accurate movements.
 */
void keyball_set_pointer_sniping_enabled(bool enable);

/** \brief Whether drag-scroll is enabled. */
bool keyball_get_pointer_dragscroll_enabled(void);

/**
 * \brief Enable/disable drag-scroll mode.
 *
 * When drag-scroll mode is enabled, horizontal and vertical pointer movements
 * are translated into horizontal and vertical scroll movements.
 */
void keyball_set_pointer_dragscroll_enabled(bool enable);
#endif // POINTING_DEVICE_ENABLE



#undef RP_SPI_USE_SPI0
#define RP_SPI_USE_SPI0 TRUE

// RESET
#define RP2040_BOOTLOADER_DOUBLE_TAP_RESET
#define RP2040_BOOTLOADER_DOUBLE_TAP_RESET_LED GP17
#define RP2040_BOOTLOADER_DOUBLE_TAP_RESET_TIMEOUT 1000U

// clang-format off

#define LAYOUT_right_ball( \
    L00, L01, L02, L03, L04, L05,    R05, R04, R03, R02, R01, R00, \
    L10, L11, L12, L13, L14, L15,    R15, R14, R13, R12, R11, R10, \
    L20, L21, L22, L23, L24, L25,    R25, R24, R23, R22, R21, R20, \
         L31, L32, L33, L34, L35,    R35, R34,           R31       \
    ) \
    { \
        {   L00,   L01,   L02,   L03,   L04,   L05 }, \
        {   L10,   L11,   L12,   L13,   L14,   L15 }, \
        {   L20,   L21,   L22,   L23,   L24,   L25 }, \
        { KC_NO,   L31,   L32,   L33,   L34,   L35 }, \
        {   R00,   R01,   R02,   R03,   R04,   R05 }, \
        {   R10,   R11,   R12,   R13,   R14,   R15 }, \
        {   R20,   R21,   R22,   R23,   R24,   R25 }, \
        { KC_NO,   R31, KC_NO, KC_NO,   R34,   R35 }, \
    }

#define LAYOUT_left_ball( \
    L00, L01, L02, L03, L04, L05,    R05, R04, R03, R02, R01, R00, \
    L10, L11, L12, L13, L14, L15,    R15, R14, R13, R12, R11, R10, \
    L20, L21, L22, L23, L24, L25,    R25, R24, R23, R22, R21, R20, \
         L31,           L34, L35,    R35, R34, R33, R32, R31       \
    ) \
    { \
        {   L00,   L01,   L02,   L03,   L04,   L05 }, \
        {   L10,   L11,   L12,   L13,   L14,   L15 }, \
        {   L20,   L21,   L22,   L23,   L24,   L25 }, \
        { KC_NO,   L31, KC_NO, KC_NO,   L34,   L35 }, \
        {   R00,   R01,   R02,   R03,   R04,   R05 }, \
        {   R10,   R11,   R12,   R13,   R14,   R15 }, \
        {   R20,   R21,   R22,   R23,   R24,   R25 }, \
        { KC_NO,   R31,   R32,   R33,   R34,   R35 }, \
    }

#define LAYOUT_dual_ball( \
    L00, L01, L02, L03, L04, L05,    R05, R04, R03, R02, R01, R00, \
    L10, L11, L12, L13, L14, L15,    R15, R14, R13, R12, R11, R10, \
    L20, L21, L22, L23, L24, L25,    R25, R24, R23, R22, R21, R20, \
         L31,           L34, L35,    R35, R34,           R31       \
    ) \
    { \
        {   L00,   L01,   L02,   L03,   L04,   L05 }, \
        {   L10,   L11,   L12,   L13,   L14,   L15 }, \
        {   L20,   L21,   L22,   L23,   L24,   L25 }, \
        { KC_NO,   L31, KC_NO, KC_NO,   L34,   L35 }, \
        {   R00,   R01,   R02,   R03,   R04,   R05 }, \
        {   R10,   R11,   R12,   R13,   R14,   R15 }, \
        {   R20,   R21,   R22,   R23,   R24,   R25 }, \
        { KC_NO,   R31, KC_NO, KC_NO,   R34,   R35 }, \
    }

#define LAYOUT_no_ball( \
    L00, L01, L02, L03, L04, L05,    R05, R04, R03, R02, R01, R00, \
    L10, L11, L12, L13, L14, L15,    R15, R14, R13, R12, R11, R10, \
    L20, L21, L22, L23, L24, L25,    R25, R24, R23, R22, R21, R20, \
         L31, L32, L33, L34, L35,    R35, R34, R33, R32, R31       \
    ) \
    { \
        {   L00,   L01,   L02,   L03,   L04,   L05 }, \
        {   L10,   L11,   L12,   L13,   L14,   L15 }, \
        {   L20,   L21,   L22,   L23,   L24,   L25 }, \
        { KC_NO,   L31,   L32,   L33,   L34,   L35 }, \
        {   R00,   R01,   R02,   R03,   R04,   R05 }, \
        {   R10,   R11,   R12,   R13,   R14,   R15 }, \
        {   R20,   R21,   R22,   R23,   R24,   R25 }, \
        { KC_NO,   R31,   R32,   R33,   R34,   R35 }, \
    }

// clang-format on

#define LAYOUT LAYOUT_right_ball
#define LAYOUT_universal LAYOUT_no_ball
