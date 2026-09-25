// SPDX-License-Identifier: GPL-2.0-or-later
#include "test_common.hpp"
extern "C" {
#include "kerigokbd.h"
#include "keymap_introspection.h"
}
using testing::InSequence;
class AltTab : public TestFixture {};

TEST_F(AltTab, TapSendsAltTabAndReleasesAlt) {
    TestDriver driver;
    InSequence sequence;
    auto key = KeymapKey(0, 0, 0, KG_ATAB);
    set_keymap({key});
    EXPECT_REPORT(driver, (KC_LALT));
    EXPECT_REPORT(driver, (KC_LALT, KC_TAB));
    EXPECT_REPORT(driver, (KC_LALT));
    EXPECT_EMPTY_REPORT(driver);
    tap_key(key);
    EXPECT_EQ(get_mods(), 0);
    EXPECT_EQ(get_weak_mods(), 0);
    EXPECT_EQ(keycode_at_keymap_location(0, 0, 0), KG_LALT_T_LALT_TAB);
}

TEST_F(AltTab, HoldSendsOnlyAltAndReleasesItAfterLayerChange) {
    TestDriver driver;
    InSequence sequence;
    auto key = KeymapKey(0, 0, 0, KG_ATAB);
    auto other = KeymapKey(1, 0, 0, KC_A);
    set_keymap({key, other});
    EXPECT_REPORT(driver, (KC_LALT));
    EXPECT_EMPTY_REPORT(driver);
    key.press();
    idle_for(TAPPING_TERM + 1);
    layer_on(1);
    key.release();
    run_one_scan_loop();
    EXPECT_EQ(get_mods(), 0);
}

TEST_F(AltTab, OtherKeyPressMakesAltChordWithoutTab) {
    TestDriver driver;
    InSequence sequence;
    auto key = KeymapKey(0, 0, 0, KG_ATAB);
    auto letter = KeymapKey(0, 1, 0, KC_E);
    set_keymap({key, letter});
    EXPECT_REPORT(driver, (KC_LALT));
    EXPECT_REPORT(driver, (KC_LALT, KC_E));
    EXPECT_REPORT(driver, (KC_LALT));
    EXPECT_EMPTY_REPORT(driver);
    key.press();
    run_one_scan_loop();
    tap_key(letter);
    key.release();
    run_one_scan_loop();
}

TEST_F(AltTab, OrdinaryAltTabModTapStillTapsPlainTab) {
    TestDriver driver;
    InSequence sequence;
    auto custom = KeymapKey(0, 0, 0, KG_ATAB);
    auto ordinary = KeymapKey(0, 1, 0, LALT_T(KC_TAB));
    set_keymap({custom, ordinary});
    EXPECT_REPORT(driver, (KC_TAB));
    EXPECT_EMPTY_REPORT(driver);
    EXPECT_REPORT(driver, (KC_LALT));
    EXPECT_REPORT(driver, (KC_LALT, KC_TAB));
    EXPECT_REPORT(driver, (KC_LALT));
    EXPECT_EMPTY_REPORT(driver);
    EXPECT_REPORT(driver, (KC_TAB));
    EXPECT_EMPTY_REPORT(driver);
    tap_key(ordinary);
    tap_key(custom);
    tap_key(ordinary);
}

TEST_F(AltTab, RepeatedTapsEachReleaseAlt) {
    TestDriver driver;
    InSequence sequence;
    auto key = KeymapKey(0, 0, 0, KG_ATAB);
    set_keymap({key});
    for (int i = 0; i < 2; ++i) {
        EXPECT_REPORT(driver, (KC_LALT));
        EXPECT_REPORT(driver, (KC_LALT, KC_TAB));
        EXPECT_REPORT(driver, (KC_LALT));
        EXPECT_EMPTY_REPORT(driver);
    }
    tap_key(key);
    tap_key(key);
    EXPECT_EQ(get_mods(), 0);
    EXPECT_EQ(get_weak_mods(), 0);
}

TEST_F(AltTab, TapPreservesPhysicallyHeldAlt) {
    TestDriver driver;
    InSequence sequence;
    auto alt = KeymapKey(0, 1, 0, KC_LALT);
    auto key = KeymapKey(0, 0, 0, KG_ATAB);
    set_keymap({key, alt});
    EXPECT_REPORT(driver, (KC_LALT));
    EXPECT_REPORT(driver, (KC_LALT, KC_TAB));
    EXPECT_REPORT(driver, (KC_LALT));
    EXPECT_EMPTY_REPORT(driver);
    alt.press();
    run_one_scan_loop();
    tap_key(key);
    EXPECT_EQ(get_mods(), MOD_BIT(KC_LALT));
    alt.release();
    run_one_scan_loop();
}
