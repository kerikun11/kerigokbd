#!/bin/bash

set -eux
cd $(git rev-parse --show-toplevel)

KEYBOARD_DIR=keyboards/kerigokbd
QMK_FIRMWARE_DIR=external/qmk_firmware

# make a symbolik link
ln -rsf $KEYBOARD_DIR $QMK_FIRMWARE_DIR/keyboards

# locally ignore the link in git
echo "$KEYBOARD_DIR" >>.git/modules/$QMK_FIRMWARE_DIR/info/exclude

QMK_FIRMWARE_DIR=external/vial-qmk

# make a symbolik link
ln -rsf $KEYBOARD_DIR $QMK_FIRMWARE_DIR/keyboards

# locally ignore the link in git
echo "$KEYBOARD_DIR" >>.git/modules/$QMK_FIRMWARE_DIR/info/exclude
