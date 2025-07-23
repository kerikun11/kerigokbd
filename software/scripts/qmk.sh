#!/bin/bash
# QMK Firmware Tools

## script config
set -eu

## default values
QMK_DIR=$(git rev-parse --show-toplevel)/external/qmk_firmware
QMK_KEYMAP=via
QMK_KEYBOARD=kerigokbd/kerigokbd_v1/pcb_20250208

## parse command-line options
while getopts "b:m:cfldvort" opt; do
    case $opt in
    b) QMK_KEYBOARD=$OPTARG ;;
    m) QMK_KEYMAP=$OPTARG ;;
    c) flag_c=true ;; # clean
    f) flag_f=true ;; # flash
    l) flag_l=true ;; # lint
    d) flag_d=true ;; # use default keymap instead of via
    v) flag_v=true ;; # vial
    o) flag_o=true ;; # corne
    r) flag_r=true ;; # keyballrp
    t) flag_t=true ;; # trackpad
    *) echo "invalid option: $opt" ;;
    esac
done

## vial
if declare -p flag_v &>/dev/null; then
    QMK_DIR=$(git rev-parse --show-toplevel)/external/vial-qmk
    QMK_KEYMAP=vial
fi
## keyboard
if declare -p flag_o &>/dev/null; then
    QMK_KEYBOARD=kerigokbd/kerigokbd_corne_v4
elif declare -p flag_r &>/dev/null; then
    QMK_KEYBOARD=kerigokbd/keyball44rp
elif declare -p flag_t &>/dev/null; then
    QMK_KEYBOARD=kerigokbd/examples/trackpad_cirque
fi
## keymap
if declare -p flag_d &>/dev/null; then
    QMK_KEYMAP=default
fi

## main process
cd $QMK_DIR
if declare -p flag_c &>/dev/null; then (
    set -x
    qmk clean
); fi
if declare -p flag_f &>/dev/null; then (
    set -x
    qmk flash -kb $QMK_KEYBOARD -km $QMK_KEYMAP
); elif declare -p flag_l &>/dev/null; then (
    set -x
    qmk lint -kb $QMK_KEYBOARD -km $QMK_KEYMAP
); else (
    set -x
    qmk compile -kb $QMK_KEYBOARD -km $QMK_KEYMAP --compiledb
); fi
