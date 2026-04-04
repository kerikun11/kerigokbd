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
cd kerigokbd/software
```

`qmk.sh` は初回実行時にも、QMKファームウェアの `keyboards` ディレクトリ内へカスタムキーボードへのリンクを作成する。

```sh
## setup only
./qmk/qmk.sh -s
```

## ビルドと書き込み

QMKファームウェアのディレクトリでqmkコマンドを実行する。

```sh
cd ./qmk/firmware
## setup
qmk setup
## clean
qmk clean
## compile
qmk compile -kb kerigokbd/kerigokbd_v1 -km via
## compile and flash
qmk flash -kb kerigokbd/kerigokbd_v1 -km via
```

または下記スクリプトでも実行できる。

```sh
## compile
./qmk/qmk.sh
## compile and flash
./qmk/qmk.sh -f
## clean, compile, and flash
./qmk/qmk.sh -c -f
```
