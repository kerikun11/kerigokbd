# rules.mk for KERIgoKBD v2

# Pointing Device (https://docs.qmk.fm/features/pointing_device#cirque-trackpad)
POINTING_DEVICE_DRIVER = custom

OPT_DEFS += -DPOINTING_DEVICE_DRIVER_cirque_pinnacle_i2c
I2C_DRIVER_REQUIRED = yes
SRC += drivers/sensors/cirque_pinnacle_i2c.c
SRC += drivers/sensors/cirque_pinnacle.c
SRC += drivers/sensors/cirque_pinnacle_gestures.c
SRC += $(QUANTUM_DIR)/pointing_device/pointing_device_gestures.c
