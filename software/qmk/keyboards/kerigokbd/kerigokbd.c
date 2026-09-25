// Copyright 2026 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

#include "kerigokbd.h"
#include "keymap_introspection.h"
#ifdef ENCODER_MAP_ENABLE
#    include "encoder.h"
#endif
#ifdef DIP_SWITCH_MAP_ENABLE
#    include "dip_switch.h"
#endif

// Only input processing uses these Mod-Taps. EEPROM/VIA retain the public
// custom keycodes, which also distinguish them from ordinary Win/Delete
// and Alt/Tab assignments.
typedef struct {
    uint16_t keycode;
    uint16_t mod_tap;
    uint16_t tap;
} custom_mod_tap_t;

static const custom_mod_tap_t custom_mod_taps[] = {
    {KG_LWIN_T_LCTL_LALT_DEL, LGUI_T(KC_DEL), LCA(KC_DEL)},
    {KG_LALT_T_LALT_TAB, LALT_T(KC_TAB), LALT(KC_TAB)},
};

static const custom_mod_tap_t *custom_mod_tap_for_keycode(uint16_t keycode) {
    for (uint8_t i = 0; i < ARRAY_SIZE(custom_mod_taps); i++) {
        if (custom_mod_taps[i].keycode == keycode) {
            return &custom_mod_taps[i];
        }
    }
    return NULL;
}

uint16_t keymap_key_to_keycode(uint8_t layer, keypos_t key) {
    if (key.row < MATRIX_ROWS && key.col < MATRIX_COLS) {
        uint16_t keycode = keycode_at_keymap_location(layer, key.row, key.col);
        const custom_mod_tap_t *custom = custom_mod_tap_for_keycode(keycode);
        return custom ? custom->mod_tap : keycode;
    }
#ifdef ENCODER_MAP_ENABLE
    if (key.row == KEYLOC_ENCODER_CW && key.col < NUM_ENCODERS) {
        return keycode_at_encodermap_location(layer, key.col, true);
    }
    if (key.row == KEYLOC_ENCODER_CCW && key.col < NUM_ENCODERS) {
        return keycode_at_encodermap_location(layer, key.col, false);
    }
#endif
#ifdef DIP_SWITCH_MAP_ENABLE
    if (key.row == KEYLOC_DIP_SWITCH_ON && key.col < NUM_DIP_SWITCHES) {
        return keycode_at_dip_switch_map_location(layer, key.col, true);
    }
    if (key.row == KEYLOC_DIP_SWITCH_OFF && key.col < NUM_DIP_SWITCHES) {
        return keycode_at_dip_switch_map_location(layer, key.col, false);
    }
#endif
    return KC_NO;
}

static const custom_mod_tap_t *custom_mod_tap_for_record(uint16_t keycode, keyrecord_t *record) {
    keypos_t key = record->event.key;
    if (!IS_QK_MOD_TAP(keycode) || key.row >= MATRIX_ROWS || key.col >= MATRIX_COLS) {
        return NULL;
    }
    // Use the press's source layer, including on release after a layer change.
    uint8_t layer = read_source_layers_cache(key);
    const custom_mod_tap_t *custom = custom_mod_tap_for_keycode(keycode_at_keymap_location(layer, key.row, key.col));
    return custom && custom->mod_tap == keycode ? custom : NULL;
}

__attribute__((weak)) bool process_record_kerigokbd(uint16_t keycode, keyrecord_t *record) {
    return true;
}

bool process_record_kb(uint16_t keycode, keyrecord_t *record) {
    const custom_mod_tap_t *custom = custom_mod_tap_for_record(keycode, record);
    if (custom) {
        if (!process_record_user(custom->keycode, record)) {
            return false;
        }
        if (record->tap.count) {
            if (record->event.pressed) {
                tap_code16(custom->tap);
            }
            return false; // Suppress both press and release of the internal tap key.
        }
        return true; // Standard QMK Mod-Tap handles modifier press/release.
    }
    return process_record_kerigokbd(keycode, record) && process_record_user(keycode, record);
}
