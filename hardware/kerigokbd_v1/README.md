# KERIgoKBD v1

KERI's Ergonomic Keyboard Version 1

![KERIgoKBD v1](../../software/keyboards/kerigokbd/kerigokbd_v1/images/kerigokbd_v1_projection.jpg)

## リンク集

- [KERIgoKBD v1 - Remap](https://remap-keys.app/catalog/8pqWZfIyb0UqzhvSmsgh/keymap?id=7BYIomuRTYIakkXWYzAK)
- [KERIgoKBD v1 - Keyboard Layout Editor](https://www.keyboard-layout-editor.com/#/gists/ef55d575836d948b814d1c28ccc5c396)

## スペック

| 項目             | 内容                                                                                                                |
| :--------------- | :------------------------------------------------------------------------------------------------------------------ |
| マイコン         | [RP2040](https://www.raspberrypi.com/products/rp2040/specifications/) (Dual Cortex-M0+ 133MHz 264kB)                |
| フラッシュ       | W25Q16JVUXIQ (2MB)                                                                                                  |
| キー数           | 48 (24 + 24)                                                                                                        |
| キースイッチ     | [Kailh Deep Sea Silent Mini Low Profile Key Switch (Linear)](https://www.aliexpress.com/item/1005007364820059.html) |
| キーキャップ     | [NuPhy nSA Keycaps (Shine-through White)](https://www.aliexpress.com/item/1005006384968360.html)                    |
| 左右接続ケーブル | [10cm 3.5mm AUX Cable (White 3 Pole)](https://www.aliexpress.com/item/1005002484746676.html)                        |
| USBコネクタ      | Type-C                                                                                                              |

## レイアウト

- 左右分離
- 左右それぞれ3行6列の40%レイアウト
- 親指キー4つずつ
- 中央に追加キー2つずつ

![KERIgoKBD v1](../../software/keyboards/kerigokbd/kerigokbd_v1/images/kerigokbd_v1_top.jpg)

## 基板

KiCadで設計。JLCPCBに発注。左右分離の各基板をひとつの基板の両面で兼用することで基板発注コストを抑えた。

- 設計データ：[pcb](./pcb/)

![KERIgoKBD v1 Sketch](./pcb/kerigokbd.svg)
![KERIgoKBD v1 PCB](./images/kerigokbd_v1_pcb.jpg)
<!-- ![KERIgoKBD v1 PCB Front](./images/kerigokbd_v1_pcb_front.jpg) -->
<!-- ![KERIgoKBD v1 PCB Back](./images/kerigokbd_v1_pcb_back.jpg) -->

## ケース

Autodesk Fusionで設計。Bambu Lab P1S PLA White Marbleで印刷。

- 設計データ：[case](./case/)

![KERIgoKBD v1 Case Top](./images/kerigokbd_v1_case_top.jpg)
![KERIgoKBD v1 Case Bottom](./images/kerigokbd_v1_case_bottom.jpg)

## ファームウェア

QMK Firmwareに対応。

- ソースコード: [kerigokbd_v1](../../software/keyboards/kerigokbd/kerigokbd_v1/)
