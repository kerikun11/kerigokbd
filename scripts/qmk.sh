#!/bin/bash

## script config
set -eu

## definitions
QMK_DIR=$(git rev-parse --show-toplevel)/external/qmk_firmware
QMK_KEYBOARD=kerigokbd
QMK_KEYMAP=default

## parse options
flag_v=false # vial
flag_c=false # clean
flag_f=false # flash
while getopts "vcf" opt; do
    case $opt in
    v) flag_v=true ;;
    c) flag_c=true ;;
    f) flag_f=true ;;
    *) echo "invalid option: $opt" ;;
    esac
done

## main process
if $flag_v; then
    QMK_DIR=$(git rev-parse --show-toplevel)/external/vial-qmk
    QMK_KEYBOARD=kerigokbd/vial
fi

cd $QMK_DIR

if $flag_c; then
    qmk clean
fi
if $flag_f; then
    qmk flash -kb $QMK_KEYBOARD -km $QMK_KEYMAP
else
    qmk compile -kb $QMK_KEYBOARD -km $QMK_KEYMAP
fi
