#!/bin/bash
set -eu

## defintions
KEYBOARDS_DIR=software/keyboards
QMK_DIR=external/qmk_firmware
VIAL_DIR=external/vial-qmk

function register_qmk_keyboard() {
    ## params
    KEYBOARD_NAME=$1
    QMK_FIRMWARE_DIR=$2
    ## process
    cd $(git rev-parse --show-toplevel)
    # make a symbolic link
    ln -rsf $KEYBOARDS_DIR/$KEYBOARD_NAME $QMK_FIRMWARE_DIR/keyboards/
    # locally ignore the link in git
    echo "/keyboards/$KEYBOARD_NAME" >>.git/modules/$QMK_FIRMWARE_DIR/info/exclude
}

for keyboard in $(ls $KEYBOARDS_DIR/); do
    echo $keyboard
    register_qmk_keyboard $keyboard $QMK_DIR
    register_qmk_keyboard $keyboard $VIAL_DIR
done
