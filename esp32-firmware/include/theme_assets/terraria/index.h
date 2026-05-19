// Terraria sprite 主索引
// 不要手改; 由 uniapp/tools/build-firmware-sprites.js 生成
#pragma once

#include "terraria_sprite_types.h"
#include "sprites_armor_heads.h"
#include "sprites_armor_bodies.h"
#include "sprites_armor_legs.h"
#include "sprites_wings.h"
#include "sprites_weapons.h"
#include "sprites_player_layers.h"
#include "sprites_guardian.h"
#include "sprites_misc.h"

namespace TerrariaSprites {

inline const TerrariaSprite* getArmorHead(uint16_t id) {
  switch (id) {
    case 169: return &kArmorHead_169;
    case 170: return &kArmorHead_170;
    case 171: return &kArmorHead_171;
    case 189: return &kArmorHead_189;
    case 157: return &kArmorHead_157;
    case 101: return &kArmorHead_101;
    case 156: return &kArmorHead_156;
    case 134: return &kArmorHead_134;
    case 46: return &kArmorHead_46;
    case 41: return &kArmorHead_41;
    case 78: return &kArmorHead_78;
    default: return nullptr;
  }
}

inline const TerrariaSprite* getArmorBody(uint16_t id) {
  switch (id) {
    case 175: return &kArmorBody_175;
    case 176: return &kArmorBody_176;
    case 177: return &kArmorBody_177;
    case 190: return &kArmorBody_190;
    case 105: return &kArmorBody_105;
    case 66: return &kArmorBody_66;
    case 95: return &kArmorBody_95;
    case 27: return &kArmorBody_27;
    case 24: return &kArmorBody_24;
    case 51: return &kArmorBody_51;
    default: return nullptr;
  }
}

inline const TerrariaSprite* getArmorLegs(uint16_t id) {
  switch (id) {
    case 110: return &kArmorLegs_110;
    case 111: return &kArmorLegs_111;
    case 112: return &kArmorLegs_112;
    case 130: return &kArmorLegs_130;
    case 98: return &kArmorLegs_98;
    case 55: return &kArmorLegs_55;
    case 79: return &kArmorLegs_79;
    case 26: return &kArmorLegs_26;
    case 23: return &kArmorLegs_23;
    case 47: return &kArmorLegs_47;
    default: return nullptr;
  }
}

inline const TerrariaSpriteAnim* getWings(uint16_t id) {
  switch (id) {
    case 1: return &kWings_1;
    case 2: return &kWings_2;
    case 3: return &kWings_3;
    case 5: return &kWings_5;
    case 6: return &kWings_6;
    case 7: return &kWings_7;
    case 8: return &kWings_8;
    case 9: return &kWings_9;
    case 10: return &kWings_10;
    case 11: return &kWings_11;
    case 12: return &kWings_12;
    case 13: return &kWings_13;
    case 14: return &kWings_14;
    case 15: return &kWings_15;
    case 16: return &kWings_16;
    case 17: return &kWings_17;
    case 18: return &kWings_18;
    case 19: return &kWings_19;
    case 20: return &kWings_20;
    case 21: return &kWings_21;
    case 23: return &kWings_23;
    case 24: return &kWings_24;
    case 25: return &kWings_25;
    case 26: return &kWings_26;
    case 27: return &kWings_27;
    case 29: return &kWings_29;
    case 30: return &kWings_30;
    case 31: return &kWings_31;
    case 32: return &kWings_32;
    case 34: return &kWings_34;
    case 35: return &kWings_35;
    case 36: return &kWings_36;
    case 37: return &kWings_37;
    case 38: return &kWings_38;
    case 39: return &kWings_39;
    case 42: return &kWings_42;
    case 43: return &kWings_43;
    case 48: return &kWings_48;
    case 49: return &kWings_49;
    case 51: return &kWings_51;
    default: return nullptr;
  }
}

inline const TerrariaSprite* getWeapon(uint16_t id) {
  switch (id) {
    case 3065: return &kWeapon_3065;
    case 3475: return &kWeapon_3475;
    case 3531: return &kWeapon_3531;
    case 3540: return &kWeapon_3540;
    case 3541: return &kWeapon_3541;
    case 3542: return &kWeapon_3542;
    case 4956: return &kWeapon_4956;
    case 5005: return &kWeapon_5005;
    case 757: return &kWeapon_757;
    case 1258: return &kWeapon_1258;
    case 1569: return &kWeapon_1569;
    case 1571: return &kWeapon_1571;
    case 3018: return &kWeapon_3018;
    case 3827: return &kWeapon_3827;
    case 4923: return &kWeapon_4923;
    case 4952: return &kWeapon_4952;
    default: return nullptr;
  }
}

inline const TerrariaSprite* getPlayerLayer(uint16_t id) {
  switch (id) {
    case 3: return &kPlayerLayer_3;
    case 4: return &kPlayerLayer_4;
    case 5: return &kPlayerLayer_5;
    case 6: return &kPlayerLayer_6;
    case 7: return &kPlayerLayer_7;
    case 8: return &kPlayerLayer_8;
    case 9: return &kPlayerLayer_9;
    case 0: return &kPlayerLayer_0;
    case 1: return &kPlayerLayer_1;
    case 2: return &kPlayerLayer_2;
    case 10: return &kPlayerLayer_10;
    case 11: return &kPlayerLayer_11;
    case 12: return &kPlayerLayer_12;
    default: return nullptr;
  }
}

inline const TerrariaSpriteAnim* getGuardian(uint16_t id) {
  switch (id) {
    case 623: return &kGuardian_623;
    default: return nullptr;
  }
}

inline const TerrariaSprite* getMisc(const char* name) {
  if (strcmp(name, "biome_forest_0") == 0) return &kMisc_biome_forest_0;
  if (strcmp(name, "biome_forest_1") == 0) return &kMisc_biome_forest_1;
  if (strcmp(name, "biome_forest_2") == 0) return &kMisc_biome_forest_2;
  if (strcmp(name, "dust_242_f0") == 0) return &kMisc_dust_242_f0;
  if (strcmp(name, "extra_171") == 0) return &kMisc_extra_171;
  return nullptr;
}

// 便捷查询
inline const TerrariaSprite* getBiomeForest(uint8_t idx) {
  switch (idx) {
    case 0: return getMisc("biome_forest_0");
    case 1: return getMisc("biome_forest_1");
    case 2: return getMisc("biome_forest_2");
    default: return nullptr;
  }
}
inline const TerrariaSprite* getDust242() { return getMisc("dust_242_f0"); }
inline const TerrariaSprite* getExtra171() { return getMisc("extra_171"); }

}  // namespace TerrariaSprites
