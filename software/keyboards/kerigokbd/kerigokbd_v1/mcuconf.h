// Copyright 2025 KERI's Lab
// SPDX-License-Identifier: GPL-2.0-or-later
// mcuconf.h

#pragma once

#include_next <mcuconf.h>

#undef RP_I2C_USE_I2C0
#define RP_I2C_USE_I2C0 TRUE
