#include QMK_KEYBOARD_H

void keyboard_pre_init_user(void) {
    setPinInputHigh(SPLIT_HAND_PIN);
}
