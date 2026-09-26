// Copyright 2026 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// Key Function LED Categories for KERIgoKBD
//
// Each LED is colored by the category of the keycode it would trigger.
// The master builds a per-layer category table from its keymap and sends
// the slave-side part over split RPC, so both halves follow VIA edits.
// The layer walk on rendering uses the synced layer_state on each side.

#pragma once

#include <quantum.h>

/* LED Categories (semantic kinds, not colors) */
enum keyfunc_category {
    KFC_TRANSPARENT = 0, //< fall through to the lower active layer (table only)
    KFC_OFF,             //< KC_NO
    KFC_ALPHA,           //< A-Z
    KFC_NUMBER,          //< 1-0, Keypad 1-0
    KFC_FUNCTION,        //< F1-F12
    KFC_LAYER_NUM,       //< MO/LT(KGL_NUM), KG_TNUM
    KFC_LAYER_FUN,       //< MO/LT(KGL_FUN), KG_TFUN
    KFC_LAYER_ESC,       //< LT(*, KC_ESC)
    KFC_LAYER_EXT,       //< KG_TEXT
    KFC_LAYER_MAIN,      //< KG_MAIN
    KFC_MODIFIER,        //< Modifiers, Mod-Tap, Enter/Esc/BS/Tab/Space/Del
    KFC_EXTRA,           //< Central Extra Keys (KG_EX**)
    KFC_SYMBOL,          //< Symbols
    KFC_ARROW,           //< Arrows
    KFC_ALT_NUM,         //< Alt+1-0
    KFC_MOUSE_MOVE,      //< Mouse Move/Wheel, KG_POINTING_SCROLL
    KFC_MOUSE_BTN1,      //< Mouse Button Left
    KFC_MOUSE_BTN2,      //< Mouse Button Right
    KFC_MOUSE_BTN_OTHER, //< Mouse Button 3/4/5
    KFC_ZOOM,            //< KG_POINTING_ZOOM
    KFC_MEDIA,           //< Audio, PrintScreen
    KFC_BOOTLOADER,      //< QK_BOOT
    KFC_SLEEP,           //< System Sleep
    KFC_RGB,             //< Underglow
    KFC_OTHER,           //< Others
    KFC_COUNT,
};

// Build the category table from the local keymap (call once after keymap is ready).
void keyfunc_init(void);
// Rebuild after keymap edits and send pending blocks to the slave (call from housekeeping).
void keyfunc_task(void);
// Notify that the dynamic keymap was edited (e.g. by VIA).
void keyfunc_keymap_changed(void);

// Incremented whenever the category table changes (render cache invalidation).
uint8_t keyfunc_generation(void);
// Category of the LED under the given layer state (QMK layer resolution).
uint8_t keyfunc_led_category(uint8_t led_index, layer_state_t state);
// Base color (full brightness) of the category.
rgb_t keyfunc_category_color(uint8_t category);
