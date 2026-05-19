#ifndef TERRARIA_MODE_TYPES_H
#define TERRARIA_MODE_TYPES_H

#include <Arduino.h>

// 10 个套装 (跟 uniapp CHARACTERS 键名严格对齐)
enum TerrariaCharacter : uint8_t {
  TERRARIA_CHAR_WARRIOR     = 0,  // 耀斑 Solar Flare
  TERRARIA_CHAR_RANGER      = 1,  // 星旋 Vortex
  TERRARIA_CHAR_MAGE        = 2,  // 星云 Nebula
  TERRARIA_CHAR_SUMMONER    = 3,  // 星尘 Stardust
  TERRARIA_CHAR_BEETLE      = 4,  // 甲虫
  TERRARIA_CHAR_SPECTRE     = 5,  // 幽灵
  TERRARIA_CHAR_SPOOKY      = 6,  // 阴森
  TERRARIA_CHAR_FROST       = 7,  // 冰霜
  TERRARIA_CHAR_HALLOWED    = 8,  // 神圣
  TERRARIA_CHAR_CHLOROPHYTE = 9,  // 叶绿
};

struct TerrariaModeConfig {
  // 角色 + 武器
  uint8_t character;        // TerrariaCharacter
  uint16_t weaponId;        // 武器 ID

  // 角色姿态
  uint8_t playerX;          // 0..63
  uint8_t playerY;          // 0..63
  uint8_t playerScale;      // 20..200 (百分比)

  // 召唤师守卫位置
  int8_t guardianX;         // -64..64
  int8_t guardianY;         // -64..64
  uint8_t guardianScale;    // 20..200

  // 翅膀 (独立选择, 不绑定职业)
  uint8_t wingId;           // Wings ID (1..51, 0=无翅膀)
  uint8_t wingSpeed;        // 0..200 (50 = 默认)

  // 地形 (跟 uniapp BIOME_LIST 对齐)
  uint8_t biome;            // 0=forest,1=corruption,2=crimson,3=jungle,4=snow,5=dungeon,6=underworld,7=hallow,8=ocean,9=temple

  // Boss
  bool bossEnabled;
  uint8_t bossId;           // boss 索引 (0..32)
  uint8_t bossX;            // 0..63
  uint8_t bossY;            // 0..63
  uint8_t bossScale;        // 5..200

  // 时钟设置
  uint8_t fontId;           // ClockFontId 枚举值
  uint8_t fontScale;        // 1..3
  uint8_t clockX;           // 0..63
  uint8_t clockY;           // 0..63
  uint8_t hourFormat;       // 12 or 24
  bool showSeconds;

  // 草膨胀边框 3 色
  uint8_t clockTextColor[3]; // RGB
  uint8_t clockBgInner[3];   // RGB
  uint8_t clockBgOuter[3];   // RGB
};

#endif
