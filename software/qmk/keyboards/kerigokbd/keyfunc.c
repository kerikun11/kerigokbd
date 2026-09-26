// Copyright 2026 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later

#include "keyfunc.h"
#include "kerigokbd.h"
#include "keymap_introspection.h"
#include <string.h>
#ifdef SPLIT_KEYBOARD
#    include "split_util.h"
#    include "transactions.h"
#endif

#if defined(SPLIT_KEYBOARD) && defined(RGB_MATRIX_SPLIT)
#    define KEYFUNC_SPLIT_SYNC
#endif

#ifdef DYNAMIC_KEYMAP_LAYER_COUNT
#    define KEYFUNC_MAX_LAYERS DYNAMIC_KEYMAP_LAYER_COUNT
#else
#    define KEYFUNC_MAX_LAYERS 8
#endif

#define KEYFUNC_REBUILD_DELAY_MS 100 //< wait for bulk keymap writes to settle

/* Colors */

#define KF_OFF {0, 0, 0}
#define KF_RED {255, 0, 0}
#define KF_GREEN {0, 255, 0}
#define KF_BLUE {0, 0, 255}
#define KF_MAGENTA {255, 0, 255}
#define KF_YELLOW {255, 255, 0}
#define KF_CYAN {0, 255, 255}
#define KF_WHITE {255, 255, 255}
#define KF_ORANGE {255, 128, 0}
#define KF_PURPLE {129, 0, 255}
#define KF_SOFT_RED {255, 50, 50}

static const rgb_t keyfunc_palette[KFC_COUNT] = {
    [KFC_TRANSPARENT]     = KF_OFF,      //
    [KFC_OFF]             = KF_OFF,      //
    [KFC_ALPHA]           = KF_BLUE,     //
    [KFC_NUMBER]          = KF_MAGENTA,  //
    [KFC_FUNCTION]        = KF_CYAN,     //
    [KFC_LAYER_NUM]       = KF_MAGENTA,  //
    [KFC_LAYER_FUN]       = KF_CYAN,     //
    [KFC_LAYER_ESC]       = KF_YELLOW,   //
    [KFC_LAYER_EXT]       = KF_YELLOW,   //
    [KFC_LAYER_MAIN]      = KF_BLUE,     //
    [KFC_MODIFIER]        = KF_GREEN,    //
    [KFC_CENTER]          = KF_GREEN,    //
    [KFC_SYMBOL]          = KF_YELLOW,   //
    [KFC_ARROW]           = KF_ORANGE,   //
    [KFC_ALT_NUM]         = KF_ORANGE,   //
    [KFC_MOUSE_MOVE]      = KF_PURPLE,   //
    [KFC_MOUSE_BTN1]      = KF_SOFT_RED, //
    [KFC_MOUSE_BTN2]      = KF_BLUE,     //
    [KFC_MOUSE_BTN_OTHER] = KF_GREEN,    //
    [KFC_ZOOM]            = KF_CYAN,     //
    [KFC_MEDIA]           = KF_BLUE,     //
    [KFC_BOOTLOADER]      = KF_RED,      //
    [KFC_SLEEP]           = KF_RED,      //
    [KFC_RGB]             = KF_GREEN,    //
    [KFC_OTHER]           = KF_WHITE,    //
};

rgb_t keyfunc_category_color(uint8_t category) {
    return category < KFC_COUNT ? keyfunc_palette[category] : keyfunc_palette[KFC_OTHER];
}

/* Keycode Classification */

static inline bool is_keycode_modifier(uint16_t keycode) {
    if (IS_MODIFIER_KEYCODE(keycode)) return true; //< Ctrl, Alt, Shift, Win
    if (IS_QK_MOD_TAP(keycode)) return true;       //< Mod-Tap (hold: Ctrl, Alt, Shift, Win)
    switch (keycode) {
        case KC_ENTER ... KC_SPACE: //< ENT, ESC, BSPC, TAB, SPC
        case KC_DEL:
        case KC_KP_ENTER:
            return true;
    }
    return false;
}

static inline bool is_keycode_symbol(uint16_t keycode) {
    switch (keycode) {
        case S(KC_1)... S(KC_0):
        case S(KC_MINS)... S(KC_SLSH):
        case KC_COMM ... KC_SLSH:
        case KC_MINS ... KC_QUOT: // exclude JP_ZKHK(KC_GRV)
        case JP_BSLS:
        case JP_UNDS:
        case JP_PIPE:
        case JP_YEN:
        case KC_KP_SLASH ... KC_KP_PLUS:
        case KC_KP_DOT:
        case KC_KP_EQUAL:
            return true;
    }
    return false;
}

static inline int8_t keycode_hold_layer(uint16_t keycode) {
    if (IS_QK_MOMENTARY(keycode)) return QK_MOMENTARY_GET_LAYER(keycode);
    if (IS_QK_LAYER_TAP(keycode)) return QK_LAYER_TAP_GET_LAYER(keycode);
    return -1;
}

static uint8_t keyfunc_category(uint16_t keycode) {
    if (keycode == KC_TRNS) return KFC_TRANSPARENT;
    /* Layer Hold (MO/LT) */
    switch (keycode_hold_layer(keycode)) {
        case KGL_NUM:
            return KFC_LAYER_NUM;
        case KGL_FUN:
            return KFC_LAYER_FUN;
    }
    /* Layer-Tap (tap: ESC) */
    if (IS_QK_LAYER_TAP(keycode) && QK_LAYER_TAP_GET_TAP_KEYCODE(keycode) == KC_ESC) return KFC_LAYER_ESC;
    /* Modifier */
    if (is_keycode_modifier(keycode)) return KFC_MODIFIER;
    /* Symbol */
    if (is_keycode_symbol(keycode)) return KFC_SYMBOL;
    /* Mouse (Move/Wheel) */
    if (IS_MOUSEKEY_MOVE(keycode) || IS_MOUSEKEY_WHEEL(keycode)) return KFC_MOUSE_MOVE;
    /* LED */
    if (IS_UNDERGLOW_KEYCODE(keycode)) return KFC_RGB;
    switch (keycode) {
        /* Empty */
        case KC_NO:
            return KFC_OFF;
        /* Alphabet */
        case KC_A ... KC_Z:
            return KFC_ALPHA;
        /* Number */
        case KC_1 ... KC_0:
        case KC_P1 ... KC_P0:
            return KFC_NUMBER;
        /* Function */
        case KC_F1 ... KC_F12:
            return KFC_FUNCTION;
        /* To Layer */
        case KG_TO_N:
            return KFC_LAYER_NUM;
        case KG_TO_F:
            return KFC_LAYER_FUN;
        case KG_TO_E:
            return KFC_LAYER_EXT;
        case KG_TO_M:
            return KFC_LAYER_MAIN;
        /* Arrow */
        case KC_RIGHT ... KC_UP:
            return KFC_ARROW;
        /* Bootloader */
        case QK_BOOTLOADER:
            return KFC_BOOTLOADER;
        /* System Sleep */
        case KC_SYSTEM_SLEEP:
            return KFC_SLEEP;
        /* Mouse (Button Left) */
        case MS_BTN1:
            return KFC_MOUSE_BTN1;
        /* Mouse (Button Right) */
        case MS_BTN2:
            return KFC_MOUSE_BTN2;
        /* Mouse (Button 3/4/5) */
        case MS_BTN3 ... MS_BTN5:
            return KFC_MOUSE_BTN_OTHER;
        /* Mouse (Move/Wheel) */
        case KG_MSL ... KG_MWLR:
        case KG_POINTING_SCROLL:
            return KFC_MOUSE_MOVE;
        case KG_POINTING_ZOOM:
            return KFC_ZOOM;
        /* Audio */
        case KC_MUTE ... KC_VOLD:
        /* PrintScreen */
        case KC_PSCR:
        case A(KC_PSCR):
            return KFC_MEDIA;
        /* Alt+Num */
        case A(KC_1)... A(KC_0):
            return KFC_ALT_NUM;
        /* Central Keys */
        case KG_CTTL:
        case KG_CTBL:
        case KG_CTTR:
        case KG_CTBR:
            return KFC_CENTER;
        /* Other */
        default:
            return KFC_OTHER;
    }
}

/* Category Table */

static uint8_t kf_table[KEYFUNC_MAX_LAYERS][RGB_MATRIX_LED_COUNT]; //< zero = KFC_TRANSPARENT
static uint8_t kf_layer_count;
static uint8_t kf_generation;

uint8_t keyfunc_generation(void) {
    return kf_generation;
}

uint8_t keyfunc_led_category(uint8_t led_index, layer_state_t state) {
    if (led_index >= RGB_MATRIX_LED_COUNT) return KFC_OFF;
    // Same as layer_switch_get_layer(): highest active non-transparent layer, else layer 0.
    for (int8_t layer = kf_layer_count - 1; layer >= 0; layer--) {
        if (!(state & ((layer_state_t)1 << layer))) continue;
        uint8_t category = kf_table[layer][led_index];
        if (category != KFC_TRANSPARENT) return category;
    }
    uint8_t category = kf_table[0][led_index];
    return category != KFC_TRANSPARENT ? category : KFC_OFF;
}

#ifdef KEYFUNC_SPLIT_SYNC

typedef struct {
    uint8_t layer;
    uint8_t offset; //< absolute LED index
    uint8_t count;
    uint8_t categories[RPC_M2S_BUFFER_SIZE - 3];
} keyfunc_sync_msg_t;

_Static_assert(sizeof(keyfunc_sync_msg_t) <= RPC_M2S_BUFFER_SIZE, "keyfunc_sync_msg_t exceeds RPC buffer");

#    define KEYFUNC_BLOCK_SIZE (sizeof(((keyfunc_sync_msg_t *)0)->categories))

static uint8_t kf_pending[KEYFUNC_MAX_LAYERS]; //< bitmask of blocks to send, per layer

_Static_assert(RGB_MATRIX_LED_COUNT <= KEYFUNC_BLOCK_SIZE * 8, "too many LEDs for kf_pending bitmask");

// LED index range of the other half (valid on master).
static void keyfunc_slave_range(uint8_t *begin, uint8_t *end) {
    static const uint8_t split[2] = RGB_MATRIX_SPLIT;
    // LEDs [0, split[0]) are on the left half.
    if (is_keyboard_left()) {
        *begin = split[0];
        *end   = split[0] + split[1];
    } else {
        *begin = 0;
        *end   = split[0];
    }
}

static void keyfunc_mark_pending(uint8_t layer, uint8_t led_index) {
    uint8_t begin, end;
    keyfunc_slave_range(&begin, &end);
    if (led_index < begin || led_index >= end) return;
    kf_pending[layer] |= 1 << ((led_index - begin) / KEYFUNC_BLOCK_SIZE);
}

static void keyfunc_mark_all_pending(void) {
    uint8_t begin, end;
    keyfunc_slave_range(&begin, &end);
    uint8_t blocks = (end - begin + KEYFUNC_BLOCK_SIZE - 1) / KEYFUNC_BLOCK_SIZE;
    for (uint8_t layer = 0; layer < kf_layer_count; layer++)
        kf_pending[layer] = (1 << blocks) - 1;
}

static void keyfunc_sync_slave_handler(uint8_t in_len, const void *in_data, uint8_t out_len, void *out_data) {
    const keyfunc_sync_msg_t *msg = in_data;
    if (in_len < 3 || msg->layer >= KEYFUNC_MAX_LAYERS || msg->count > KEYFUNC_BLOCK_SIZE || in_len < 3 + msg->count || msg->offset + msg->count > RGB_MATRIX_LED_COUNT) return;
    memcpy(&kf_table[msg->layer][msg->offset], msg->categories, msg->count);
    if (msg->layer >= kf_layer_count) kf_layer_count = msg->layer + 1;
    kf_generation++;
}

// Send one pending block per call to keep each housekeeping pass short.
static void keyfunc_sync_send(void) {
    static bool was_connected = false;
    const bool  connected     = is_transport_connected();
    if (connected && !was_connected) keyfunc_mark_all_pending(); // slave (re)connected
    was_connected = connected;
    if (!connected) return;

    for (uint8_t layer = 0; layer < kf_layer_count; layer++) {
        if (!kf_pending[layer]) continue;
        uint8_t block = 0;
        while (!(kf_pending[layer] & (1 << block)))
            block++;
        uint8_t begin, end;
        keyfunc_slave_range(&begin, &end);
        keyfunc_sync_msg_t msg;
        msg.layer  = layer;
        msg.offset = begin + block * KEYFUNC_BLOCK_SIZE;
        msg.count  = MIN(KEYFUNC_BLOCK_SIZE, end - msg.offset);
        memcpy(msg.categories, &kf_table[layer][msg.offset], msg.count);
        if (transaction_rpc_send(RPC_ID_KB_KEYFUNC_SYNC, 3 + msg.count, &msg)) kf_pending[layer] &= ~(1 << block);
        return;
    }
}

#endif // KEYFUNC_SPLIT_SYNC

// Rebuild the table from the local keymap; returns true if anything changed.
static bool keyfunc_build_table(void) {
    bool changed   = false;
    kf_layer_count = MIN(keymap_layer_count(), KEYFUNC_MAX_LAYERS);
    for (uint8_t layer = 0; layer < kf_layer_count; layer++) {
        for (uint8_t row = 0; row < MATRIX_ROWS; row++) {
            for (uint8_t col = 0; col < MATRIX_COLS; col++) {
                uint8_t index = g_led_config.matrix_co[row][col];
                if (index == NO_LED) continue;
                uint8_t category = keyfunc_category(keymap_key_to_keycode(layer, (keypos_t){col, row}));
                if (kf_table[layer][index] == category) continue;
                kf_table[layer][index] = category;
                changed                = true;
#ifdef KEYFUNC_SPLIT_SYNC
                if (is_keyboard_master()) keyfunc_mark_pending(layer, index);
#endif
            }
        }
    }
    if (changed) kf_generation++;
    return changed;
}

static bool     kf_keymap_dirty = false;
static uint32_t kf_keymap_dirty_timer;

void keyfunc_keymap_changed(void) {
    kf_keymap_dirty       = true;
    kf_keymap_dirty_timer = timer_read32();
}

void keyfunc_init(void) {
    keyfunc_build_table(); // slave: local keymap until the master's table arrives
#ifdef KEYFUNC_SPLIT_SYNC
    transaction_register_rpc(RPC_ID_KB_KEYFUNC_SYNC, keyfunc_sync_slave_handler);
    if (is_keyboard_master()) keyfunc_mark_all_pending();
#endif
}

void keyfunc_task(void) {
    if (!is_keyboard_master()) return;
    if (kf_keymap_dirty && timer_elapsed32(kf_keymap_dirty_timer) >= KEYFUNC_REBUILD_DELAY_MS) {
        kf_keymap_dirty = false;
        keyfunc_build_table();
    }
#ifdef KEYFUNC_SPLIT_SYNC
    keyfunc_sync_send();
#endif
}
