# KERI's QMK Firmware

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
├── firmware/
│   └── kerigokbd/                  # KERIgoKBD Custom Firmware
│       ├── kerigokbd_v1/
│       │   ├── keymaps/
│       │   │   ├── default/
│       │   │   │   └── keymap.c
│       │   ├── keyboard.json
│       │   └── config.h
│       ├── rules.mk
│       ├── kerigokbd.c
│       ├── kerigokbd.h
│       └── readme.md
├── .clang-format
├── .gitmodules
└── README.md
```

## ハードウェア

- KERIgoKBD Corne v4
  - [Corne V4](https://github.com/foostan/crkbd)ベースのキーボード。
    ![KERIgoKBD v1](software/kerigokbd/kerigokbd_corne_v4/images/kerigokbd_v1.jpg)
    ![KERIgoKBD v1](software/kerigokbd/kerigokbd_corne_v4/images/kerigokbd_v1_shining.jpg)
- KERIgoKBD v1
  - 設計中

## ソフトウェア

ファームウェアのビルドと書き込みの方法

### 前提

- シンボリックリンクが作成できる環境であること
- [QMKコマンド](https://docs.qmk.fm/newbs_getting_started)がインストールされていること

### ソースコードの取得と初回セットアップ

カスタムファームウェアのディレクトリをQMKリポジトリの中にシンボリックで追加して、不要な差分が表示されないように無視設定を行う。

```sh
# clone this repository with submodules
git clone --recursive https://github.com/kerikun11/kerigokbd.git
cd kerigokbd
```

QMKファームウェアのリポジトリのkeyboardsディレクトリ内にカスタムキーボードのリンクを追加する。

```sh
./script/setup.sh
```

### VIAビルド

```sh
# go to qmk firmware directory
cd external/qmk_firmware
# setup
qmk setup
```

QMKコマンドでビルドと書き込みを行う。

```sh
# compile
qmk compile -kb kerigokbd -km default
# flash
qmk flash -kb kerigokbd -km default
```

qmk config を設定しておくと引数を省略できる。

```sh
# config
qmk config user.keyboard=kerigokbd
qmk config user.keymap=default
# compile
qmk compile
# flash (with compile)
qmk flash
```

### VIALビルド

```sh
# go to qmk firmware directory
cd external/vial-qmk
# prepare
qmk setup
```

QMKコマンドでビルドと書き込みを行う。

```sh
# compile
qmk compile -kb kerigokbd/vial -km default
# flash
qmk flash -kb kerigokbd/vial -km default
```

qmk config を設定しておくと引数を省略できる。

```sh
# config
qmk config user.keyboard=kerigokbd/vial
qmk config user.keymap=default
# compile
qmk compile
# flash (with compile)
qmk flash
```
