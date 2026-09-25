# KERIgoKBD

KERI's Ergonomic Keyboard

* Keyboard Maintainer: [kerikun11](https://github.com/kerikun11)
* Hardware Supported:
  * [KERIgoKBD v1](../../../../hardware/kerigokbd/kerigokbd_v1/)
  * [KERIgoKBD v2](../../../../hardware/kerigokbd/kerigokbd_v2/)
  * [Corne V4 Chocolate](https://github.com/foostan/crkbd)
  * [Keyball44](https://github.com/Yowkees/keyball) with RP2040 Pro Micro

Make example for this keyboard (after setting up your build environment):

    make kerigokbd/kerigokbd_v1/pcb_20260222:default

    make kerigokbd/kerigokbd_v2/pcb_20260222:default

    make kerigokbd/kerigokbd_corne_v4:default

    make kerigokbd/keyball44rp:default

Flashing example for this keyboard:

    make kerigokbd/kerigokbd_v1/pcb_20260222:default:flash

    make kerigokbd/kerigokbd_v2/pcb_20260222:default:flash

    make kerigokbd/kerigokbd_corne_v4:default:flash

    make kerigokbd/keyball44rp:default:flash

See the [build environment setup](https://docs.qmk.fm/#/getting_started_build_tools) and the [make instructions](https://docs.qmk.fm/#/getting_started_make_guide) for more information. Brand new to QMK? Start with our [Complete Newbs Guide](https://docs.qmk.fm/#/newbs).

## Bootloader

Enter the bootloader in 3 ways:

* **Bootmagic reset**: Hold down the key at Q or P and plug in the keyboard
* **Keycode in layout**: Press the key mapped to `QK_BOOT` if it is available

## KG_WCAD（Win / Ctrl+Alt+Delete）

`KG_LWIN_T_LCTL_LALT_DEL`（別名 `KG_WCAD`、`QK_KB_0`、現在の値は `0x7E00`）は、タップで Ctrl+Alt+Delete、
ホールドで左 Win を送信する。`TAPPING_TERM` や `HOLD_ON_OTHER_KEY_PRESS` は
通常の QMK Mod-Tap と同じ設定が適用される。別のキーを押すとホールド判定になる。

- ファームウェア更新後、VIA の Design タブで対象機種の `keymaps/via/via.json` を読み込み、
  Custom の `KG_WCAD` を任意のキーに割り当てる。Any で `0x7E00` を入力してもよい。
- KERIgoKBD Studio では `KG_WCAD`（Win/CAD）を選ぶ。既存のキー配置は自動変更しない。
- タップ内容は固定。VIA マクロの内容には依存しない。
- 保存値は `QK_KB_0` のまま維持する。内部の Mod-Tap 表現を VIA に登録する必要はない。

実装は共通の `kerigokbd.c` に置く。モデル固有のキー処理を追加する場合は
`process_record_kerigokbd()` を使い、`process_record_kb()` は共通処理に任せる。

回帰テスト（`software/qmk/firmware` で実行）:

```sh
make test:all TEST_LIST=../tests/wcad
```

## KG_ATAB（Alt / Alt+Tab）

`KG_LALT_T_LALT_TAB`（別名 `KG_ATAB`、`QK_KB_1`、`0x7E01`）は、
タップで Alt+Tab、ホールドで左 Alt を送信する。タップごとに Alt も離すため、
ウィンドウ切り替えを1回ずつ行う。切り替え一覧を保持するタイマー処理はない。

更新した VIA 定義の Custom または Studio で `KG_ATAB` を選択する。
VIA の Any では `0x7E01` を使える。既存のキー配置は自動変更しない。
`TAPPING_TERM` と `HOLD_ON_OTHER_KEY_PRESS` は通常の Mod-Tap と同じ設定を使う。

## カスタムキーコードの番号

| 範囲 | 用途 |
|---|---|
| `QK_KB_0` | `KG_WCAD` |
| `QK_KB_1` | `KG_ATAB` |
| `QK_KB_2`〜`QK_KB_9` | 予約 |
| `QK_KB_10`〜`QK_KB_11` | スクロール／ズーム |
| `QK_KB_12`〜`QK_KB_19` | AutoMouseLayerへ入らないマウス移動／ホイール |

旧番号との互換性・自動移行はない。更新時は保存済みのカスタムキーを再割り当てする。
