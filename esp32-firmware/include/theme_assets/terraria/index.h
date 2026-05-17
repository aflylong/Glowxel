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
    default: return nullptr;
  }
}

inline const TerrariaSprite* getArmorBody(uint16_t id) {
  switch (id) {
    case 175: return &kArmorBody_175;
    case 176: return &kArmorBody_176;
    case 177: return &kArmorBody_177;
    case 190: return &kArmorBody_190;
    default: return nullptr;
  }
}

inline const TerrariaSprite* getArmorLegs(uint16_t id) {
  switch (id) {
    case 110: return &kArmorLegs_110;
    case 111: return &kArmorLegs_111;
    case 112: return &kArmorLegs_112;
    case 130: return &kArmorLegs_130;
    default: return nullptr;
  }
}

inline const TerrariaSpriteAnim* getWings(uint16_t id) {
  switch (id) {
    case 29: return &kWings_29;
    case 30: return &kWings_30;
    case 31: return &kWings_31;
    case 32: return &kWings_32;
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
    case 13: return &kPlayerLayer_13;
    case 0: return &kPlayerLayer_0;
    case 1: return &kPlayerLayer_1;
    case 2: return &kPlayerLayer_2;
    case 10: return &kPlayerLayer_10;
    case 11: return &kPlayerLayer_11;
    case 12: return &kPlayerLayer_12;
    case 15: return &kPlayerLayer_15;
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
