// SPDX-License-Identifier: GPL-2.0-or-later
#include "test_common.hpp"
extern "C" {
#include "kerigokbd.h"
#include "keymap_introspection.h"
}
using testing::InSequence;
class Wcad : public TestFixture {};

TEST_F(Wcad, TapSendsCtrlAltDeleteAndReleasesModifiers) {
    TestDriver driver;
    InSequence sequence;
    auto key = KeymapKey(0, 0, 0, KG_WCAD);
    set_keymap({key});
    EXPECT_REPORT(driver, (KC_LCTL, KC_LALT));
    EXPECT_REPORT(driver, (KC_LCTL, KC_LALT, KC_DEL));
    EXPECT_REPORT(driver, (KC_LCTL, KC_LALT));
    EXPECT_EMPTY_REPORT(driver);
    tap_key(key);
    EXPECT_EQ(get_mods(), 0);
    EXPECT_EQ(get_weak_mods(), 0);
    // The storage provider still reports the public VIA code.
    EXPECT_EQ(keycode_at_keymap_location(0, 0, 0), KG_WCAD);
}

TEST_F(Wcad, HoldSendsOnlyWinAndReleasesIt) {
    TestDriver driver;
    InSequence sequence;
    auto key = KeymapKey(0, 0, 0, KG_WCAD);
    set_keymap({key});
    EXPECT_REPORT(driver, (KC_LGUI));
    EXPECT_EMPTY_REPORT(driver);
    key.press();
    idle_for(TAPPING_TERM + 1);
    key.release();
    run_one_scan_loop();
    EXPECT_EQ(get_mods(), 0);
}

TEST_F(Wcad, OtherKeyPressMakesWinChord) {
    TestDriver driver;
    InSequence sequence;
    auto key = KeymapKey(0, 0, 0, KG_WCAD);
    auto letter = KeymapKey(0, 1, 0, KC_E);
    set_keymap({key, letter});
    EXPECT_REPORT(driver, (KC_LGUI));
    EXPECT_REPORT(driver, (KC_LGUI, KC_E));
    EXPECT_REPORT(driver, (KC_LGUI));
    EXPECT_EMPTY_REPORT(driver);
    key.press();
    run_one_scan_loop();
    tap_key(letter);
    key.release();
    run_one_scan_loop();
}

TEST_F(Wcad, LayerChangeDuringHoldStillReleasesWin) {
    TestDriver driver;
    InSequence sequence;
    auto key = KeymapKey(0, 0, 0, KG_WCAD);
    auto other = KeymapKey(1, 0, 0, KC_A);
    set_keymap({key, other});
    EXPECT_REPORT(driver, (KC_LGUI));
    EXPECT_EMPTY_REPORT(driver);
    key.press();
    idle_for(TAPPING_TERM + 1);
    layer_on(1);
    key.release();
    run_one_scan_loop();
    EXPECT_EQ(get_mods(), 0);
}

TEST_F(Wcad, OrdinaryWinF24AndWinDeleteRemainUnchanged) {
    TestDriver driver;
    InSequence sequence;
    auto f24 = KeymapKey(0, 0, 0, LGUI_T(KC_F24));
    auto del = KeymapKey(0, 1, 0, LGUI_T(KC_DEL));
    set_keymap({f24, del});
    EXPECT_REPORT(driver, (KC_F24));
    EXPECT_EMPTY_REPORT(driver);
    EXPECT_REPORT(driver, (KC_DEL));
    EXPECT_EMPTY_REPORT(driver);
    tap_key(f24);
    idle_for(TAPPING_TERM + 1);
    tap_key(del);
}

TEST_F(Wcad, TapPreservesAlreadyHeldCtrl) {
    TestDriver driver;
    InSequence sequence;
    auto ctrl = KeymapKey(0, 1, 0, KC_LCTL);
    auto key = KeymapKey(0, 0, 0, KG_WCAD);
    set_keymap({key, ctrl});
    EXPECT_REPORT(driver, (KC_LCTL));
    EXPECT_REPORT(driver, (KC_LCTL, KC_LALT));
    EXPECT_REPORT(driver, (KC_LCTL, KC_LALT, KC_DEL));
    EXPECT_REPORT(driver, (KC_LCTL, KC_LALT));
    EXPECT_REPORT(driver, (KC_LCTL));
    EXPECT_EMPTY_REPORT(driver);
    ctrl.press();
    run_one_scan_loop();
    tap_key(key);
    EXPECT_EQ(get_mods(), MOD_BIT(KC_LCTL));
    ctrl.release();
    run_one_scan_loop();
}

TEST_F(Wcad, WcadAndOrdinaryWinDeleteCanBeTappedAlternately) {
    TestDriver driver;
    InSequence sequence;
    auto wcad = KeymapKey(0, 0, 0, KG_WCAD);
    auto del = KeymapKey(0, 1, 0, LGUI_T(KC_DEL));
    set_keymap({wcad, del});
    EXPECT_REPORT(driver, (KC_DEL));
    EXPECT_EMPTY_REPORT(driver);
    EXPECT_REPORT(driver, (KC_LCTL, KC_LALT));
    EXPECT_REPORT(driver, (KC_LCTL, KC_LALT, KC_DEL));
    EXPECT_REPORT(driver, (KC_LCTL, KC_LALT));
    EXPECT_EMPTY_REPORT(driver);
    EXPECT_REPORT(driver, (KC_DEL));
    EXPECT_EMPTY_REPORT(driver);
    tap_key(del);
    tap_key(wcad);
    tap_key(del);
}

TEST_F(Wcad, OrdinaryWinDeleteStillTapsDeleteWhileWcadIsHeld) {
    TestDriver driver;
    InSequence sequence;
    auto wcad = KeymapKey(0, 0, 0, KG_WCAD);
    auto del = KeymapKey(0, 1, 0, LGUI_T(KC_DEL));
    set_keymap({wcad, del});
    EXPECT_REPORT(driver, (KC_LGUI));
    EXPECT_REPORT(driver, (KC_LGUI, KC_DEL));
    EXPECT_REPORT(driver, (KC_LGUI));
    EXPECT_EMPTY_REPORT(driver);
    wcad.press();
    idle_for(TAPPING_TERM + 1);
    tap_key(del);
    wcad.release();
    run_one_scan_loop();
}

TEST_F(Wcad, OrdinaryWinDeleteHoldsWinWithWcadAlsoAssigned) {
    TestDriver driver;
    InSequence sequence;
    auto wcad = KeymapKey(0, 0, 0, KG_WCAD);
    auto del = KeymapKey(0, 1, 0, LGUI_T(KC_DEL));
    set_keymap({wcad, del});
    EXPECT_REPORT(driver, (KC_LGUI));
    EXPECT_EMPTY_REPORT(driver);
    del.press();
    idle_for(TAPPING_TERM + 1);
    del.release();
    run_one_scan_loop();
}
