# KERIgoKBD Keymap Viewer

KERIgoKBD v2の`keymap.c`を、一枚の早見表として表示する静的Webアプリ。物理キー配置は`keymaps/via/via.json`から取得。

## Structure

- `scripts/generate.py`: QMKソースとVIAレイアウトの解析・検証
- `public/index.html`: Viewerの構造とSVGアイコン定義
- `public/favicon.svg`: 右手側キーボードをモチーフにしたページアイコン
- `public/styles.css`: 画面・印刷レイアウト
- `public/app.js`: キー描画、Mouseレイヤ切り替え、PNG生成
- `tests/test_generate.py`: パーサー、ラベル、配置、生成データのテスト

`public/generated/`は生成専用。Gitのコミット対象外。

## Generate

```sh
python3 software/keymap_viewer/scripts/generate.py
```

生成時に、表示対象レイヤの不足、キー数の不一致、VIAと`info.json`のmatrix不整合を検出。

`Layout vYYYY.MM.DDa`は、v2の`keymaps/default/keymap.c`のGit履歴から自動生成。
最新の変更コミットのコミッター日時を日本時間で日付に変換し、その日の変更コミット数に応じて`a`、`b`、…、`z`、`aa`と付与する。
例えば同日に2回更新すると`Layout v2026.09.12b`となる。コメントのみの変更も1回に数える。
Viewerや他のファイルだけの変更、再生成・再デプロイでは変わらない。未コミットの編集は番号に反映されない。
生成にはGitの完全な履歴が必要で、GitHub Pagesのcheckoutも`fetch-depth: 0`を使用する。

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
