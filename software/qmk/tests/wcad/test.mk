# Exercise the production implementation with QMK's real tapping engine.
SRC += ../tests/wcad/firmware.c
VPATH += keyboards/kerigokbd quantum/keymap_extras
# Keep the fixture's raw keymap provider, but let production code own the
# input lookup. Rename only this fixture translation unit, not QMK itself.
$(TEST_OBJ)/$(TEST_OUTPUT)/tests/test_common/test_fixture.o: FILE_SPECIFIC_CFLAGS += -Dkeymap_key_to_keycode=wcad_test_keymap_key_to_keycode
