#!/bin/bash
# QMK Firmware Tools

## script config
set -eu

## parse command-line options
flag_c=false # clean
flag_f=false # flash
flag_v=false # vial
flag_k=false # kerigokbd v1
flag_r=false # keyballrp
flag_b=false # keyball
while getopts "cfvkbr" opt; do
    case $opt in
    c) flag_c=true ;;
    f) flag_f=true ;;
    v) flag_v=true ;;
    k) flag_k=true ;;
    r) flag_r=true ;;
    b) flag_b=true ;;
    *) echo "invalid option: $opt" ;;
    esac
done

## check flags
QMK_DIR=$(git rev-parse --show-toplevel)/external/qmk_firmware
QMK_KEYMAP=via
if $flag_v; then
    QMK_DIR=$(git rev-parse --show-toplevel)/external/vial-qmk
    QMK_KEYMAP=vial
fi
QMK_KEYBOARD=kerigokbd/kerigokbd_corne_v4
if $flag_k; then
    QMK_KEYBOARD=kerigokbd/kerigokbd_v1
elif $flag_r; then
    QMK_KEYBOARD=kerigokbd/keyball44rp
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
