# KERIgoKBD (KERI's Ergonomic Keyboard)

けりの自作キーボードの設計データ。

```tree
kerigokbd/
├── hardware/
│   └── kerigokbd_v1/               # PCB, Case Design
├── software/
│   └── qmk/
│       ├── firmware/               # QMK Firmware for VIA (git-submodule)
│       ├── keyboards/              # Keyboard Entries of QMK Firmware
│       │   └── kerigokbd/
│       │       ├── kerigokbd_v1/
│       │       ├── kerigokbd_corne_v4/
│       │       ├── keyball44rp/
│       │       └── readme.md
│       └── qmk.sh
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
