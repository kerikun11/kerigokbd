// Japanese one-line explanations of what a keycode does, shown under the
// selected key in the edit view's picker. Key labels (keycode-format.js)
// stay short enough to fit a key cap; this is where "CIRC" gets spelled out
// as 「^」, "MHEN" as 無変換, "▽" as 下のレイヤーと同じ, and so on.
//
// Basic keys are looked up by their canonical registry symbol (JP_* wins
// over KC_* where both name the same value, since the host is set to the
// Japanese layout); composed keys (LT/MT/MO/TO/mods...) are described from
// their parts.

import { decode } from "./keycode-codec.js";
import { canonicalEntryForValue } from "./keycode-registry.js";
import { layerName } from "./keycode-format.js";

const char = (text, name) => `「${text}」(${name})`;

const DESCRIPTIONS = {
  // special
  KC_NO: "何もしない",
  KC_TRANSPARENT: "下のレイヤーと同じ",
  QK_BOOT: "ブートローダーモードに入る(ファームウェア書き込み用)",

  // Japanese layout symbols and keys
  JP_MINS: char("-", "ハイフン"),
  JP_CIRC: char("^", "キャレット"),
  JP_AT: char("@", "アットマーク"),
  JP_LBRC: char("[", "左角かっこ"),
  JP_RBRC: char("]", "右角かっこ"),
  JP_SCLN: char(";", "セミコロン"),
  JP_COLN: char(":", "コロン"),
  JP_COMM: char(",", "カンマ"),
  JP_DOT: char(".", "ピリオド"),
  JP_SLSH: char("/", "スラッシュ"),
  JP_BSLS: char("\\", "バックスラッシュ、ろキー"),
  JP_YEN: char("¥", "円記号"),
  JP_EXLM: char("!", "感嘆符"),
  JP_DQUO: char("\"", "ダブルクォーテーション"),
  JP_HASH: char("#", "シャープ"),
  JP_DLR: char("$", "ドル記号"),
  JP_PERC: char("%", "パーセント"),
  JP_AMPR: char("&", "アンパサンド"),
  JP_QUOT: char("'", "シングルクォーテーション"),
  JP_LPRN: char("(", "左かっこ"),
  JP_RPRN: char(")", "右かっこ"),
  JP_EQL: char("=", "イコール"),
  JP_TILD: char("~", "チルダ"),
  JP_GRV: char("`", "バッククォート"),
  JP_LCBR: char("{", "左波かっこ"),
  JP_RCBR: char("}", "右波かっこ"),
  JP_PLUS: char("+", "プラス"),
  JP_ASTR: char("*", "アスタリスク"),
  JP_LABK: char("<", "小なり"),
  JP_RABK: char(">", "大なり"),
  JP_QUES: char("?", "疑問符"),
  JP_UNDS: char("_", "アンダースコア"),
  JP_PIPE: char("|", "縦線"),
  JP_ZKHK: "半角/全角(IMEのオン/オフ)",
  JP_EISU: "英数(Shiftと同時でCaps Lock)",
  JP_KANA: "カタカナ/ひらがな",
  JP_HENK: "変換",
  JP_MHEN: "無変換",
  JP_CAPS: "Caps Lock(Shift+英数)",
  KC_BSLS: "USキーボードの「\\」の位置のキー(日本語配列では「]」になることが多い)",

  // editing and navigation
  KC_ENT: "Enter(改行・決定)",
  KC_ESC: "Esc(取り消し)",
  KC_BSPC: "Backspace(前の1文字を削除)",
  KC_TAB: "Tab",
  KC_SPC: "スペース",
  KC_DEL: "Delete(後ろの1文字を削除)",
  KC_CAPS: "Caps Lock",
  KC_PSCR: "Print Screen(画面キャプチャ)",
  KC_INS: "Insert(挿入/上書きの切り替え)",
  KC_HOME: "Home(行頭へ移動)",
  KC_END: "End(行末へ移動)",
  KC_PGUP: "Page Up(1画面上へ)",
  KC_PGDN: "Page Down(1画面下へ)",
  KC_LEFT: "カーソルを左へ",
  KC_RGHT: "カーソルを右へ",
  KC_UP: "カーソルを上へ",
  KC_DOWN: "カーソルを下へ",
  KC_NUM: "Num Lock",

  // numpad
  KC_PSLS: "テンキーの「/」",
  KC_PAST: "テンキーの「*」",
  KC_PMNS: "テンキーの「-」",
  KC_PPLS: "テンキーの「+」",
  KC_PENT: "テンキーのEnter",
  KC_PDOT: "テンキーの「.」",
  KC_PEQL: "テンキーの「=」",
  KC_PCMM: "テンキーの「,」",

  // media and system
  KC_PWR: "電源",
  KC_SLEP: "スリープ",
  KC_WAKE: "スリープ解除",
  KC_MUTE: "ミュート",
  KC_VOLU: "音量を上げる",
  KC_VOLD: "音量を下げる",
  KC_MNXT: "次の曲",
  KC_MPRV: "前の曲",
  KC_MSTP: "再生停止",
  KC_MPLY: "再生/一時停止",
  KC_MSEL: "メディアプレーヤーを開く",
  KC_EJCT: "イジェクト",
  KC_MAIL: "メールを開く",
  KC_CALC: "電卓を開く",
  KC_MYCM: "エクスプローラー(マイコンピューター)を開く",
  KC_WSCH: "ブラウザー: 検索",
  KC_WHOM: "ブラウザー: ホーム",
  KC_WBAK: "ブラウザー: 戻る",
  KC_WFWD: "ブラウザー: 進む",
  KC_WSTP: "ブラウザー: 読み込み中止",
  KC_WREF: "ブラウザー: 再読み込み",
  KC_WFAV: "ブラウザー: お気に入り",
  KC_MFFD: "早送り",
  KC_MRWD: "巻き戻し",
  KC_BRIU: "画面を明るく",
  KC_BRID: "画面を暗く",
  KC_CPNL: "コントロールパネルを開く",
  KC_ASST: "アシスタントを起動",
  KC_MCTL: "Mission Control(macOS)",
  KC_LPAD: "Launchpad(macOS)",

  // mouse keys
  MS_UP: "マウスカーソルを上へ",
  MS_DOWN: "マウスカーソルを下へ",
  MS_LEFT: "マウスカーソルを左へ",
  MS_RGHT: "マウスカーソルを右へ",
  MS_BTN1: "左クリック",
  MS_BTN2: "右クリック",
  MS_BTN3: "中クリック",
  MS_BTN4: "マウスの戻るボタン",
  MS_BTN5: "マウスの進むボタン",
  MS_BTN6: "マウスボタン6",
  MS_BTN7: "マウスボタン7",
  MS_BTN8: "マウスボタン8",
  MS_WHLU: "ホイールを上へ",
  MS_WHLD: "ホイールを下へ",
  MS_WHLL: "ホイールを左へ",
  MS_WHLR: "ホイールを右へ",
  MS_ACL0: "マウスキーを低速に固定",
  MS_ACL1: "マウスキーを中速に固定",
  MS_ACL2: "マウスキーを高速に固定",

  // modifiers
  KC_LCTL: "左Ctrl",
  KC_LSFT: "左Shift",
  KC_LALT: "左Alt",
  KC_LWIN: "左Win",
  KC_RCTL: "右Ctrl",
  KC_RSFT: "右Shift",
  KC_RALT: "右Alt",
  KC_RWIN: "右Win",

  // RGB lighting
  RGB_M_P: "ライト: 単色",
  RGB_M_B: "ライト: 呼吸",
  RGB_M_R: "ライト: レインボー",
  RGB_M_SW: "ライト: スワール",
  RGB_M_SN: "ライト: スネーク",
  RGB_M_K: "ライト: ナイトライダー",
  RGB_M_X: "ライト: クリスマス",
  RGB_M_G: "ライト: グラデーション",
  RGB_M_T: "ライト: テスト",
  RGB_M_TW: "ライト: きらめき",
  RM_ON: "ライトをオン",
  RM_OFF: "ライトをオフ",
  RM_TOGG: "ライトのオン/オフ",
  RM_NEXT: "ライトの次のエフェクト",
  RM_PREV: "ライトの前のエフェクト",
  RM_HUEU: "ライトの色相を進める",
  RM_HUED: "ライトの色相を戻す",
  RM_SATU: "ライトの彩度を上げる",
  RM_SATD: "ライトの彩度を下げる",
  RM_VALU: "ライトを明るく",
  RM_VALD: "ライトを暗く",
  RM_SPDU: "ライトのエフェクトを速く",
  RM_SPDD: "ライトのエフェクトを遅く",
  RM_FLGN: "ライトの点灯範囲を次へ",
  RM_FLGP: "ライトの点灯範囲を前へ",

  // KERIgoKBD (kerigokbd.h / kerigokbd.c)
  KG_WCAD: "タップでCtrl+Alt+Delete、長押しで左Win",
  KG_ATAB: "タップでAlt+Tab(ウィンドウ切り替え)、長押しで左Alt",
  KG_SCRL: "押している間、トラックパッドの移動をスクロールにする",
  KG_ZOOM: "押している間、トラックパッドの縦移動をズーム(Ctrl+ホイール)にする",
  KG_MSL: "マウスカーソルを左へ(Trackpadレイヤーに入らない)",
  KG_MSD: "マウスカーソルを下へ(Trackpadレイヤーに入らない)",
  KG_MSU: "マウスカーソルを上へ(Trackpadレイヤーに入らない)",
  KG_MSR: "マウスカーソルを右へ(Trackpadレイヤーに入らない)",
  KG_MWLL: "ホイールを左へ(Trackpadレイヤーに入らない)",
  KG_MWLD: "ホイールを下へ(Trackpadレイヤーに入らない)",
  KG_MWLU: "ホイールを上へ(Trackpadレイヤーに入らない)",
  KG_MWLR: "ホイールを右へ(Trackpadレイヤーに入らない)",
};

const MOD_NAMES = { ctrl: "Ctrl", shift: "Shift", alt: "Alt", gui: "Win" };

function modsDescription(mods) {
  const side = mods.right ? "右" : "左";
  return Object.keys(MOD_NAMES).filter((key) => mods[key]).map((key) => `${side}${MOD_NAMES[key]}`).join("+");
}

function basicDescription(value) {
  const entry = canonicalEntryForValue(value);
  if (!entry) return null;
  if (DESCRIPTIONS[entry.symbol]) return DESCRIPTIONS[entry.symbol];
  const fn = /^KC_F(\d+)$/.exec(entry.symbol);
  if (fn) return `ファンクションキーF${fn[1]}`;
  const digit = /^KC_P(\d)$/.exec(entry.symbol);
  if (digit) return `テンキーの「${digit[1]}」`;
  return null; // letters and digits: the label already says it all
}

const layer = (index) => `${layerName(index)}レイヤー`;

// The tap half of a composed key: its description, else its plain label ("A").
const tapDescription = (keycode) => basicDescription(keycode) ?? canonicalEntryForValue(keycode)?.label ?? "キー入力";

/** One-line Japanese explanation of `value`, or null when there's nothing to add. */
export function keycodeDescription(value) {
  if (value === undefined) return null;
  const registered = basicDescription(value);
  if (registered) return registered;
  const descriptor = decode(value);
  switch (descriptor.kind) {
    case "layerTap":
      return `タップで${tapDescription(descriptor.keycode)}、長押しで${layer(descriptor.layer)}`;
    case "modTap":
      return `タップで${tapDescription(descriptor.keycode)}、長押しで${modsDescription(descriptor.mods)}`;
    case "mods":
      return `${modsDescription(descriptor.mods)}を押しながら${tapDescription(descriptor.keycode)}`;
    case "momentaryLayer":
      return `押している間だけ${layer(descriptor.layer)}`;
    case "toLayer":
      return `${layer(descriptor.layer)}に切り替える(押し続けなくてよい)`;
    case "defaultLayer":
      return `基本のレイヤーを${layer(descriptor.layer)}に変更する`;
    case "toggleLayer":
      return `${layer(descriptor.layer)}のオン/オフを切り替える`;
    case "oneShotLayer":
      return `次の1キーだけ${layer(descriptor.layer)}`;
    default:
      return null;
  }
}
