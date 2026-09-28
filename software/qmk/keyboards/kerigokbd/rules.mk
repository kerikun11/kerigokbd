# rules.mk for KERIgoKBD

# RGB Matrix
RGB_MATRIX_CUSTOM_USER = yes # rgb_matrix_user.inc

# Key Function LED Categories (keyfunc.c): shared by rgb_matrix_user.inc, synced to the slave half
SRC += keyfunc.c
