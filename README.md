# KERIgoKBD (KERI's Ergonomic Keyboard)

けりの自作キーボードのソースコード。

```tree
kerigokbd/
├── external/
│   ├── qmk_firmware/               # QMK Firmware for VIA (git-submodule)
│   └── vial-qmk/                   # QMK Firmware for VIAL (git-submodule)
├── hardware/
│   └── kerigokbd_v1/
│       ├── case/                   # STL
│       └── pcb/                    # KiCad
├── software/
│   └── keyboards/                  # Keyboard Entries of QMK Firmware
│       └── kerigokbd/
│           ├── kerigokbd_v1/
│           ├── kerigokbd_corne_v4/
│           ├── keyball44rp/
│           └── readme.md
├── .clang-format
├── .gitmodules
└── README.md
```

## ハードウェア

- [KERIgoKBD v1](./hardware/kerigokbd_v1/)
  - (設計中)
- KERIgoKBD Corne v4
  - [foostan](https://github.com/foostan)さんの[Corne V4 Chocolate](https://github.com/foostan/crkbd)のケースをカスタマイズしたもの。
- Keyball44 RP2040
  - [Yowkees](https://github.com/Yowkees)さんの[Keyball44](https://github.com/Yowkees/keyball)のマイコンボードをRP2040に差し替えたもの。

## ソフトウェア

- [QMK Firmware](https://qmk.fm/)のプロジェクト
  - [software](./software/)を参照。
