#!/bin/bash
# QMK Firmware Tools

## script config
set -eu

## parse command-line options
flag_c=false # clean
flag_f=false # flash
flag_l=false # lint
flag_v=false # vial
flag_d=false # default keymap
flag_o=false # Corne V4
flag_r=false # keyballrp
flag_b=false # keyball
flag_t=false # trackpad
while getopts "cflvdobrt" opt; do
    case $opt in
    c) flag_c=true ;;
    f) flag_f=true ;;
    l) flag_l=true ;;
    v) flag_v=true ;;
    d) flag_d=true ;;
    o) flag_o=true ;;
    r) flag_r=true ;;
    b) flag_b=true ;;
    t) flag_t=true ;;
    *) echo "invalid option: $opt" ;;
    esac
done

## check flags
QMK_DIR=$(git rev-parse --show-toplevel)/external/qmk_firmware
QMK_KEYMAP=via
if $flag_d; then
    QMK_KEYMAP=default
fi
if $flag_v; then
    QMK_DIR=$(git rev-parse --show-toplevel)/external/vial-qmk
    QMK_KEYMAP=vial
fi
QMK_KEYBOARD=kerigokbd/kerigokbd_v1
if $flag_o; then
    QMK_KEYBOARD=kerigokbd/kerigokbd_corne_v4
elif $flag_r; then
    QMK_KEYBOARD=kerigokbd/keyball44rp
elif $flag_t; then
    QMK_KEYBOARD=kerigokbd/examples/trackpad_cirque
elif $flag_b; then
    QMK_KEYBOARD=keyball/keyball44
fi

## main process
set -x
cd $QMK_DIR
if $flag_c; then
    qmk clean
fi
if $flag_f; then
    qmk flash -kb $QMK_KEYBOARD -km $QMK_KEYMAP
else
    qmk compile -kb $QMK_KEYBOARD -km $QMK_KEYMAP
fi
if $flag_l; then
    qmk lint -kb $QMK_KEYBOARD -km $QMK_KEYMAP
fi
