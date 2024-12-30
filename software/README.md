# ファームウェアのビルドと書き込みの方法

## 前提

- シンボリックリンクが作成できる環境であること
- [QMKコマンド](https://docs.qmk.fm/newbs_getting_started)がインストールされていること

## ソースコードの取得と初回セットアップ

カスタムファームウェアのディレクトリをQMKリポジトリの中にシンボリックで追加して、不要な差分が表示されないように無視設定を行う。

```sh
# clone this repository with submodules
git clone --recursive https://github.com/kerikun11/kerigokbd.git
cd kerigokbd
```

QMKファームウェアのリポジトリのkeyboardsディレクトリ内にカスタムキーボードのリンクを追加する。

```sh
./scripts/setup.sh
```

## キーボード選択

```sh
# KERIgoKBD Corne v4
./scripts/qmk_config_kerigokbd_corne_v4.sh
# KERIgoKBD v1
./scripts/qmk_config_kerigokbd_v1.sh
```

### ビルドと書き込み

```sh
# compile
./scripts/qmk.sh
# compile and flash
./scripts/qmk.sh -f
# clean and compile
./scripts/qmk.sh -c
```
