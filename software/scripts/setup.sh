#!/bin/bash
set -eu

function setup_qmk_keyboard() {
    ## params
    KEYBOARD_DIR=software/$1
    QMK_FIRMWARE_DIR=external/$2
    ## process
    cd $(git rev-parse --show-toplevel)
    ## for QMK Firmware
    QMK_FIRMWARE_DIR=external/qmk_firmware
    # make a symbolic link
    ln -rsf $KEYBOARD_DIR $QMK_FIRMWARE_DIR/keyboards
    # locally ignore the link in git
    echo "$KEYBOARD_DIR" >>.git/modules/$QMK_FIRMWARE_DIR/info/exclude
}

setup_qmk_keyboard kerigokbd qmk_firmware
setup_qmk_keyboard kerigokbd vial-qmk

setup_qmk_keyboard keyball qmk_firmware
setup_qmk_keyboard keyball vial-qmk
