# KERIgoKBD (KERI's Ergonomic Keyboard)

けりの自作キーボードの設計データ。

```tree
kerigokbd/
├── hardware/
│   └── kerigokbd_v1/               # PCB Design, Case Model
├── software/
│   └── qmk/
│       ├── firmware/               # QMK Firmware for VIA (git-submodule)
│       ├── keyboards/              # Keyboard Entries of QMK Firmware
│       │   └── kerigokbd/
│       │       ├── kerigokbd_v1/
│       │       ├── kerigokbd_corne_v4/
│       │       ├── keyball44rp/
│       │       └── readme.md
│       ├── qmk.sh                  # Build Script
│       └── README.md               # Build Manual
├── .clang-format
├── .gitmodules
└── README.md
```

## 対応キーボード一覧

このリポジトリで扱っているキーボード一覧。

### KERIgoKBD v1

[けり](https://github.com/kerikun11)のはじめての自作キーボード。

- Hardware: [KERIgoKBD v1 Design](./hardware/kerigokbd_v1/)
- Firmware: [KERIgoKBD v1 Firmware](./software/qmk/keyboards/kerigokbd/kerigokbd_v1/)
- Remap: [KERIgoKBD v1 - Remap](https://remap-keys.app/catalog/8pqWZfIyb0UqzhvSmsgh/keymap?id=RpLYgWmZ0A9D40j9Gvdv)
- Keyboard Layout Editor: [KERIgoKBD v1 - Keyboard Layout Editor](https://www.keyboard-layout-editor.com/#/gists/e9041aa9a964c55f5b5cef199f9d24c8)
- Case Model: [KERIgoKBD v1 Case - Free 3D Print Model - MakerWorld](https://makerworld.com/en/models/979242-kerigokbd-v1-case#profileId-2735533)

![KERIgoKBD v1](./hardware/kerigokbd_v1/v1.0.0_pcb_20241229/images/kerigokbd_v1.jpg)

### KERIgoKBD Corne v4

[foostan](https://github.com/foostan)さんの[Corne V4 Chocolate](https://github.com/foostan/crkbd)のケースとファームウェアをカスタマイズしたもの。

- Hardware: https://github.com/foostan/crkbd
- Firmware: [KERIgoKBD Corne V4](./software/qmk/keyboards/kerigokbd/kerigokbd_corne_v4/)

![KERIgoKBD Corne V4](./software/qmk/keyboards/kerigokbd/kerigokbd_corne_v4/images/kerigokbd_corne_v4.jpg)

### Keyball44 RP2040

[Yowkees](https://github.com/Yowkees)さんの[Keyball44](https://github.com/Yowkees/keyball)のマイコンボードを`RP2040 Pro Micro`に差し替えたもの。

- Hardware: https://github.com/Yowkees/keyball
- Firmware: [Keyball44 RP2040](./software/qmk/keyboards/kerigokbd/keyball44rp/)

![Keyball44rp](./software/qmk/keyboards/kerigokbd/keyball44rp/images/keyball44rp.jpg)
