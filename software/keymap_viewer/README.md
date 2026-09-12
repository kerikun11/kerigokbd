# KERIgoKBD Keymap Viewer

KERIgoKBD v2の`keymap.c`を、一枚の早見表として表示する静的Webアプリ。物理キー配置は`keymaps/via/via.json`から取得。

## Generate

```sh
python3 software/keymap_viewer/scripts/generate.py
```

## Preview

リポジトリルートで次を実行し、`http://127.0.0.1:8000/`を開く。

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory software/keymap_viewer/public
```

表示対象はMain、Nums、Func。Mainはキー中央、Numsは左下、Funcは右下、長押し時の割り当ては下端に表示。

画面右上の「PNGをコピー」ボタンで、レイアウト部分を2倍解像度のPNG画像としてクリップボードへコピー。Clipboard API対応のChromeなどで利用可能。
