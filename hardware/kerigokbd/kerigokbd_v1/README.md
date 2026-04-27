# KERIgoKBD v1 Hardware

[![CC BY-NC 4.0](https://licensebuttons.net/l/by-nc/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc/4.0/deed.ja)

けりの人間工学キーボード第1版のハードウェア構成。

![KERIgoKBD v1](./images/kerigokbd_v1.jpg)

## 構成

| 項目                   | 使用パーツ                                                                                                               |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| PCB                    | [`pcb_20260222`](../pcb_20260222/)                                                                                       |
| ケース                 | [`case_20260222`](../case_20260222/)                                                                                     |
| ファームウェア         | [`kerigokbd/kerigokbd_v1/pcb_20260222`](../../../software/qmk/keyboards/kerigokbd/kerigokbd_v1/pcb_20260222/)            |
| Remap                  | [KERIgoKBD v1 - Remap](https://remap-keys.app/catalog/8pqWZfIyb0UqzhvSmsgh/keymap?id=RpLYgWmZ0A9D40j9Gvdv)               |
| Keyboard Layout Editor | [KERIgoKBD v1 - Keyboard Layout Editor](https://www.keyboard-layout-editor.com/#/gists/e9041aa9a964c55f5b5cef199f9d24c8) |

## PCB 履歴

| PCB                                | 内容                                                                         |
| :--------------------------------- | :--------------------------------------------------------------------------- |
| [`pcb_20241229`](../pcb_20241229/) | v1.0 初版。I2Cピンアサインにミスあり。I2C不使用なら問題なし。                |
| [`pcb_20250208`](../pcb_20250208/) | v1.1 I2Cピンアサインを修正。                                                 |
| [`pcb_20260222`](../pcb_20260222/) | v1.2 小型化版。マイコンのピンアサインに変更はないが、TRSピンアサインを変更。 |

## スペック

| 項目             | 内容                                                                                                                |
| :--------------- | :------------------------------------------------------------------------------------------------------------------ |
| マイコン         | [RP2040](https://www.raspberrypi.com/products/rp2040/specifications/) (Cortex-M0+ 133MHz x2, 264kB SRAM)            |
| フラッシュ       | [W25Q16JVUXIQ](https://www.digikey.jp/ja/products/detail/winbond-electronics/W25Q16JVUXIQ-TR/) (2MB)                |
| キースイッチ     | [Kailh Deep Sea Silent Mini Low Profile Key Switch (Linear)](https://www.aliexpress.com/item/1005007364820059.html) |
| キーキャップ     | [NuPhy nSA Keycaps (Shine-through White)](https://www.aliexpress.com/item/1005006384968360.html)                    |
| キーソケット     | [Hot Swap Socket for Kailh 1350 Chocolate](https://www.aliexpress.com/item/1005006610157756.html)                   |
| 左右接続ケーブル | [3.5mm AUX Cable (White 3 Pole 10cm)](https://www.aliexpress.com/item/1005002484746676.html)                        |
| USBケーブル      | [USLION Magnetic USB Type-C ケーブル](https://www.aliexpress.com/item/1005006136597761.html)                        |
| 滑り止めシート   | [GRIPLUS ホワイト フリーカット](http://www.amazon.co.jp/dp/B08XHMGPWW/)                                             |

## レイアウト

- 左右分離
- 左右それぞれ24キー、合計48キー
- 数字キーのない40%レイアウト
- 左右に4つずつの親指キー
- 中央に2つずつの追加キー
- 全キーに RGB バックライト LED

![KERIgoKBD v1 Top](./images/kerigokbd_v1_top.jpg)

## ライセンス

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).
