#!/bin/bash

## script config
set -eu

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

## qmk firmware
if $flag_v; then
    QMK_DIR=$(git rev-parse --show-toplevel)/external/vial-qmk
else
    QMK_DIR=$(git rev-parse --show-toplevel)/external/qmk_firmware
fi

## main process
cd $QMK_DIR
if $flag_c; then
    qmk clean
fi
if $flag_f; then
    qmk flash
else
    qmk compile
fi
