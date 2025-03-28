# KERIgoKBD v1

KERI's Ergonomic Keyboard Version 1

![KERIgoKBD v1](../../../../hardware/kerigokbd_v1/images/kerigokbd_v1.jpg)

* Keyboard Maintainer: [kerikun11](https://github.com/kerikun11)
* Hardware Supported: [KERIgoKBD v1](../../../../hardware/kerigokbd_v1/)
* Hardware Availability: Not For Sale

Make example for this keyboard (after setting up your build environment):

    make kerigokbd/kerigokbd_v1/pcb_20250208:default

Flashing example for this keyboard:

    make kerigokbd/kerigokbd_v1/pcb_20250208:default:flash

See the [build environment setup](https://docs.qmk.fm/#/getting_started_build_tools) and the [make instructions](https://docs.qmk.fm/#/getting_started_make_guide) for more information. Brand new to QMK? Start with our [Complete Newbs Guide](https://docs.qmk.fm/#/newbs).

## Bootloader

Enter the bootloader in 3 ways:

* **Bootmagic reset**: Hold down the key at Q or P and plug in the keyboard
* **Physical reset button**: Briefly press the button on the back of the PCB
* **Keycode in layout**: Press the key mapped to `QK_BOOT` if it is available
