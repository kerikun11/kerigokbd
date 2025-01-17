# KERIgoKBD v1

KERI's Ergonomic Keyboard Version 1

![KERIgoKBD v1](../../software/keyboards/kerigokbd/kerigokbd_v1/images/kerigokbd_v1_projection.jpg)

## レイアウト

![KERIgoKBD v1](../../software/keyboards/kerigokbd/kerigokbd_v1/images/kerigokbd_v1_top.jpg)

## スペック

| 項目             | 内容                                                                                                                |
| :--------------- | :------------------------------------------------------------------------------------------------------------------ |
| マイコン         | [RP2040](https://www.raspberrypi.com/products/rp2040/specifications/) (Dual Cortex-M0+ 133MHz 264kB)                |
| フラッシュ       | W25Q16JVUXIQ (2MB)                                                                                                  |
| キー数           | 48 (24 + 24)                                                                                                        |
| キースイッチ     | [Kailh Deep Sea Silent Mini Low Profile Key Switch (Linear)](https://www.aliexpress.com/item/1005007364820059.html) |
| キーキャップ     | [NuPhy nSA Keycaps (Shine-through White)](https://www.aliexpress.com/item/1005006384968360.html)                    |
| 左右接続ケーブル | [10cm 3.5mm AUX Cable (White 4 Pole)](https://www.aliexpress.com/item/1005002484746676.html)                        |

## 基板

KiCadで設計。JLCPCBに発注。

![KERIgoKBD v1 Sketch](./pcb/kerigokbd.svg)
![KERIgoKBD v1 PCB](./images/kerigokbd_v1_pcb.jpg)
<!-- ![KERIgoKBD v1 PCB Front](./images/kerigokbd_v1_pcb_front.jpg) -->
<!-- ![KERIgoKBD v1 PCB Back](./images/kerigokbd_v1_pcb_back.jpg) -->

## ケース

Autodesk Fusionで設計。Bambu Lab P1S PLA White Marbleで印刷。

![KERIgoKBD v1 Case Top](./images/kerigokbd_v1_case_top.jpg)
![KERIgoKBD v1 Case Bottom](./images/kerigokbd_v1_case_bottom.jpg)

## ファームウェア

QMK Firmwareに対応。

ソースコード: [kerigokbd_v1](../../software/keyboards/kerigokbd/kerigokbd_v1/)
