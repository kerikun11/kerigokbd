#!/bin/bash -eu
cd $(git rev-parse --show-toplevel)/external/qmk_firmware
qmk config user.keymap=default
qmk config user.keyboard=kerigokbd/kerigokbd_corne_v4
