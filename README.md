# KERI's QMK Firmware

けりの自作キーボードのファームウェア

```
keryboard
├── .git
├── keyboards                   # My Custom Firmware
│   ├── keymaps
│   │   └── default
│   │       └── keymap.c
│   ├── config.h
│   ├── info.json
│   ├── keryboard.c
│   ├── readme.md
│   ├── rgb_matrix_user.inc
│   └── rules.mk
├── qmk_firmware                # QMK Firmware Submodule
├── .clang-format
├── .gitmodules
└── README.md
```

## 前提

- シンボリックリンクが作成できる環境であること
- [QMKコマンド](https://docs.qmk.fm/newbs_getting_started)がインストールされていること

## ソースコードの取得と初回セットアップ

```sh
# clone this repository with submodules
git clone --recursive https://github.com/kerikun11/keryboard.git
cd keryboard
# make a symbolik link
ln -rsf keyboards/keryboard qmk_firmware/keyboards
# locally ignore the link in git
echo "keyboards/keryboard" >> .git/modules/qmk_firmware/info/exclude
```

# ビルドと書き込み

```sh
# prepare
cd qmk_firmware
qmk setup
# config
qmk config user.keymap=default
qmk config user.keyboard=keryboard
# compile
qmk compile
# flash
qmk flash
```
