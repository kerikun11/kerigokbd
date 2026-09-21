# KERIgoKBD Studio

- KERIgoKBDのキーマップを、実機に接続した状態でリアルタイムに編集するWebアプリ(WebHID + QMK VIAプロトコル)。
- `../keymap_viewer`の見た目(配色・キーカードの意匠)を踏襲しつつ、実装は独立した新規コードとして構成。
- 画面は上が「レイアウト」(早見表 or 編集画面)、下が「設定」(キーボード選択・レイヤー表示切替・接続・実機操作)の縦2段構成。横幅は`../keymap_viewer`のキーボード表示と同じサイズ(`main`幅1180px)に合わせている。レイアウト側は`../keymap_viewer`が持っていた全レイヤー重ね合わせの早見表(デフォルト表示、Main/Num/Fn/Hold、トラックパッド搭載機種はTrackpadレイヤーも1キーに重ねて表示)と、実機の値を書き換える編集画面を、「設定」ペインの専用ボタンで切り替える。接続前はファームウェアの初期状態(`defaults-*.js`)、接続後は実機の現在の値を早見表に表示する。
- 早見表のマウス操作系ラベル(クリック・ポインタ移動・ホイール・スクロール/ズームモード・Win・十字キー)は、`../keymap_viewer`と同じ発想のアイコン(`index.html`のSVG `<symbol>`定義)で表示する。Alt・Backspace・Delete・PrScは文字で表示する。ただしExtraレイヤーのようにモッド+キーが**タップ動作そのもの**を表す箇所(例: `A(KC_1)`)は、Hold用のバッジと違いアイコン化せず`Alt+1`のようにそのまま読める形で表示する(`keycode-format.js`の`modLabelStyle`参照)。
- 画面上部のタイトルは`../keymap_viewer`同様、選択中のキーボード名(`info.json`の`keyboard_name`)に"Studio"を付けた文字列と、レイアウトバージョン(`default/keymap.c`のコミット履歴から算出、`vYYYY.MM.DDa`形式)を表示する。`<title>`タグ(ブラウザのタブ表示)は"KERIgoKBD Studio"の固定文言。
- `../keymap_viewer`の残り2機能も統合している。
  - **レイヤー表示ON/OFFトグル**: 「設定」ペインのNum/Fn/Mouseスイッチで、早見表上の該当レイヤーの重ね表示を個別に隠せる(`../keymap_viewer`の`#toggle-num`等と同じ配色・挙動)。オフにしたレイヤーは凡例からも消える。
  - **PNG保存**: 「PNGをコピー」「PNGをダウンロード」ボタンで、現在の早見表(トグルで隠したレイヤーはそのまま反映)をPNG化できる。`../keymap_viewer`はCanvas 2D APIでキー配置を手描きし直しているが、このアプリでは早見表のDOM/CSSをそのまま`<foreignObject>`入りのSVGに包んで`<canvas>`へ描画する方式を採っている(`export/png-export.js`)。画面に見えている内容をそのまま画像化するアプローチのため、手描きに比べて実装・保守コストが低い一方、フォントレンダリングなど細部が`../keymap_viewer`のPNG出力と完全一致するわけではない。

## 前提条件

- **ブラウザ**: WebHIDに対応したChromium系ブラウザ(Chrome / Edge)。Firefox / Safariは非対応。
- **ファームウェア**: `via`キーマップ(`VIA_ENABLE = yes`)を書き込んだ実機。`default`キーマップにはRAW HIDが無いため接続できない。

VIAのdynamic keymap機能は既定では4レイヤーまでしか公開しない(`quantum/dynamic_keymap.h`の`DYNAMIC_KEYMAP_LAYER_COUNT`既定値)が、KERIgoKBDの`info.json`側で`dynamic_keymap.layer_count`(v2は7、v1は6)を既に指定済みで、QMKのビルド時に`DYNAMIC_KEYMAP_LAYER_COUNT`へ自動変換される(`data/mappings/info_config.hjson`参照)。追加のファームウェア変更は不要。

## 構成

- `scripts/`
  - `build_layout.py`: QMK側の`info.json`・`via.json`から物理配置(座標・matrix)を抽出し`public/generated/layout-*.js`を生成
  - `build_keycodes.py`: QMK本体の正規キーコード定義(`data/constants/keycodes/*.hjson`)と`keymap_japanese.h`・`kerigokbd.h`からキーコード対応表を生成し`public/generated/keycodes.js`を生成
  - `build_defaults.py`: 各機種の`default/keymap.c`をレイヤーごとに数値キーコードへ解決し`public/generated/defaults-*.js`を生成(実機の変更検出・早見表の接続前表示・レイアウトバージョン表示に使用)。レイアウトバージョンは`../keymap_viewer/scripts/generate.py`の`layout_version()`と同じ方式(`keymap.c`のコミット履歴、フルクローンが必要)
- `public/`
  - `hid/`: WebHID接続(`hid-transport.js`)とVIAプロトコルのエンコード/デコード(`via-protocol.js`)
  - `keycodes/`: 数値キーコードのビット合成式(`keycode-values.js`)、デコード/エンコード(`keycode-codec.js`)、表示用ラベル(`keycode-format.js`)、対応表(`keycode-registry.js`)、早見表用の複数レイヤー重ね合わせラベル(`cheat-sheet-labels.js`)とマウス操作アイコンの対応表(`cheat-sheet-icons.js`)
  - `layout/`: 生成済み物理配置の読み込み
  - `state/`: 状態管理(`keymap-store.js`)と実機同期(`sync-engine.js`)
  - `render/`: DOM描画(キーボード表示・早見表・編集/早見表の切り替えボタン・レイヤー表示トグル・PNGボタン・レイヤータブ・キーコードピッカー・接続バー・ツールバー)
  - `export/`: 実機の現在のキーマップをC言語の`keymaps[][]`ソースへ変換(`c-source-writer.js`)、早見表をPNG化(`png-export.js`)
- `tests/`: 上記のうちDOM/WebHIDに依存しない純粋なロジック(プロトコルのバイト列、キーコードのビット合成/分解、C書き出し)のNode単体テスト

## 生成

```sh
python3 scripts/build_layout.py
python3 scripts/build_keycodes.py
python3 scripts/build_defaults.py
```

## テスト

```sh
node --test tests/*.test.js
```

プロトコルのバイト列とキーコードのビット演算は、`kerigokbd_v2`の実際のキーマップ(`KG_ESC = LT(KGL_EXT, KC_ESC)`など)から逆算した値を正解データとしてテストしている。

## プレビュー

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory public
```

`http://127.0.0.1:8000/`を、WebHID対応ブラウザ(Chrome/Edge)で開く。「実機に接続」から`via`キーマップを書き込んだ実機を選択する。

## 既知の制限

- キーコードピッカーから新規に**LT(レイヤー+タップキー)・MT(モッドタップ)を組み立てるUIは未実装**。既存の割り当てのデコード表示・C書き出しには対応済み。レイヤー切り替え(MO/TO/DF/TG)は編集可能。
- 「keymap.cへ書き出し」機能は、モッドの組み合わせを`LCS()`のような専用マクロではなく`C(S(...))`のようなネストで出力し、GUIのモッドタップは`LWIN_T()`ではなく`LGUI_T()`で出力する(どちらも生成されるキーコード値は同一だが、表記が手書きの`keymap.c`と異なる場合がある)。
- トラックパッドが占有する2つのマトリクス位置(v2)も、他のキーと同様に通常のキーとして表示・編集できる(物理的にはスイッチが無い位置のため、実用上の意味はない)。
- 「PNGをコピー」はクリップボード書き込みAPI(`navigator.clipboard.write` + `ClipboardItem`)に対応したブラウザ・オリジン(HTTPS/localhost等のセキュアコンテキスト)でのみ動作する。未対応の場合はエラーメッセージを表示するので、「PNGをダウンロード」を使うこと。

## mainの最新版レイアウトへの更新

編集欄の「最新版レイアウトに更新」は、選択した機種の`keymaps/default/keymap.c`を数値化したデータ(`scripts/build_defaults.py`が生成し、このページ自身にバンドルされている`public/generated/defaults-{keyboardId}.js`)で、実機の全レイヤーを上書きします。ページを開いた時点でのチェックしていた早見表(デフォルトレイアウト)と同じデータなので、更新のために別途どこかへ取得しにいくことはありません。ポップアップで内容を確認してから実行します。「ファームウェア初期状態にリセット」は従来どおり、実機のファームウェアに組み込まれた初期値に戻す操作です。

- レイヤー数が実機のファームウェアが報告する数と一致しない場合は書き込みません(ファームウェアが古く、mainで追加された新しいレイヤーに未対応な場合など)。ファームウェア自体は更新しません。
- 更新前に実機の値を保存し、書き込み後に再読込して照合します。失敗時は元の値への復元を試み、USB切断などで復元できない場合はその旨を表示します。書き込みはEEPROMへ順次反映されるため、全体を一度に切り替える操作ではありません。
- 更新中は編集・再読込・リセットなどの操作を無効にします。ファームウェア初期値との比較基準は変更しません。
