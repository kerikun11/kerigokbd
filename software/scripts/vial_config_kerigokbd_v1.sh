#!/bin/bash -eu
cd $(git rev-parse --show-toplevel)/external/vial-qmk
qmk config user.keymap=default
qmk config user.keyboard=kerigokbd/kerigokbd_v1/vial
