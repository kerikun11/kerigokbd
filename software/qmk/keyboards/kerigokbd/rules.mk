# rules.mk for KERIgoKBD

# RGB Matrix
RGB_MATRIX_CUSTOM_USER = yes # rgb_matrix_user.inc

# Layer Lock (https://docs.qmk.fm/features/layer_lock): QK_LLCK keeps the current layer on
LAYER_LOCK_ENABLE = yes

# Debounce: per-key eager (global defer reorders near-simultaneous presses by matrix position)
DEBOUNCE_TYPE = sym_eager_pk
