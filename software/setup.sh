#!/bin/bash

set -eux
cd $(git rev-parse --show-toplevel)

## definition
KEYBOARD_DIR=software/kerigokbd

## for QMK Firmware
QMK_FIRMWARE_DIR=external/qmk_firmware

# make a symbolic link
ln -rsf $KEYBOARD_DIR $QMK_FIRMWARE_DIR/keyboards

# locally ignore the link in git
echo "$KEYBOARD_DIR" >>.git/modules/$QMK_FIRMWARE_DIR/info/exclude

## for VIAL QMK
QMK_FIRMWARE_DIR=external/vial-qmk

# make a symbolic link
ln -rsf $KEYBOARD_DIR $QMK_FIRMWARE_DIR/keyboards

# locally ignore the link in git
echo "$KEYBOARD_DIR" >>.git/modules/$QMK_FIRMWARE_DIR/info/exclude
