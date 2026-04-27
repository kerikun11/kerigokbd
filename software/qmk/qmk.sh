#!/bin/bash
# QMK Firmware Tools

## script config
set -eu

## default values
TOP_DIR=$(git rev-parse --show-toplevel)
QMK_DIR=$TOP_DIR/software/qmk/firmware
KEYBOARDS_DIR=$TOP_DIR/software/qmk/keyboards
QMK_KEYMAP=via
QMK_KEYBOARD=kerigokbd/kerigokbd_v2/pcb_20260222

function register_qmk_keyboards() {
    local qmk_exclude
    qmk_exclude=$(git -C "$QMK_DIR" rev-parse --git-path info/exclude)

    for keyboard_path in "$KEYBOARDS_DIR"/*; do
        [ -d "$keyboard_path" ] || continue

        local keyboard_name
        keyboard_name=$(basename "$keyboard_path")

        echo "$keyboard_name"
        ln -rsfn "$keyboard_path" "$QMK_DIR/keyboards/"
        if ! grep -qxF "/keyboards/$keyboard_name" "$qmk_exclude"; then
            echo "/keyboards/$keyboard_name" >>"$qmk_exclude"
        fi
    done
}

## all buildable keyboards: dirs containing keyboard.json under KEYBOARDS_DIR
mapfile -t ALL_KEYBOARDS < <(
    find "$KEYBOARDS_DIR" -name "keyboard.json" -printf "%P\n" |
        sed 's|/keyboard\.json$||' | sort
)

## parse command-line options
while getopts "b:m:csfldvorta" opt; do
    case $opt in
    b) QMK_KEYBOARD=$OPTARG ;;
    m) QMK_KEYMAP=$OPTARG ;;
    s) flag_s=true ;; # setup only
    c) flag_c=true ;; # clean
    f) flag_f=true ;; # flash
    l) flag_l=true ;; # lint
    d) flag_d=true ;; # use default keymap instead of via
    o) flag_o=true ;; # corne
    r) flag_r=true ;; # keyballrp
    t) flag_t=true ;; # trackpad
    a) flag_a=true ;; # build all keyboards
    *) echo "invalid option: $opt" ;;
    esac
done

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
register_qmk_keyboards

if declare -p flag_s &>/dev/null; then
    exit 0
fi

cd "$QMK_DIR"
if declare -p flag_c &>/dev/null; then (
    set -x
    qmk clean
); fi
if declare -p flag_a &>/dev/null; then
    for kb in "${ALL_KEYBOARDS[@]}"; do (
        set -x
        qmk compile -kb "$kb" -km "$QMK_KEYMAP"
    ); done
elif declare -p flag_f &>/dev/null; then (
    set -x
    qmk flash -kb "$QMK_KEYBOARD" -km "$QMK_KEYMAP"
); elif declare -p flag_l &>/dev/null; then (
    set -x
    qmk lint -kb "$QMK_KEYBOARD" -km "$QMK_KEYMAP"
); else (
    set -x
    qmk compile -kb "$QMK_KEYBOARD" -km "$QMK_KEYMAP" --compiledb
); fi
