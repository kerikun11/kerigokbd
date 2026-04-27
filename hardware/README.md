# Hardware

KERIgoKBD のハードウェア設計データ。ここでは PCB、ケースなどの物理パーツを作品ごとに分離して管理する。

## 対応表

| 作品                                      | PCB                                         | ケース                                                          | ファームウェア                                                     | メモ                     |
| :---------------------------------------- | :------------------------------------------ | :-------------------------------------------------------------- | :----------------------------------------------------------------- | :----------------------- |
| [KERIgoKBD v1](./kerigokbd/kerigokbd_v1/) | [`pcb_20260222`](./kerigokbd/pcb_20260222/) | [`case_20260222`](./kerigokbd/case_20260222/)                   | [`kerigokbd_v1`](../software/qmk/keyboards/kerigokbd/kerigokbd_v1) | 標準構成                 |
| [KERIgoKBD v2](./kerigokbd/kerigokbd_v2/) | [`pcb_20260222`](./kerigokbd/pcb_20260222/) | [`case_20260222_trackpad`](./kerigokbd/case_20260222_trackpad/) | [`kerigokbd_v2`](../software/qmk/keyboards/kerigokbd/kerigokbd_v2) | 右手にトラックパッド追加 |

## KERIgoKBD パーツ

### PCB

| パーツ                                      | 内容                                   |
| :------------------------------------------ | :------------------------------------- |
| [`pcb_20241229`](./kerigokbd/pcb_20241229/) | v1.0 初版。I2Cピンアサインにミスあり。 |
| [`pcb_20250208`](./kerigokbd/pcb_20250208/) | v1.1 I2Cピンアサイン修正版。           |
| [`pcb_20260222`](./kerigokbd/pcb_20260222/) | v1.2 小型版。v1/v2 共通 PCB。          |

### ケース

| パーツ                                                          | 内容                                      |
| :-------------------------------------------------------------- | :---------------------------------------- |
| [`case_20250208`](./kerigokbd/case_20250208/)                   | PCB v1.0 と v1.1 向けのケース。           |
| [`case_20260222`](./kerigokbd/case_20260222/)                   | PCB v1.2 向けケース。                     |
| [`case_20260222_trackpad`](./kerigokbd/case_20260222_trackpad/) | PCB v1.2 向け、トラックパッド対応ケース。 |

## その他

- [`kerigokbd_corne_v4`](./kerigokbd_corne_v4/) は Corne V4 Chocolate のカスタムケース。
