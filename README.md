# KERIgoKBD (KERI's Ergonomic Keyboard)

けりの自作キーボードの設計データ。

![KERIgoKBD v1](./hardware/kerigokbd/kerigokbd_v1/images/kerigokbd_v1.jpg)

```tree
kerigokbd/
├── hardware/
│   ├── kerigokbd/                # KERIgoKBD common PCB/case parts
│   └── README.md                 # Hardware parts and compatibility table
├── software/
│   └── qmk/
│       ├── firmware/             # QMK Firmware for VIA (git submodule)
│       ├── keyboards/            # Keyboard entries for QMK Firmware
│       ├── qmk.sh                # Build script
│       └── README.md             # Build manual
├── .clang-format
├── .gitmodules
└── README.md
```

## 作品一覧

ハードウェア部品とファームウェアの対応は [`hardware/README.md`](./hardware/README.md) に記載。

| 作品                                                 | コメント                                                            |
| :--------------------------------------------------- | :------------------------------------------------------------------ |
| [KERIgoKBD v1](./hardware/kerigokbd/kerigokbd_v1/)   | はじめての自作エルゴノミックキーボード。                            |
| [KERIgoKBD v2](./hardware/kerigokbd/kerigokbd_v2/)   | KERIgoKBD v1 にトラックパッドを追加した構成。         |
| [KERIgoKBD Corne v4](./hardware/kerigokbd_corne_v4/) | Corne V4 Chocolate のケースとファームウェアをカスタマイズしたもの。 |
| Keyball44 RP2040                                     | Keyball44 のマイコンボードを RP2040 Pro Micro に差し替えたもの。    |

## KERIgoKBD v1

[けり](https://github.com/kerikun11)のはじめての自作キーボード。

![KERIgoKBD v1](./hardware/kerigokbd/kerigokbd_v1/images/kerigokbd_v1_top.jpg)

## KERIgoKBD v2

KERIgoKBD v1.2 PCB に Cirque トラックパッドを追加した構成。

![KERIgoKBD v2](./hardware/kerigokbd/kerigokbd_v2/images/kerigokbd_v2_top.jpg)

## KERIgoKBD Corne v4

[foostan](https://github.com/foostan)さんの[Corne V4 Chocolate](https://github.com/foostan/crkbd)のケースとファームウェアをカスタマイズしたもの。

![KERIgoKBD Corne V4](./software/qmk/keyboards/kerigokbd/kerigokbd_corne_v4/images/kerigokbd_corne_v4.jpg)

## Keyball44 RP2040

[Yowkees](https://github.com/Yowkees)さんの[Keyball44](https://github.com/Yowkees/keyball)のマイコンボードを `RP2040 Pro Micro` に差し替えたもの。

![Keyball44rp](./software/qmk/keyboards/kerigokbd/keyball44rp/images/keyball44rp.jpg)
