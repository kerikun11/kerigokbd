# KERIgoKBD v1

[![CC BY-NC 4.0](https://licensebuttons.net/l/by-nc/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc/4.0/deed.ja)

KERI's Ergonomic Keyboard Version 1

![KERIgoKBD v1](./images/kerigokbd_v1.jpg)

## リンク集

- [KERIgoKBD v1 - Remap](https://remap-keys.app/catalog/8pqWZfIyb0UqzhvSmsgh/keymap?id=7BYIomuRTYIakkXWYzAK)
- [KERIgoKBD v1 - Keyboard Layout Editor](https://www.keyboard-layout-editor.com/#/gists/ef55d575836d948b814d1c28ccc5c396)
- [KERIgoKBD v1 - Firmware](../../software/keyboards/kerigokbd/kerigokbd_v1/)

## スペック

| 項目             | 内容                                                                                                                |
| :--------------- | :------------------------------------------------------------------------------------------------------------------ |
| マイコン         | [RP2040](https://www.raspberrypi.com/products/rp2040/specifications/) (Cortex-M0+ 133MHz x2, 264kB SRAM)            |
| フラッシュ       | [W25Q16JVUXIQ](https://www.digikey.jp/ja/products/detail/winbond-electronics/W25Q16JVUXIQ-TR/) (2MB)                |
| キースイッチ     | [Kailh Deep Sea Silent Mini Low Profile Key Switch (Linear)](https://www.aliexpress.com/item/1005007364820059.html) |
| キーキャップ     | [NuPhy nSA Keycaps (Shine-through White)](https://www.aliexpress.com/item/1005006384968360.html)                    |
| 左右接続ケーブル | [10cm 3.5mm AUX Cable (White 3 Pole)](https://www.aliexpress.com/item/1005002484746676.html)                        |
| 滑り止めシート   | [GRIPLUS ホワイト フリーカット](http://www.amazon.co.jp/dp/B08XHMGPWW/)                                             |
| USBケーブル      | [USLION Magnetic USB Type-C ケーブル](https://www.aliexpress.com/item/1005006136597761.html)                        |

## レイアウト

けりの手の形状に合わせた独自レイアウト

- 左右分離（左右それぞれ24キーで合計48キー）
- 数字キーのない40%レイアウト
- 左右に4つずつの親指キー
- 中央に2つずつの追加キー
- 全キーにRGBバックライトLED

[KERIgoKBD v1 - Keyboard Layout Editor](https://www.keyboard-layout-editor.com/#/gists/ef55d575836d948b814d1c28ccc5c396)
![KERIgoKBD v1](./images/kerigokbd_v1_top.jpg)

## 基板

KiCadで設計。JLCPCBに発注。左右分離の各基板をひとつの基板の両面で兼用して基板発注コストを抑えた。

- 設計データ：[pcb](./pcb/)

![KERIgoKBD v1 Sketch](./pcb/kerigokbd.svg)
![KERIgoKBD v1 PCB](./images/kerigokbd_v1_pcb.jpg)

## ケース

Autodesk Fusionで設計。Bambu Lab P1S PLA White Marbleで印刷。

- 設計データ：[case](./case/)

![KERIgoKBD v1 Case Top](./images/kerigokbd_v1_case_top.jpg)
![KERIgoKBD v1 Case Bottom](./images/kerigokbd_v1_case_bottom.jpg)

## ファームウェア

オープンソースプロジェクト[QMK Firmware](https://docs.qmk.fm/)のキーボードとして実装。Remapに対応。

- ソースコード: [kerigokbd_v1](../../software/keyboards/kerigokbd/kerigokbd_v1/)

## ライセンス

この作品は[クリエイティブ・コモンズ 表示-非営利 4.0 国際 ライセンス](https://creativecommons.org/licenses/by-nc/4.0/deed.ja)の下に提供されている。

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).
