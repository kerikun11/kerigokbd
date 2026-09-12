# KERIgoKBD Keymap Viewer

KERIgoKBD v2の`keymap.c`を、一枚の早見表として表示する静的Webアプリ。物理キー配置は`keymaps/via/via.json`から取得。

## Structure

- `scripts/generate.py`: QMKソースとVIAレイアウトの解析・検証
- `public/index.html`: Viewerの構造とSVGアイコン定義
- `public/styles.css`: 画面・印刷レイアウト
- `public/app.js`: キー描画、Mouseレイヤ切り替え、PNG生成
- `tests/test_generate.py`: パーサー、ラベル、配置、生成データのテスト

`public/generated/`は生成専用。Gitのコミット対象外。

## Generate

```sh
python3 software/keymap_viewer/scripts/generate.py
```

生成時に、表示対象レイヤの不足、キー数の不一致、VIAと`info.json`のmatrix不整合を検出。

## Preview

リポジトリルートで次を実行し、`http://127.0.0.1:8000/`を開く。

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory software/keymap_viewer/public
```

表示対象はMain、Num、Fn、Mouse。Mainはキー上部中央、Numは左下、Mouseは中央、Fnは右下、長押し時の割り当ては下端に表示。Mouseは下部ペインで表示を切り替え。

`,`、`.`、`/`には、Shift時の`<`、`>`、`?`をMainの右側に併記。

下部ペインの「PNGをコピー」ボタンで、レイアウト部分を2倍解像度のPNG画像としてクリップボードへコピー。Clipboard API対応のChromeなどで利用可能。

## Test

```sh
python3 -m unittest discover -s software/keymap_viewer/tests -q
```
