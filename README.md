# KERI's QMK Firmware

けりの自作キーボードのファームウェア

## 前提

- シンボリックリンクが作成できる環境であること
- QMKコマンドがインストールされていること

## 取得

```sh
# clone
git clone {this-repository}
# make a link
ln -rsf keyboards/keryboard qmk_firmware/keyboards
# gitignore the link
echo "keyboards/keryboard" >> .git/modules/qmk_firmware/info/exclude
```

# ビルドと書き込み

```sh
# prepare
cd qmk_firmware
qmk setup
# config
qmk config user.keymap=default
qmk config user.keyboard=keryboard/v1
# compile
qmk compile
# flash
qmk flash
```
