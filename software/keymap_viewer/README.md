# KERIgoKBD Keymap Viewer

- KERIgoKBD v1/v2の各レイヤのキーマップを一枚の早見表として表示する静的Webアプリ。
- GitHub Pagesで公開中: <https://kerikun11.github.io/keryboard/>

## 主な機能

- **キーボード切り替え**
  - 設定の「キーボード」でv1・v2を切り替え。物理キー配置・トラックパッド有無・Mouseレイヤ有無も合わせて切り替わる
- **レイヤ別のキーマップ表示**
  - Main/Num/Fn/Extra/Mouseの割り当てを1枚の早見表に色分け表示。長押し時の割り当て(Hold)は下端に表示
- **レイヤ表示のON/OFF切り替え**
  - 設定のトグルでNum・Fn・Extra・Mouseレイヤを個別に表示/非表示にできる。選択はキーボード切り替え後も維持
- **Shift併記**
  - `,`・`.`・`/`キーにShift時の`<`・`>`・`?`をMainの右側に併記
- **Mouse操作アイコン**
  - トラックパッド有効時のクリック(左/右/中)、ポインター移動、ホイール移動に加え、Mouseレイヤのスクロール/ズームモードをアイコンと凡例で表示
- **PNGエクスポート**
  - レイアウト部分を2倍解像度のPNGとしてクリップボードへコピー、またはファイルへダウンロード。ファイル名にキーボードとLayoutバージョンを含む
- **Layoutバージョンの自動採番**
  - `keymap.c`のGitコミット履歴から`vYYYY.MM.DDa`形式のバージョンを自動生成
- **GitHub Pagesへの自動デプロイ**
  - `main`へのプッシュで生成・テスト・デプロイを自動実行

## 構成

### Webアプリソースコード

- `scripts/`
  - `generate.py`: 上記QMK側ファイルの解析・検証、`public/generated/keymap-data.js`の生成
- `public/`
  - `index.html`: Viewerの構造とSVGアイコン定義
  - `favicon.svg`: 右手側キーボードをモチーフにしたページアイコン
  - `styles.css`: 画面・印刷レイアウト
  - `app.js`: キー描画、Mouseレイヤ切り替え、PNG生成
- `tests/`
  - `test_generate.py`: パーサー、ラベル、配置、生成データのテスト

### 生成物

- `public/`
  - `generated/keymap-data.js`: `generate.py`が出力するキーマップデータ。Gitのコミット対象外

### QMK側の参照ファイル

- `../qmk/keyboards/kerigokbd/`
  - `kerigokbd.h`: レイヤー・キーコードの`#define`定義
  - `kerigokbd_v{1,2}/info.json`: キー数とマトリクス配置
  - `kerigokbd_v{1,2}/keymaps/default/keymap.c`: 各レイヤーのキー割り当て。Gitコミット履歴からLayoutバージョンも算出
  - `kerigokbd_v{1,2}/keymaps/via/via.json`: KLE互換の物理キー配置（座標・サイズ）

## 生成

QMKソースコードから`public/generated/keymap-data.js`を生成する。

```sh
python3 scripts/generate.py
```

## プレビュー

次を実行し、`http://127.0.0.1:8000/`を開く。

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory public
```

設定ペインの「キーボード」でv1・v2を選択。初期表示はv2。v1は48キーすべてを表示し、トラックパッドと専用MouseレイヤがないためMouse切り替えは無効になる。PNGの内容とファイル名も選択したキーボードに合わせる。

表示対象はMain、Num、Fn、Mouse（v2のみ）。Mainはキー上部中央、Numは左下、Mouseは中央下部、Fnは右下、長押し時の割り当ては下端に表示。Mouseは下部ペインで表示を切り替え。

`,`、`.`、`/`には、Shift時の`<`、`>`、`?`をMainの右側に併記。

下部ペインの「PNGをコピー」ボタンで、レイアウト部分を2倍解像度のPNG画像としてクリップボードへコピー。Clipboard API対応のChromeなどで利用可能。

「PNGをダウンロード」ボタンでは同じ画像をファイルとして保存。ファイル名にはレイアウトバージョンを含む。

## テスト

```sh
python3 -m unittest discover -s tests -q
```

設定の「Extraレイヤを表示」で、Extraレイヤ（ファームウェアのKGL_EXT）をキー中央に紫色で表示する。v1・v2に対応し、Mouseとは独立に切り替え可能。初期状態は非表示。透明キー・無効キーは空欄。ホイール操作はアイコンと方向矢印で表示。PNGのコピー・ダウンロードにも反映する。

設定のNum・Fnトグルで各レイヤと凡例を個別に表示・非表示にできる。初期状態は両方ON。選択はキーボード切り替え後も維持し、PNGにも反映する。長押しのNum・Fn表示はそのまま残る。
