# KERI's QMK Firmware

けりの自作キーボードのファームウェア

```tree
kerigokbd
├── .git
├── keyboards                   # My Custom Firmware
│   ├── keymaps
│   │   └── default
│   │       └── keymap.c
│   ├── config.h
│   ├── kerigokbd.c
│   ├── kerigokbd.h
│   ├── keyboard.json
│   ├── readme.md
│   ├── rgb_matrix_user.inc
│   └── rules.mk
├── qmk_firmware                # QMK Firmware for VIA (git-submodule)
├── vial-qmk                    # QMK Firmware for VIAL (git-submodule)
├── .clang-format
├── .gitmodules
└── README.md
```

## ハードウェア

- [Corne V4.1](https://github.com/foostan/crkbd)ベースのキーボード。

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

#### VIA初期設定

QMKファームウェアのリポジトリのkeyboardsディレクトリ内にリンクを追加する。

```sh
cd $(git rev-parse --show-toplevel)
# make a symbolik link
ln -rsf keyboards/kerigokbd qmk_firmware/keyboards
# locally ignore the link in git
echo "keyboards/kerigokbd" >> .git/modules/qmk_firmware/info/exclude
```

#### VIAL初期設定

QMKファームウェアのリポジトリのkeyboardsディレクトリ内にリンクを追加する。

```sh
cd $(git rev-parse --show-toplevel)
# make a symbolik link
ln -rsf keyboards/kerigokbd vial-qmk/keyboards
# locally ignore the link in git
echo "keyboards/kerigokbd" >> .git/modules/vial-qmk/info/exclude
```

### VIAビルド

QMKコマンドでビルドと書き込みを行う。

```sh
cd qmk_firmware
# setup
qmk setup
# compile
qmk compile -kb kerigokbd -km default
# flash
qmk flash -kb kerigokbd -km default
```

qmk config を設定しておくと引数を省略できる。

```sh
cd qmk_firmware
# config
qmk config user.keyboard=kerigokbd
qmk config user.keymap=default
# compile
qmk compile
# flash (with compile)
qmk flash
```

### VIALビルド

QMKコマンドでビルドと書き込みを行う。

```sh
cd vial-qmk
# prepare
qmk setup
# config
qmk config user.keyboard=kerigokbd/vial
qmk config user.keymap=default
# compile
qmk compile
# flash (with compile)
qmk flash
```
