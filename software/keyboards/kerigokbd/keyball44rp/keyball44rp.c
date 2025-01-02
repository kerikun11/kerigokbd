/*
 * Copyright 2020 Christopher Courtney <drashna@live.com> (@drashna)
 * Copyright 2021 Quentin LEBASTARD <qlebastard@gmail.com>
 * Copyright 2021 Charly Delay <charly@codesink.dev> (@0xcharly)
 * Copyright 2023 Yu INOUE (@yinouet)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Publicw License as published by
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

#include "keyball44rp.h"
#include "transactions.h"

#include <string.h>

#ifdef CONSOLE_ENABLE
#    include "print.h"
#endif // CONSOLE_ENABLE

#ifdef POINTING_DEVICE_ENABLE
#    ifndef KEYBALL_MINIMUM_DEFAULT_DPI
#        define KEYBALL_MINIMUM_DEFAULT_DPI 400
#    endif // KEYBALL_MINIMUM_DEFAULT_DPI

#    ifndef KEYBALL_DEFAULT_DPI_CONFIG_STEP
#        define KEYBALL_DEFAULT_DPI_CONFIG_STEP 200
#    endif // KEYBALL_DEFAULT_DPI_CONFIG_STEP

#    ifndef KEYBALL_MINIMUM_SNIPING_DPI
#        define KEYBALL_MINIMUM_SNIPING_DPI 200
#    endif // KEYBALL_MINIMUM_SNIPER_MODE_DPI

#    ifndef KEYBALL_SNIPING_DPI_CONFIG_STEP
#        define KEYBALL_SNIPING_DPI_CONFIG_STEP 100
#    endif // KEYBALL_SNIPING_DPI_CONFIG_STEP

// Fixed DPI for drag-scroll.
#    ifndef KEYBALL_DRAGSCROLL_DPI
#        define KEYBALL_DRAGSCROLL_DPI 100
#    endif // KEYBALL_DRAGSCROLL_DPI

#    ifndef KEYBALL_DRAGSCROLL_BUFFER_SIZE
#        define KEYBALL_DRAGSCROLL_BUFFER_SIZE 6
#    endif // !KEYBALL_DRAGSCROLL_BUFFER_SIZE

typedef union {
    uint8_t raw;
    struct {
        uint8_t pointer_default_dpi : 4; // 16 steps available.
        uint8_t pointer_sniping_dpi : 2; // 4 steps available.
        bool    is_dragscroll_enabled : 1;
        bool    is_sniping_enabled : 1;
    } __attribute__((packed));
} keyball_config_t;

static keyball_config_t g_keyball_config = {0};

/**
 * \brief Set the value of `config` from EEPROM.
 *
 * Note that `is_dragscroll_enabled` and `is_sniping_enabled` are purposefully
 * ignored since we do not want to persist this state to memory.  In practice,
 * this state is always written to maximize write-performances.  Therefore, we
 * explicitly set them to `false` in this function.
 */
static void read_keyball_config_from_eeprom(keyball_config_t* config) {
    config->raw                   = eeconfig_read_kb() & 0xff;
    config->is_dragscroll_enabled = false;
    config->is_sniping_enabled    = false;
}

/**
 * \brief Save the value of `config` to eeprom.
 *
 * Note that all values are written verbatim, including whether drag-scroll
 * and/or sniper mode are enabled.  `read_keyball_config_from_eeprom(…)`
 * resets these 2 values to `false` since it does not make sense to persist
 * these across reboots of the board.
 */
static void write_keyball_config_to_eeprom(keyball_config_t* config) {
    eeconfig_update_kb(config->raw);
}

/** \brief Return the current value of the pointer's default DPI. */
static uint16_t get_pointer_default_dpi(keyball_config_t* config) {
    return (uint16_t)config->pointer_default_dpi * KEYBALL_DEFAULT_DPI_CONFIG_STEP + KEYBALL_MINIMUM_DEFAULT_DPI;
}

/** \brief Return the current value of the pointer's sniper-mode DPI. */
static uint16_t get_pointer_sniping_dpi(keyball_config_t* config) {
    return (uint16_t)config->pointer_sniping_dpi * KEYBALL_SNIPING_DPI_CONFIG_STEP + KEYBALL_MINIMUM_SNIPING_DPI;
}

/** \brief Set the appropriate DPI for the input config. */
static void maybe_update_pointing_device_cpi(keyball_config_t* config) {
    if (config->is_dragscroll_enabled) {
        pointing_device_set_cpi(KEYBALL_DRAGSCROLL_DPI);
    } else if (config->is_sniping_enabled) {
        pointing_device_set_cpi(get_pointer_sniping_dpi(config));
    } else {
        pointing_device_set_cpi(get_pointer_default_dpi(config));
    }
}

/**
 * \brief Update the pointer's default DPI to the next or previous step.
 *
 * Increases the DPI value if `forward` is `true`, decreases it otherwise.
 * The increment/decrement steps are equal to KEYBALL_DEFAULT_DPI_CONFIG_STEP.
 */
static void step_pointer_default_dpi(keyball_config_t* config, bool forward) {
    config->pointer_default_dpi += forward ? 1 : -1;
    maybe_update_pointing_device_cpi(config);
}

/**
 * \brief Update the pointer's sniper-mode DPI to the next or previous step.
 *
 * Increases the DPI value if `forward` is `true`, decreases it otherwise.
 * The increment/decrement steps are equal to KEYBALL_SNIPING_DPI_CONFIG_STEP.
 */
static void step_pointer_sniping_dpi(keyball_config_t* config, bool forward) {
    config->pointer_sniping_dpi += forward ? 1 : -1;
    maybe_update_pointing_device_cpi(config);
}

uint16_t keyball_get_pointer_default_dpi(void) {
    return get_pointer_default_dpi(&g_keyball_config);
}

uint16_t keyball_get_pointer_sniping_dpi(void) {
    return get_pointer_sniping_dpi(&g_keyball_config);
}

void keyball_cycle_pointer_default_dpi_noeeprom(bool forward) {
    step_pointer_default_dpi(&g_keyball_config, forward);
}

void keyball_cycle_pointer_default_dpi(bool forward) {
    step_pointer_default_dpi(&g_keyball_config, forward);
    write_keyball_config_to_eeprom(&g_keyball_config);
}

void keyball_cycle_pointer_sniping_dpi_noeeprom(bool forward) {
    step_pointer_sniping_dpi(&g_keyball_config, forward);
}

void keyball_cycle_pointer_sniping_dpi(bool forward) {
    step_pointer_sniping_dpi(&g_keyball_config, forward);
    write_keyball_config_to_eeprom(&g_keyball_config);
}

bool keyball_get_pointer_sniping_enabled(void) {
    return g_keyball_config.is_sniping_enabled;
}

void keyball_set_pointer_sniping_enabled(bool enable) {
    g_keyball_config.is_sniping_enabled = enable;
    maybe_update_pointing_device_cpi(&g_keyball_config);
}

bool keyball_get_pointer_dragscroll_enabled(void) {
    return g_keyball_config.is_dragscroll_enabled;
}

void keyball_set_pointer_dragscroll_enabled(bool enable) {
    g_keyball_config.is_dragscroll_enabled = enable;
    maybe_update_pointing_device_cpi(&g_keyball_config);
}

/**
 * \brief Augment the pointing device behavior.
 *
 * Implement drag-scroll.
 */
static void pointing_device_task_keyball(report_mouse_t* mouse_report) {
    static int16_t scroll_buffer_x = 0;
    static int16_t scroll_buffer_y = 0;
    if (g_keyball_config.is_dragscroll_enabled) {
#    ifdef KEYBALL_DRAGSCROLL_REVERSE_X
        scroll_buffer_x -= mouse_report->x;
#    else
        scroll_buffer_x += mouse_report->x;
#    endif // KEYBALL_DRAGSCROLL_REVERSE_X
#    ifdef KEYBALL_DRAGSCROLL_REVERSE_Y
        scroll_buffer_y -= mouse_report->y;
#    else
        scroll_buffer_y += mouse_report->y;
#    endif // KEYBALL_DRAGSCROLL_REVERSE_Y
        mouse_report->x = 0;
        mouse_report->y = 0;
        if (abs(scroll_buffer_x) > KEYBALL_DRAGSCROLL_BUFFER_SIZE) {
            mouse_report->h = scroll_buffer_x > 0 ? 1 : -1;
            scroll_buffer_x = 0;
        }
        if (abs(scroll_buffer_y) > KEYBALL_DRAGSCROLL_BUFFER_SIZE) {
            mouse_report->v = scroll_buffer_y > 0 ? 1 : -1;
            scroll_buffer_y = 0;
        }
    }
}

report_mouse_t pointing_device_task_kb(report_mouse_t mouse_report) {
    if (is_keyboard_master()) {
        pointing_device_task_keyball(&mouse_report);
        mouse_report = pointing_device_task_user(mouse_report);
    }
    return mouse_report;
}

#    if defined(POINTING_DEVICE_ENABLE) && !defined(NO_KEYBALL_KEYCODES)
/** \brief Whether SHIFT mod is enabled. */
static bool has_shift_mod(void) {
#        ifdef NO_ACTION_ONESHOT
    return mod_config(get_mods()) & MOD_MASK_SHIFT;
#        else
    return mod_config(get_mods() | get_oneshot_mods()) & MOD_MASK_SHIFT;
#        endif // NO_ACTION_ONESHOT
}
#    endif // POINTING_DEVICE_ENABLE && !NO_KEYBALL_KEYCODES

/**
 * \brief Outputs the Charybdis configuration to console.
 *
 * Prints the in-memory configuration structure to console, for debugging.
 * Includes:
 *   - raw value
 *   - drag-scroll: on/off
 *   - sniping: on/off
 *   - default DPI: internal table index/actual DPI
 *   - sniping DPI: internal table index/actual DPI
 */
static void debug_keyball_config_to_console(keyball_config_t* config) {
#    ifdef CONSOLE_ENABLE
    dprintf("(keyball) process_record_kb: config = {\n"
            "\traw = 0x%X,\n"
            "\t{\n"
            "\t\tis_dragscroll_enabled=%u\n"
            "\t\tis_sniping_enabled=%u\n"
            "\t\tdefault_dpi=0x%X (%u)\n"
            "\t\tsniping_dpi=0x%X (%u)\n"
            "\t}\n"
            "}\n",
            config->raw, config->is_dragscroll_enabled, config->is_sniping_enabled, config->pointer_default_dpi, get_pointer_default_dpi(config), config->pointer_sniping_dpi, get_pointer_sniping_dpi(config));
#    endif // CONSOLE_ENABLE
}

bool process_record_kb(uint16_t keycode, keyrecord_t* record) {
    if (!process_record_user(keycode, record)) {
        debug_keyball_config_to_console(&g_keyball_config);
        return false;
    }
#    ifdef POINTING_DEVICE_ENABLE
#        ifndef NO_KEYBALL_KEYCODES
    switch (keycode) {
        case POINTER_DEFAULT_DPI_FORWARD:
            if (record->event.pressed) {
                // Step backward if shifted, forward otherwise.
                keyball_cycle_pointer_default_dpi(/* forward= */ !has_shift_mod());
            }
            break;
        case POINTER_DEFAULT_DPI_REVERSE:
            if (record->event.pressed) {
                // Step forward if shifted, backward otherwise.
                keyball_cycle_pointer_default_dpi(/* forward= */ has_shift_mod());
            }
            break;
        case POINTER_SNIPING_DPI_FORWARD:
            if (record->event.pressed) {
                // Step backward if shifted, forward otherwise.
                keyball_cycle_pointer_sniping_dpi(/* forward= */ !has_shift_mod());
            }
            break;
        case POINTER_SNIPING_DPI_REVERSE:
            if (record->event.pressed) {
                // Step forward if shifted, backward otherwise.
                keyball_cycle_pointer_sniping_dpi(/* forward= */ has_shift_mod());
            }
            break;
        case SNIPING_MODE:
            keyball_set_pointer_sniping_enabled(record->event.pressed);
            break;
        case SNIPING_MODE_TOGGLE:
            if (record->event.pressed) {
                keyball_set_pointer_sniping_enabled(!keyball_get_pointer_sniping_enabled());
            }
            break;
        case DRAGSCROLL_MODE:
            keyball_set_pointer_dragscroll_enabled(record->event.pressed);
            break;
        case DRAGSCROLL_MODE_TOGGLE:
            if (record->event.pressed) {
                keyball_set_pointer_dragscroll_enabled(!keyball_get_pointer_dragscroll_enabled());
            }
            break;
    }
#        endif // !NO_KEYBALL_KEYCODES
#    endif     // POINTING_DEVICE_ENABLE
    if (IS_QK_KB(keycode) || IS_MOUSEKEY(keycode)) {
        debug_keyball_config_to_console(&g_keyball_config);
    }
    return true;
}

void eeconfig_init_kb(void) {
    g_keyball_config.raw = 0;
    write_keyball_config_to_eeprom(&g_keyball_config);
    maybe_update_pointing_device_cpi(&g_keyball_config);
    eeconfig_init_user();
}

void matrix_init_kb(void) {
    read_keyball_config_from_eeprom(&g_keyball_config);
    matrix_init_user();
}

#    ifdef KEYBALL_CONFIG_SYNC
void keyball_config_sync_handler(uint8_t initiator2target_buffer_size, const void* initiator2target_buffer, uint8_t target2initiator_buffer_size, void* target2initiator_buffer) {
    if (initiator2target_buffer_size == sizeof(g_keyball_config)) {
        memcpy(&g_keyball_config, initiator2target_buffer, sizeof(g_keyball_config));
    }
}
#    endif

void keyboard_post_init_kb(void) {
    maybe_update_pointing_device_cpi(&g_keyball_config);
#    ifdef KEYBALL_CONFIG_SYNC
    transaction_register_rpc(RPC_ID_KB_CONFIG_SYNC, keyball_config_sync_handler);
#    endif
    keyboard_post_init_user();
}

#    ifdef KEYBALL_CONFIG_SYNC
void housekeeping_task_kb(void) {
    if (is_keyboard_master()) {
        // Keep track of the last state, so that we can tell if we need to propagate to slave.
        static keyball_config_t last_keyball_config = {0};
        static uint32_t         last_sync           = 0;
        bool                    needs_sync          = false;

        // Check if the state values are different.
        if (memcmp(&g_keyball_config, &last_keyball_config, sizeof(g_keyball_config))) {
            needs_sync = true;
            memcpy(&last_keyball_config, &g_keyball_config, sizeof(g_keyball_config));
        }
        // Send to slave every 500ms regardless of state change.
        if (timer_elapsed32(last_sync) > 500) {
            needs_sync = true;
        }

        // Perform the sync if requested.
        if (needs_sync) {
            if (transaction_rpc_send(RPC_ID_KB_CONFIG_SYNC, sizeof(g_keyball_config), &g_keyball_config)) {
                last_sync = timer_read32();
            }
        }
    }
    // No need to invoke the user-specific callback, as it's been called
    // already.
}
#    endif // KEYBALL_CONFIG_SYNC
#endif     // POINTING_DEVICE_ENABLE
