# ソフトウェア

ファームウェアのビルドと書き込みの方法

## 前提

- シンボリックリンクが作成できる環境であること
- [QMKコマンド](https://docs.qmk.fm/newbs_getting_started)がインストールされていること

## ソースコードの取得と初回セットアップ

カスタムファームウェアのディレクトリをQMKリポジトリの中にシンボリックで追加して、不要な差分が表示されないように無視設定を行う。

```sh
## clone this repository with submodules
git clone --recursive https://github.com/kerikun11/kerigokbd.git
cd kerigokbd
```

QMKファームウェアのリポジトリのkeyboardsディレクトリ内にカスタムキーボードのリンクを追加する。

```sh
## make symbolic links to QMK Firmware repository
./scripts/setup.sh
```

## ビルドと書き込み

```sh
## compile
./scripts/qmk.sh
## compile and flash
./scripts/qmk.sh -f
## clean, compile, and flash
./scripts/qmk.sh -c -f
```
