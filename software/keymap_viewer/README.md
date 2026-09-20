# KERIgoKBD Keymap Viewer

KERIgoKBD v1・v2の`keymap.c`を、一枚の早見表として表示する静的Webアプリ。物理キー配置は`keymaps/via/via.json`から取得。

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

`Layout vYYYY.MM.DDa`は、選択したキーボードの`keymaps/default/keymap.c`のGit履歴から自動生成。
最新の変更コミットのコミッター日時を日本時間で日付に変換し、その日の変更コミット数に応じて`a`、`b`、…、`z`、`aa`と付与する。
例えば同日に2回更新すると`Layout v2026.09.12b`となる。コメントのみの変更も1回に数える。
Viewerや他のファイルだけの変更、再生成・再デプロイでは変わらない。未コミットの編集は番号に反映されない。
生成にはGitの完全な履歴が必要で、GitHub Pagesのcheckoutも`fetch-depth: 0`を使用する。

## Preview

リポジトリルートで次を実行し、`http://127.0.0.1:8000/`を開く。

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory software/keymap_viewer/public
```

設定ペインの「キーボード」でv1・v2を選択。初期表示はv2。v1は48キーすべてを表示し、トラックパッドと専用MouseレイヤがないためMouse切り替えは無効になる。PNGの内容とファイル名も選択したキーボードに合わせる。

表示対象はMain、Num、Fn、Mouse（v2のみ）。Mainはキー上部中央、Numは左下、Mouseは中央下部、Fnは右下、長押し時の割り当ては下端に表示。Mouseは下部ペインで表示を切り替え。

`,`、`.`、`/`には、Shift時の`<`、`>`、`?`をMainの右側に併記。

下部ペインの「PNGをコピー」ボタンで、レイアウト部分を2倍解像度のPNG画像としてクリップボードへコピー。Clipboard API対応のChromeなどで利用可能。

「PNGをダウンロード」ボタンでは同じ画像をファイルとして保存。ファイル名にはレイアウトバージョンを含む。

## Test

```sh
python3 -m unittest discover -s software/keymap_viewer/tests -q
```

設定の「Extraレイヤを表示」で、Extraレイヤ（ファームウェアのKGL_ESC）をキー中央に紫色で表示する。v1・v2に対応し、Mouseとは独立に切り替え可能。初期状態は非表示。透明キー・無効キーは空欄。ホイール操作はアイコンと方向矢印で表示。PNGのコピー・ダウンロードにも反映する。

設定のNum・Fnトグルで各レイヤと凡例を個別に表示・非表示にできる。初期状態は両方ON。選択はキーボード切り替え後も維持し、PNGにも反映する。長押しのNum・Fn表示はそのまま残る。
