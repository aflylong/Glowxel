#ifndef TERRARIA_MODE_TYPES_H
#define TERRARIA_MODE_TYPES_H

#include <Arduino.h>

// 4 个职业 (跟 uniapp characters.json 严格对齐, 不发明新职业)
enum TerrariaCharacter : uint8_t {
  TERRARIA_CHAR_WARRIOR  = 0,  // 耀斑 Solar Flare
  TERRARIA_CHAR_RANGER   = 1,  // 星旋 Vortex
  TERRARIA_CHAR_MAGE     = 2,  // 星云 Nebula
  TERRARIA_CHAR_SUMMONER = 3,  // 星尘 Stardust
};

struct TerrariaModeConfig {
  // 角色 + 武器
  uint8_t character;        // TerrariaCharacter
  uint16_t weaponId;        // 4956/3065/3475/3540/3541/3542/3531/5005

  // 角色姿态
  uint8_t playerX;          // 0..63
  uint8_t playerY;          // 0..63
  uint8_t playerScale;      // 20..200 (百分比)

  // 召唤师守卫位置 (仅 character=SUMMONER 用)
  int8_t guardianX;         // -32..32
  int8_t guardianY;         // -32..32

  // 翅膀动画速度
  uint8_t wingSpeed;        // 0..200 (50 = 默认)

  // 时钟设置 (terraria 独有, 不复用 ClockConfig)
  uint8_t fontId;           // ClockFontId 枚举值 (clock_font_renderer.h)
  uint8_t fontScale;        // 1..3
  uint8_t clockX;           // 0..63 (时钟中心 x)
  uint8_t clockY;           // 0..63 (时钟中心 y)
  uint8_t hourFormat;       // 12 or 24
  bool showSeconds;

  // 草膨胀边框 3 色
  uint8_t clockTextColor[3]; // RGB 字本体色 (默认 #5a4a3a)
  uint8_t clockBgInner[3];   // RGB 内圈色 (默认 #63971f)
  uint8_t clockBgOuter[3];   // RGB 外圈色 (默认 #8FD71D)
};

#endif
