/**
 * Copyright 2022 Charly Delay <charly@codesink.dev> (@0xcharly)
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

#include "quantum.h"

#ifdef POINTING_DEVICE_ENABLE
#    ifndef NO_TRACKPAD_KEYCODES
enum trackpad_keycodes {
    POINTER_DEFAULT_DPI_FORWARD = QK_KB_0,
    POINTER_DEFAULT_DPI_REVERSE = QK_KB_1,
    POINTER_SNIPING_DPI_FORWARD = QK_KB_2,
    POINTER_SNIPING_DPI_REVERSE = QK_KB_3,
    SNIPING_MODE                = QK_KB_4,
    SNIPING_MODE_TOGGLE         = QK_KB_5,
    DRAGSCROLL_MODE             = QK_KB_6,
    DRAGSCROLL_MODE_TOGGLE      = QK_KB_7,
};

#        define DPI_FW POINTER_DEFAULT_DPI_FORWARD
#        define DPI_RV POINTER_DEFAULT_DPI_REVERSE
#        define SN_FW POINTER_SNIPING_DPI_FORWARD
#        define SN_RV POINTER_SNIPING_DPI_REVERSE
#        define SNIPING SNIPING_MODE
#        define SNP_TOG SNIPING_MODE_TOGGLE
#        define DRGSCRL DRAGSCROLL_MODE
#        define DRG_TOG DRAGSCROLL_MODE_TOGGLE
#    endif // !NO_TRACKPAD_KEYCODES

/** \brief Return the current DPI value for the pointer's default mode. */
uint16_t trackpad_get_pointer_default_dpi(void);

/**
 * \brief Update the pointer's default DPI to the next or previous step.
 *
 * Increases the DPI value if `forward` is `true`, decreases it otherwise.
 * The increment/decrement steps are equal to TRACKPAD_DEFAULT_DPI_CONFIG_STEP.
 *
 * The new value is persisted in EEPROM.
 */
void trackpad_cycle_pointer_default_dpi(bool forward);

/**
 * \brief Same as `trackpad_cycle_pointer_default_dpi`, but do not write to
 * EEPROM.
 *
 * This means that reseting the board will revert the value to the last
 * persisted one.
 */
void trackpad_cycle_pointer_default_dpi_noeeprom(bool forward);

/** \brief Return the current DPI value for the pointer's sniper-mode. */
uint16_t trackpad_get_pointer_sniping_dpi(void);

/**
 * \brief Update the pointer's sniper-mode DPI to the next or previous step.
 *
 * Increases the DPI value if `forward` is `true`, decreases it otherwise.
 * The increment/decrement steps are equal to TRACKPAD_SNIPING_DPI_CONFIG_STEP.
 *
 * The new value is persisted in EEPROM.
 */
void trackpad_cycle_pointer_sniping_dpi(bool forward);

/**
 * \brief Same as `trackpad_cycle_pointer_sniping_dpi`, but do not write to
 * EEPROM.
 *
 * This means that reseting the board will revert the value to the last
 * persisted one.
 */
void trackpad_cycle_pointer_sniping_dpi_noeeprom(bool forward);

/** \brief Whether sniper-mode is enabled. */
bool trackpad_get_pointer_sniping_enabled(void);

/**
 * \brief Enable/disable sniper mode.
 *
 * When sniper mode is enabled the dpi is reduced to slow down the pointer for
 * more accurate movements.
 */
void trackpad_set_pointer_sniping_enabled(bool enable);

/** \brief Whether drag-scroll is enabled. */
bool trackpad_get_pointer_dragscroll_enabled(void);

/**
 * \brief Enable/disable drag-scroll mode.
 *
 * When drag-scroll mode is enabled, horizontal and vertical pointer movements
 * are translated into horizontal and vertical scroll movements.
 */
void trackpad_set_pointer_dragscroll_enabled(bool enable);
#endif // POINTING_DEVICE_ENABLE
