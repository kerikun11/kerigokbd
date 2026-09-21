# KERIgoKBD Studio

- KERIgoKBD v1/v2の各レイヤーのキーマップを一枚の早見表として表示しつつ、実機に接続した状態でリアルタイムに編集できるWebアプリ(WebHID + QMK VIAプロトコル)。

## 主な機能

- **キーボード切り替え**
  - 「キーボード」でv1・v2を切り替え。物理キー配置・トラックパッド有無・Trackpadレイヤー有無も合わせて切り替わる
- **早見表 / 編集画面の切り替え**
  - 画面上部のボタンで、全レイヤー重ね合わせの早見表(デフォルト表示)と、実機の値を書き換える編集画面を切り替える。接続前はファームウェアの初期状態(`defaults-*.js`)、接続後は実機の現在の値を表示
- **レイヤー別のキーマップ表示**
  - Main/Num/Fn/Extra/Trackpad(v2のみ)の割り当てを1枚の早見表に色分け表示。長押し時の割り当て(Hold)は下端に表示
- **レイヤー表示のON/OFF切り替え**
  - 「設定」のトグルでNum・Fn・Extra・Trackpadレイヤを個別に表示/非表示にできる。オフにしたレイヤーは凡例からも消える
- **操作アイコン表示**
  - マウスクリック(左/右/中)・ポインタ移動・ホイール移動・スクロール/ズームモードをアイコンと凡例で表示
- **実機との同期(WebHID + VIA)**
  - 「実機に接続」で`via`キーマップを書き込んだ実機とペアリングし、現在のキーマップを読み込む
  - 編集画面でキーを選び、キーコードピッカーから値を選ぶと即座に実機へ書き込む(書き込み中は該当キーを半透明表示)
  - 「実機から再読込」で実機の現在値を読み直す
- **keymap.cへの書き出し**
  - 実機の現在のキーマップから、`keymap.c`に手動で反映できるC言語ソースを生成してコピーする
- **mainの最新版レイアウトへの更新**
  - 選択した機種の`keymaps/default/keymap.c`を数値化したデータ(このページ自身にバンドル済み)で実機の全レイヤーを上書きする。早見表の接続前表示と同じデータなので、更新のためにネットワークへ取得しにいくことはない
  - 実機のファームウェアが報告するレイヤー数と一致しない場合は書き込まない(ファームウェアが古く、mainで追加された新しいレイヤーに未対応な場合など)
  - 更新前に実機の値を保存し、書き込み後に再読込して照合する。失敗時は元の値への復元を試み、USB切断などで復元できない場合はその旨を表示する
- **ファームウェア初期状態へのリセット**
  - 実機のファームウェアに組み込まれた初期値に、実機のキーマップを戻す
- **PNG画像エクスポート**
  - 早見表(トグルで隠したレイヤーはそのまま反映)をPNGとしてクリップボードへコピー、またはファイルへダウンロードできる

## 前提条件

- **ブラウザ**: WebHIDに対応したChromium系ブラウザ(Chrome / Edge)。Firefox / Safariは非対応。
- **ファームウェア**: `via`キーマップ(`VIA_ENABLE = yes`)を書き込んだ実機。`default`キーマップにはRAW HIDが無いため接続できない。

VIAのdynamic keymap機能は既定では4レイヤーまでしか公開しない(`quantum/dynamic_keymap.h`の`DYNAMIC_KEYMAP_LAYER_COUNT`既定値)が、KERIgoKBDの`info.json`側で`dynamic_keymap.layer_count`(v2は7、v1は6)を既に指定済みで、QMKのビルド時に`DYNAMIC_KEYMAP_LAYER_COUNT`へ自動変換される(`data/mappings/info_config.hjson`参照)。追加のファームウェア変更は不要。

## 構成

### Webアプリソースコード

- `scripts/`
  - `build_layout.py`: QMK側の`info.json`・`via.json`から物理配置(座標・matrix)を抽出し`public/generated/layout-*.js`を生成
  - `build_keycodes.py`: QMK本体の正規キーコード定義(`data/constants/keycodes/*.hjson`)と`keymap_japanese.h`・`kerigokbd.h`からキーコード対応表を生成し`public/generated/keycodes.js`を生成
  - `build_defaults.py`: 各機種の`default/keymap.c`をレイヤーごとに数値キーコードへ解決し`public/generated/defaults-*.js`を生成(実機の変更検出・早見表の接続前表示・レイアウトバージョン表示・最新版レイアウトへの更新に使用)。レイアウトバージョンは`keymap.c`のGitコミット履歴から`vYYYY.MM.DDa`形式で算出(フルクローンが必要)
- `public/`
  - `index.html`: 画面構造とマウス操作アイコンのSVG `<symbol>`定義
  - `favicon.svg`: 早見表の凡例キーをモチーフにしたページアイコン
  - `editor.css`: 画面レイアウト
  - `app.js`: 画面全体の状態管理・イベント配線
  - `hid/`: WebHID接続(`hid-transport.js`)とVIAプロトコルのエンコード/デコード(`via-protocol.js`)
  - `keycodes/`: 数値キーコードのビット合成式(`keycode-values.js`)、デコード/エンコード(`keycode-codec.js`)、表示用ラベル(`keycode-format.js`)、対応表(`keycode-registry.js`)、早見表用の複数レイヤー重ね合わせラベル(`cheat-sheet-labels.js`)とマウス操作アイコンの対応表(`cheat-sheet-icons.js`)
  - `layout/`: 生成済み物理配置・デフォルトキーマップの読み込み
  - `state/`: 状態管理(`keymap-store.js`)、実機同期(`sync-engine.js`)、全レイヤー上書き(`keymap-update.js`)
  - `render/`: DOM描画(キーボード表示・早見表・早見表/編集の切り替えボタン・レイヤー表示トグル・PNGボタン・レイヤータブ・キーコードピッカー・接続バー・ツールバー)
  - `export/`: 実機の現在のキーマップをC言語の`keymaps[][]`ソースへ変換(`c-source-writer.js`)、早見表をPNG化(`png-export.js`)
- `tests/`: DOM/WebHIDに依存しない純粋なロジック(プロトコルのバイト列、キーコードのビット合成/分解、C書き出し、状態管理)のNode単体テスト

### 生成物

- `public/generated/`: `scripts/`配下の各スクリプトが出力するデータ(`layout-{keyboardId}.js`・`keycodes.js`・`defaults-{keyboardId}.js`)。Gitのコミット対象外

### QMK側の参照ファイル

- `../qmk/keyboards/kerigokbd/`
  - `kerigokbd.h`: レイヤー・キーコードの`#define`定義
  - `kerigokbd_v{1,2}/info.json`: キー数・マトリクス配置・レイヤー数(`dynamic_keymap.layer_count`)
  - `kerigokbd_v{1,2}/keymaps/default/keymap.c`: 各レイヤーのデフォルトキー割り当て。Gitコミット履歴からLayoutバージョンも算出
  - `kerigokbd_v{1,2}/keymaps/via/via.json`: KLE互換の物理キー配置(座標・サイズ)

## 生成

QMKソースコードから`public/generated/`の各ファイルを生成する。

```sh
python3 scripts/build_layout.py
python3 scripts/build_keycodes.py
python3 scripts/build_defaults.py
```

## プレビュー

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory public
```

`http://127.0.0.1:8000/`を、WebHID対応ブラウザ(Chrome/Edge)で開く。「実機に接続」から`via`キーマップを書き込んだ実機を選択する。

## テスト

```sh
node --test tests/*.test.js
```

プロトコルのバイト列とキーコードのビット演算は、`kerigokbd_v2`の実際のキーマップ(`KG_ESC = LT(KGL_EXT, KC_ESC)`など)から逆算した値を正解データとしてテストしている。

## 既知の制限

- キーコードピッカーから新規に**LT(レイヤー+タップキー)・MT(モッドタップ)を組み立てるUIは未実装**。既存の割り当てのデコード表示・C書き出しには対応済み。レイヤー切り替え(MO/TO/DF/TG)は編集可能。
- 「keymap.cへ書き出し」機能は、モッドの組み合わせを`LCS()`のような専用マクロではなく`C(S(...))`のようなネストで出力し、GUIのモッドタップは`LWIN_T()`ではなく`LGUI_T()`で出力する(どちらも生成されるキーコード値は同一だが、表記が手書きの`keymap.c`と異なる場合がある)。
- トラックパッドが占有する2つのマトリクス位置(v2)も、他のキーと同様に通常のキーとして表示・編集できる(物理的にはスイッチが無い位置のため、実用上の意味はない)。
- 「PNGをコピー」はクリップボード書き込みAPI(`navigator.clipboard.write` + `ClipboardItem`)に対応したブラウザ・オリジン(HTTPS/localhost等のセキュアコンテキスト)でのみ動作する。未対応の場合はエラーメッセージを表示するので、「PNGをダウンロード」を使うこと。
