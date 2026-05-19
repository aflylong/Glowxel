// ============================================================
// Terraria 时钟主题渲染器
// 移植自 uniapp/utils/terrariaRenderer.js + terrariaWings.js + clockTerrariaBorder.js
// 数据源: include/theme_assets/terraria/*.h (PROGMEM sprite)
// ============================================================

#include "terraria_clock_effect.h"

#include <math.h>
#include <pgmspace.h>
#include <time.h>
#include <string.h>

#include "clock_font_renderer.h"
#include "config_manager.h"
#include "display_manager.h"
#include "theme_assets/terraria/index.h"
#include "theme_assets/terraria/sprites_biomes.h"
#include "theme_assets/terraria/sprites_bosses.h"
#include "theme_assets/terraria/sprites_summon_extras.h"

// ============ 渲染常量 ============

namespace {

constexpr int FRAME_W = 40;
constexpr int FRAME_H = 56;
constexpr int SCREEN_W = 64;
constexpr int SCREEN_H = 64;

constexpr uint8_t HOLD_FRAME_NUM = 3;
constexpr uint8_t LEG_FRAME_STAND = 0;

// 角色基色
constexpr uint8_t COLOR_SKIN[3]        = {255, 125, 90};
constexpr uint8_t COLOR_EYE[3]         = {105, 90, 75};
constexpr uint8_t COLOR_SHIRT[3]       = {175, 165, 140};
constexpr uint8_t COLOR_UNDERSHIRT[3]  = {160, 180, 215};
constexpr uint8_t COLOR_PANTS[3]       = {255, 230, 175};
constexpr uint8_t COLOR_SHOE[3]        = {160, 105, 60};

// 10 套装 → 装备映射
struct CharSet {
  uint16_t armorHead;
  uint16_t armorBody;
  uint16_t armorLegs;
  uint16_t wings;
  bool hasGuardian;
};
constexpr CharSet kCharSets[15] = {
  {171, 177, 112, 29, false},  // warrior 耀斑
  {169, 175, 110, 30, false},  // ranger 星旋
  {170, 176, 111, 31, false},  // mage 星云
  {189, 190, 130, 32, true},   // summoner 星尘
  {157, 105, 98,  24, false},  // beetle 甲虫
  {101, 66,  55,  11, false},  // spectre 幽灵
  {134, 95,  79,  21, false},  // spooky 阴森 (无守卫)
  {46,  27,  26,  10, false},  // frost 冰霜
  {41,  24,  23,  26, false},  // hallowed 神圣
  {78,  51,  47,  27, false},  // chlorophyte 叶绿
  {261, 230, 213, 49, false},  // crystal 水晶忍者
  {160, 168, 103, 6,  false},  // bee 蜜蜂
  {68,  45,  41,  14, false},  // pirate 海盗
  {9,   9,   9,   1,  false},  // molten 熔岩
  {0,   0,   0,   0,  false},  // novice 新手 (无盔甲)
};

// 武器属性
struct WeaponProps {
  uint16_t id;
  uint8_t useStyle;
  int8_t ofsX;
  int8_t ofsY;
  int16_t rotateDeg;
  bool hideWeapon;
};
constexpr WeaponProps kWeaponProps[20] = {
  {4956, 1, -5,  4,  0, false},  // 天顶剑
  {5005, 1, -5,  4,  0, true},   // 泰拉棱镜 (hideWeapon, 背后飞剑)
  {3531, 1, -5,  4,  0, false},  // 星尘龙杖
  {3475, 5,  4, -7,  0, false},  // 星旋机枪
  {3540, 5,  4, -7,  0, false},  // 幻影弓
  {3541, 5, 22, -7, 90, false},  // 最后的棱镜
  {3542, 5,  0,  0,  0, true},   // 星云烈焰(4px光团)
  {757,  1, -5,  4,  0, false},  // 泰拉刃
  {1122, 1, -5,  4,  0, false},  // 占有斧
  {1931, 5, 18, -14,  0, false},  // 暴风雪法杖
  {1947, 5,  4, -7,  0, false},  // 北极
  {3827, 1, -12, 14,  0, false},  // 飞龙
  {4923, 1, -5,  4,  0, false},  // 星光
  {4952, 5, 22, -7, 90, false},  // 棱彩光辉
  {24,   1, -5,  4,  0, false},  // 木剑
  {3507, 1, -5,  4,  0, false},  // 铜短剑
  {2880, 1, -5,  4,  0, false},  // 波涌之刃
  {1121, 5,  4, -7,  0, false},  // 蜂枪
  {121,  1, -5,  4,  0, false},  // 烈焰巨剑
  {3852, 1, -5,  4,  0, false},  // 魔典法杖
};

const WeaponProps* findWeaponProps(uint16_t weaponId) {
  for (size_t i = 0; i < 20; i++) {
    if (kWeaponProps[i].id == weaponId) return &kWeaponProps[i];
  }
  return nullptr;
}

constexpr uint16_t kLunarBodyIds[4] = {175, 176, 177, 190};
bool isLunarBody(uint16_t id) {
  for (auto v : kLunarBodyIds) if (v == id) return true;
  return false;
}
bool isFullCoverHead(uint8_t character) {
  // 月球套 + 甲虫 + 幽灵 头甲全包式(跳过头发)
  return character <= 3 || character == 4 || character == 5;
}

// 网格位 (跟 build-firmware-sprites.js 输出 _gridIndex 一致)
constexpr uint8_t GRID_TORSO            = 0;
constexpr uint8_t GRID_BACK_ARM         = 1;
constexpr uint8_t GRID_BACK_SHOULDER    = 2;
constexpr uint8_t GRID_FRONT_ARM        = 3;
constexpr uint8_t GRID_FRONT_SHOULDER   = 4;
constexpr uint8_t GRID_BACK_ARM_HOLDING = 5;  // 仅胸甲

bool isPlayerGridLayer(uint8_t layer) {
  return layer == 3 || layer == 4 || layer == 5 || layer == 6 ||
         layer == 7 || layer == 8 || layer == 9 || layer == 13;
}

// ============ 状态 ============

// 10 biome 天空渐变 (跟 uniapp terrariaBiome.js BIOME_SKY 严格一致)
struct BiomeSkyGradient {
  uint8_t top[3];
  uint8_t bottom[3];
};
constexpr BiomeSkyGradient kBiomeSkies[10] = {
  {{0x34, 0x2C, 0xF3}, {0x65, 0x89, 0xF9}},  // 0: forest
  {{0x2A, 0x1E, 0x3E}, {0x70, 0x5C, 0x8E}},  // 1: corruption
  {{0x4A, 0x14, 0x14}, {0xA0, 0x40, 0x3C}},  // 2: crimson
  {{0x2C, 0x6E, 0x4F}, {0x63, 0xAA, 0x70}},  // 3: jungle
  {{0xA0, 0xC0, 0xEC}, {0xDC, 0xE6, 0xF8}},  // 4: snow
  {{0x14, 0x16, 0x33}, {0x3A, 0x3D, 0x66}},  // 5: dungeon
  {{0x6E, 0x14, 0x0A}, {0xCE, 0x3A, 0x14}},  // 6: underworld
  {{0xE0, 0x9A, 0xD2}, {0xB8, 0xCC, 0xF0}},  // 7: hallow
  {{0x35, 0x6B, 0xC4}, {0x6B, 0xB6, 0xE0}},  // 8: ocean
  {{0x4A, 0x32, 0x18}, {0x9F, 0x6E, 0x40}},  // 9: temple
};

uint32_t s_animStartMs = 0;
float s_animTimeSec = 0.0f;
TerrariaModeConfig s_config = {};
bool s_active = false;
const char* s_lastError = nullptr;

// ============ 时钟 mask 缓冲 (用于草膨胀边框) ============
// 64×64 = 4096 bit = 512 字节; 用 byte mask 简化
uint8_t s_clockMask[64 * 64] = {};

// ============ 渲染缓冲 ============
//   不再自己声明 s_renderBuffer, 改用 DisplayManager::animationBuffer 项目全局
//   原因: maze / snake 都用同一个 animationBuffer, 这样确保内存布局跟 presentOffscreenFrame 完全兼容
//   占用: 0 (复用全局 8 KB)
bool s_lastFrameValid = false;
bool s_needsRender = false;

// 取项目全局 animationBuffer 当我们的 render buffer 用
inline uint16_t* renderBufferRow(int y) {
  return &DisplayManager::animationBuffer[y][0];
}

// ★ 行偏移补偿: 此 panel 在双缓冲管线下 buffer y=N 实际显示到屏 y=(N-1) mod 64,
//   导致屏底空一行 (草地最后一行 y=63 显示天空色)。
//   反向补偿: 写到 buffer y=(y+1) mod 64, 屏幕显示就回到屏 y=N 位置。
//   只在 terraria 模式内修, 不动 DisplayManager 全局 (避免影响其他模式)
inline void putPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;
  int by = (y + 1) % SCREEN_H;
  DisplayManager::animationBuffer[by][x] = MatrixPanel_I2S_DMA::color565(r, g, b);
}

// ============ 像素绘制 ============

inline uint16_t toRGB565(uint8_t r, uint8_t g, uint8_t b) {
  return MatrixPanel_I2S_DMA::color565(r, g, b);
}

// 把一段 PROGMEM 像素 (fmt=5 或 7) 画到 s_renderBuffer
//   预缩放数据: 像素 x/y 已是缩放后坐标, spriteW/H 已是缩放后尺寸
//   scale 参数仅作向后兼容, 内部不再使用
//   sourceY 范围: [yMin, yMax) 内的 sprite 像素才画 (网格切片用)
//   centerX/Y: 子图中心在屏幕上的位置
//   spriteW/spriteH: 子图尺寸 (预缩放后)
//   tintColor: nullptr = 不染色; 否则灰度 lum × baseColor
void drawPixelsRange(
  const uint8_t* sourcePixels,
  uint16_t pixelCount,
  uint8_t fmt,
  uint16_t sourceYMin,
  uint16_t sourceYMax,
  float centerX, float centerY,
  uint16_t spriteW, uint16_t spriteH,
  float scale,
  const uint8_t* tintColor
) {
  if (sourcePixels == nullptr || pixelCount == 0) return;
  const float ox = centerX - (float)spriteW * 0.5f;
  const float oy = centerY - (float)spriteH * 0.5f;
  const uint8_t stride = (fmt == 7) ? 7 : 5;

  for (uint16_t i = 0; i < pixelCount; i++) {
    const uint8_t* p = sourcePixels + (size_t)i * stride;
    uint16_t x, y;
    uint8_t r, g, b;
    if (fmt == 7) {
      x = pgm_read_byte(p)     | (pgm_read_byte(p + 1) << 8);
      y = pgm_read_byte(p + 2) | (pgm_read_byte(p + 3) << 8);
      r = pgm_read_byte(p + 4);
      g = pgm_read_byte(p + 5);
      b = pgm_read_byte(p + 6);
    } else {
      x = pgm_read_byte(p);
      y = pgm_read_byte(p + 1);
      r = pgm_read_byte(p + 2);
      g = pgm_read_byte(p + 3);
      b = pgm_read_byte(p + 4);
    }
    if (y < sourceYMin || y >= sourceYMax) continue;

    if (tintColor != nullptr) {
      uint16_t lumNum = (uint16_t)r + g + b;
      r = (uint16_t)tintColor[0] * lumNum / 765;
      g = (uint16_t)tintColor[1] * lumNum / 765;
      b = (uint16_t)tintColor[2] * lumNum / 765;
    }

    int localY = (int)y - (int)sourceYMin;
    int px = (int)(ox + (float)x + 0.5f);
    int py = (int)(oy + (float)localY + 0.5f);
    putPixel(px, py, r, g, b);
  }
}

// 整张 sprite 画到 s_renderBuffer
void drawSpriteWhole(
  const TerrariaSprite* sprite,
  float centerX, float centerY, float scale,
  const uint8_t* tintColor = nullptr
) {
  if (sprite == nullptr) return;
  drawPixelsRange(sprite->pixels, sprite->pixelCount, sprite->fmt,
                   0, sprite->h, centerX, centerY,
                   sprite->w, sprite->h, scale, tintColor);
}

// 网格 sprite 取第 gridIndex 段
//   预缩放后每段高度 = sprite.h / numSegs (armor_body 6 段, player_layer 5 段)
//   isPlayerLayer=true 时按 5 段切, 否则按 6 段切 (跟 uniapp gridFrame 一致)
void drawSpriteGrid(
  const TerrariaSprite* sprite,
  uint8_t gridIndex,
  float centerX, float centerY, float scale,
  const uint8_t* tintColor = nullptr,
  bool isPlayerLayer = false
) {
  if (sprite == nullptr) return;
  uint8_t numSegs = isPlayerLayer ? 5 : 6;
  uint16_t segH = (sprite->h + numSegs / 2) / numSegs;  // round
  uint16_t yMin = gridIndex * segH;
  uint16_t yMax = yMin + segH;
  if (yMax > sprite->h) yMax = sprite->h;
  drawPixelsRange(sprite->pixels, sprite->pixelCount, sprite->fmt,
                   yMin, yMax, centerX, centerY,
                   sprite->w, segH, scale, tintColor);
}

// 多帧差异 sprite: 画指定帧
//   frame 0 = base;  frame N = base 全像素 + delta[N-1] (set 段覆盖 + clear 段擦回背景)
//   clearBgPainter: 当 delta 有 clear 段时, 擦掉旧像素并重画背景色
//                   nullptr 表示这个 sprite 不需要 clear (wings/guardian 单 part 不动位置)
void drawSpriteAnimFrame(
  const TerrariaSpriteAnim* anim,
  uint8_t frameIndex,
  float centerX, float centerY, float scale,
  const uint8_t* tintColor = nullptr,
  void (*clearBgPainter)(int x, int y) = nullptr
) {
  if (anim == nullptr) return;
  // 画 base (set 段)
  drawPixelsRange(anim->base.setPixels, anim->base.setCount, anim->fmt,
                   0, anim->h, centerX, centerY,
                   anim->w, anim->h, scale, tintColor);
  // 画 delta (如果不是 frame 0)
  if (frameIndex == 0) return;
  if (frameIndex - 1 >= anim->frameCount - 1) return;
  TerrariaFrameBlock delta;
  memcpy_P(&delta, &anim->deltas[frameIndex - 1], sizeof(delta));

  // 1) 先擦旧像素 (clear 段重画背景色)
  //    clear 段坐标已经是预渲染坐标系下的 (x, y) — 对 boss 是屏幕坐标 0..63
  //    对于 wings/guardian (clearCount=0) 这段空操作
  if (delta.clearCount > 0 && delta.clearPixels != nullptr && clearBgPainter != nullptr) {
    const float ox = centerX - (float)anim->w * 0.5f;
    const float oy = centerY - (float)anim->h * 0.5f;
    for (uint16_t i = 0; i < delta.clearCount; i++) {
      uint8_t cx = pgm_read_byte(delta.clearPixels + i * 2);
      uint8_t cy = pgm_read_byte(delta.clearPixels + i * 2 + 1);
      int px = (int)(ox + (float)cx + 0.5f);
      int py = (int)(oy + (float)cy + 0.5f);
      if (px >= 0 && px < SCREEN_W && py >= 0 && py < SCREEN_H) {
        clearBgPainter(px, py);
      }
    }
  }

  // 2) 再画新像素 (set 段)
  drawPixelsRange(delta.setPixels, delta.setCount, anim->fmt,
                   0, anim->h, centerX, centerY,
                   anim->w, anim->h, scale, tintColor);
}

// ============ 角色皮肤层取片画 ============

void drawSkinLayer(
  uint8_t layer, uint8_t gridIndex, bool useGrid,
  const uint8_t* tintColor,
  float cx, float cy, float scale
) {
  const TerrariaSprite* sprite = TerrariaSprites::getPlayerLayer(layer);
  if (sprite == nullptr) return;
  if (useGrid && isPlayerGridLayer(layer)) {
    drawSpriteGrid(sprite, gridIndex, cx, cy, scale, tintColor, true);  // player_layer 5 段
  } else {
    drawSpriteWhole(sprite, cx, cy, scale, tintColor);
  }
}

// 胸甲网格画 (4 套全是 9×4 网格已切成 6 段)
void drawArmorBodyGrid(
  uint16_t bodyId, uint8_t gridIndex,
  float cx, float cy, float scale
) {
  const TerrariaSprite* sprite = TerrariaSprites::getArmorBody(bodyId);
  if (sprite == nullptr) return;
  drawSpriteGrid(sprite, gridIndex, cx, cy, scale, nullptr);
}

// 腿甲 (frame 0)
void drawArmorLegs(
  uint16_t legsId, float cx, float cy, float scale
) {
  const TerrariaSprite* sprite = TerrariaSprites::getArmorLegs(legsId);
  if (sprite == nullptr) return;
  drawSpriteWhole(sprite, cx, cy, scale, nullptr);
}

// 头甲 (frame 0)
void drawArmorHead(
  uint16_t headId, float cx, float cy, float scale
) {
  const TerrariaSprite* sprite = TerrariaSprites::getArmorHead(headId);
  if (sprite == nullptr) return;
  drawSpriteWhole(sprite, cx, cy, scale, nullptr);
}

// ============ 翅膀渲染 ============

void drawWings(
  uint16_t wingId,
  float playerCenterX, float playerCenterY, float playerScale,
  uint8_t wingSpeedPct
) {
  // v2: 翅膀已预渲染到 playerScale, 用 scale=1.0 直接画
  const TerrariaSpriteAnim* anim = TerrariaSprites::getWings(wingId);
  if (anim == nullptr) return;

  // 帧索引: 用 anim->frameStart 控制循环起点 (跳过空白折叠帧)
  float wingTime = s_animTimeSec * 60.0f * ((float)wingSpeedPct / 100.0f);
  uint8_t frameStart = anim->frameStart;
  uint8_t animFrames = anim->frameCount - frameStart;
  uint8_t frameIdx = frameStart;
  if (animFrames > 0) {
    frameIdx = frameStart + (((uint32_t)(wingTime / 5.0f)) % animFrames);
  }
  if (frameIdx >= anim->frameCount) frameIdx = anim->frameCount - 1;

  // 翅膀挂载点 (预渲染已包含缩放, 这里只加偏移 scale=1.0)
  float wingCx = playerCenterX + (-9.0f) * playerScale;
  float wingCy = playerCenterY + 9.0f * playerScale;

  drawSpriteAnimFrame(anim, frameIdx, wingCx, wingCy, 1.0f);
}

// ============ 武器渲染 ============

// 把整张 sprite (PROGMEM) 旋转/翻转后画到 s_renderBuffer
//   旋转用最简版: 中心对齐, 任意角度 (不预切, 每像素直接算)
void drawWeapon(
  uint16_t weaponId,
  float playerCenterX, float playerCenterY, float playerScale, int dir
) {
  const WeaponProps* wp = findWeaponProps(weaponId);
  if (wp == nullptr || wp->hideWeapon) return;
  const TerrariaSprite* sprite = TerrariaSprites::getWeapon(weaponId);
  if (sprite == nullptr) return;

  // 持握手部位置 (角色 sprite 局部坐标)
  //   朝右 hand = (26, 38), ofs.x*dir + ofs.y
  const float handLocalX = (dir > 0 ? 26.0f : 14.0f) + (float)wp->ofsX * dir;
  const float handLocalY = 38.0f + (float)wp->ofsY;

  const float handX = playerCenterX + (handLocalX - FRAME_W / 2.0f) * playerScale;
  const float handY = playerCenterY + (handLocalY - FRAME_H / 2.0f) * playerScale;

  // 武器本身的中心位置: useStyle=1 摆动剑从手部斜下发出, useStyle=5 水平居中
  // 注意: sprite->w/h 是预缩放后尺寸, 不再乘 playerScale
  float drawCx, drawCy;
  if (wp->useStyle == 5) {
    drawCx = handX;
    drawCy = handY;
  } else {
    drawCx = handX + (float)sprite->w / 2.0f * dir;
    drawCy = handY - (float)sprite->h / 2.0f;
  }

  // 旋转角度 (棱镜 90°)
  const float rad = (float)wp->rotateDeg * (float)M_PI / 180.0f;
  const bool needRotate = (wp->rotateDeg != 0);
  const bool needFlip = (wp->useStyle == 5 && dir < 0);
  const float cosR = cosf(rad);
  const float sinR = sinf(rad);

  // 直接遍历 sprite 像素, 算转换后位置画到 s_renderBuffer
  const float ox = drawCx;
  const float oy = drawCy;
  const float spriteCx = (float)sprite->w * 0.5f;
  const float spriteCy = (float)sprite->h * 0.5f;
  const uint8_t stride = (sprite->fmt == 7) ? 7 : 5;

  for (uint16_t i = 0; i < sprite->pixelCount; i++) {
    const uint8_t* p = sprite->pixels + (size_t)i * stride;
    uint16_t sx, sy;
    uint8_t r, g, b;
    if (sprite->fmt == 7) {
      sx = pgm_read_byte(p) | (pgm_read_byte(p+1) << 8);
      sy = pgm_read_byte(p+2) | (pgm_read_byte(p+3) << 8);
      r = pgm_read_byte(p+4); g = pgm_read_byte(p+5); b = pgm_read_byte(p+6);
    } else {
      sx = pgm_read_byte(p); sy = pgm_read_byte(p+1);
      r = pgm_read_byte(p+2); g = pgm_read_byte(p+3); b = pgm_read_byte(p+4);
    }

    // 局部 (相对中心)
    float lx = (float)sx - spriteCx;
    float ly = (float)sy - spriteCy;
    if (needFlip) lx = -lx;
    if (needRotate) {
      float nx = lx * cosR - ly * sinR;
      float ny = lx * sinR + ly * cosR;
      lx = nx; ly = ny;
    }
    int px = (int)(ox + lx + 0.5f);
    int py = (int)(oy + ly + 0.5f);
    putPixel(px, py, r, g, b);
  }
}

// 法师烈焰光团 (3542): 手部 4 像素 (2×2 粉紫) + 白色闪烁
void drawWeaponOrb(float cx, float cy, float scale) {
  float handLocalX = 26.0f;
  float handLocalY = 38.0f;
  int handX = (int)(cx + (handLocalX - FRAME_W / 2.0f) * scale + 0.5f);
  int handY = (int)(cy + (handLocalY - FRAME_H / 2.0f) * scale + 0.5f);

  uint32_t tick = (uint32_t)(s_animTimeSec * 60.0f);
  uint8_t flashIdx = (tick / 4) % 4;

  // 4 像素颜色 (粉/紫/浅粉/深紫)
  static const uint8_t colors[4][3] = {
    {0xFF, 0x66, 0xCC}, {0xCC, 0x33, 0xFF},
    {0xFF, 0x88, 0xDD}, {0xAA, 0x22, 0xEE},
  };
  static const int8_t offsets[4][2] = {{0,0},{1,0},{0,1},{1,1}};

  for (int i = 0; i < 4; i++) {
    int px = handX + offsets[i][0];
    int py = handY + offsets[i][1];
    if (i == flashIdx) {
      putPixel(px, py, 0xFF, 0xFF, 0xFF);
    } else {
      putPixel(px, py, colors[i][0], colors[i][1], colors[i][2]);
    }
  }
}

// ============ 角色 16 step 合成 ============

void drawPlayer(
  uint8_t character, uint16_t weaponId,
  float playerScale, float cx, float cy
) {
  const CharSet& cs = kCharSets[character];
  // 面具优先: maskId > 0 时替代套装头甲
  const uint16_t headId = (s_config.maskId > 0) ? s_config.maskId : cs.armorHead;
  const uint16_t bodyId = cs.armorBody;
  const uint16_t legsId = cs.armorLegs;

  const bool isHolding = (weaponId != 0 && weaponId != 5005);  // 5005 帝皇之刃不手持
  const bool usesCompositeArm = isHolding;

  // 网格位选择
  const uint8_t backArmGrid = usesCompositeArm ? GRID_BACK_ARM : GRID_TORSO;
  const uint8_t frontArmGrid = usesCompositeArm ? GRID_FRONT_ARM : GRID_TORSO;

  // ===== Step 1-2: 后臂皮肤 + 后臂内衬 + 后臂上衣袖 =====
  drawSkinLayer(5, backArmGrid, usesCompositeArm, COLOR_SKIN, cx, cy, playerScale);
  drawSkinLayer(8, backArmGrid, usesCompositeArm, COLOR_UNDERSHIRT, cx, cy, playerScale);
  drawSkinLayer(13, backArmGrid, usesCompositeArm, COLOR_SHIRT, cx, cy, playerScale);

  // ===== Step 3-4: 后臂装甲 + 后肩装甲 =====
  drawArmorBodyGrid(bodyId, GRID_BACK_ARM, cx, cy, playerScale);
  drawArmorBodyGrid(bodyId, GRID_BACK_SHOULDER, cx, cy, playerScale);

  // ===== Step 5: 翅膀 (独立 wingId, 不绑定职业) =====
  if (s_config.wingId != 0) {
    drawWings(s_config.wingId, cx, cy, playerScale, s_config.wingSpeed);
  }

  // ===== Step 6-8: 腿/裤皮肤 + 裤子 + 鞋子 =====
  drawSkinLayer(10, 0, false, COLOR_SKIN, cx, cy, playerScale);
  drawSkinLayer(11, 0, false, COLOR_PANTS, cx, cy, playerScale);
  drawSkinLayer(12, 0, false, COLOR_SHOE, cx, cy, playerScale);

  // ===== Step 9: 护腿装甲 =====
  drawArmorLegs(legsId, cx, cy, playerScale);

  // ===== Step 10-12: 躯干皮肤 + 内衬 + 上衣 =====
  drawSkinLayer(3, GRID_TORSO, usesCompositeArm, COLOR_SKIN, cx, cy, playerScale);
  drawSkinLayer(4, GRID_TORSO, usesCompositeArm, COLOR_UNDERSHIRT, cx, cy, playerScale);
  drawSkinLayer(6, GRID_TORSO, usesCompositeArm, COLOR_SHIRT, cx, cy, playerScale);

  // ===== Step 13: 躯干装甲 =====
  drawArmorBodyGrid(bodyId, GRID_TORSO, cx, cy, playerScale);

  // ===== Step 14: 头/眼/眼珠 =====
  drawSkinLayer(0, 0, false, COLOR_SKIN, cx, cy, playerScale);
  drawSkinLayer(1, 0, false, nullptr, cx, cy, playerScale);  // 眼白不染
  drawSkinLayer(2, 0, false, COLOR_EYE, cx, cy, playerScale);

  // ===== Step 15: 头甲 (持械时下移 2px) =====
  float headOffY = isHolding ? 2.0f : 0.0f;
  if (headId > 0) {
    drawArmorHead(headId, cx, cy + headOffY * playerScale, playerScale);
  }

  // ===== Step 16: 头发 (无头甲时画, hairColor 直接填色) =====
  if (headId == 0) {
    const TerrariaSprite* hairSprite = TerrariaSprites::getPlayerLayer(15);
    if (hairSprite != nullptr && hairSprite->pixelCount > 0) {
      static const uint8_t HAIR_COLOR[3] = {215, 90, 55};
      const float ox = cx - (float)hairSprite->w * 0.5f;
      const float oy = cy - (float)hairSprite->h * 0.5f;
      const uint8_t stride = (hairSprite->fmt == 7) ? 7 : 5;
      for (uint16_t i = 0; i < hairSprite->pixelCount; i++) {
        const uint8_t* p = hairSprite->pixels + (size_t)i * stride;
        uint16_t hx, hy;
        if (hairSprite->fmt == 7) {
          hx = pgm_read_byte(p) | (pgm_read_byte(p+1) << 8);
          hy = pgm_read_byte(p+2) | (pgm_read_byte(p+3) << 8);
        } else {
          hx = pgm_read_byte(p);
          hy = pgm_read_byte(p+1);
        }
        int px = (int)(ox + (float)hx + 0.5f);
        int py = (int)(oy + (float)hy + 0.5f);
        putPixel(px, py, HAIR_COLOR[0], HAIR_COLOR[1], HAIR_COLOR[2]);
      }
    }
  }

  // ===== 武器 + 前臂层 =====
  // 武器在前臂之前画
  bool hasOrb = false;
  if (isHolding) {
    drawWeapon(weaponId, cx, cy, playerScale, 1);
    if (weaponId == 3542) hasOrb = true;
  }

  // 前臂层
  drawSkinLayer(7, frontArmGrid, usesCompositeArm, COLOR_SKIN, cx, cy, playerScale);
  drawSkinLayer(8, frontArmGrid, usesCompositeArm, COLOR_UNDERSHIRT, cx, cy, playerScale);
  drawSkinLayer(13, frontArmGrid, usesCompositeArm, COLOR_SHIRT, cx, cy, playerScale);
  drawArmorBodyGrid(bodyId, GRID_FRONT_ARM, cx, cy, playerScale);
  if (usesCompositeArm) {
    drawArmorBodyGrid(bodyId, GRID_FRONT_SHOULDER, cx, cy, playerScale);
  }
  if (!isLunarBody(bodyId)) {
    drawSkinLayer(9, frontArmGrid, usesCompositeArm, COLOR_SKIN, cx, cy, playerScale);
  }

  // 烈焰光团 (在前臂之后)
  if (hasOrb) {
    drawWeaponOrb(cx, cy, playerScale);
  }
}

// ============ 时钟 + 草膨胀边框 ============

void drawClockWithBorder() {
  // 1. 取时间文本
  time_t now = time(nullptr);
  struct tm* tm_info = localtime(&now);
  char timeText[12];
  if (s_config.hourFormat == 12) {
    int h = tm_info->tm_hour % 12;
    if (h == 0) h = 12;
    if (s_config.showSeconds) {
      snprintf(timeText, sizeof(timeText), "%02d:%02d:%02d", h, tm_info->tm_min, tm_info->tm_sec);
    } else {
      snprintf(timeText, sizeof(timeText), "%02d:%02d", h, tm_info->tm_min);
    }
  } else {
    if (s_config.showSeconds) {
      snprintf(timeText, sizeof(timeText), "%02d:%02d:%02d",
               tm_info->tm_hour, tm_info->tm_min, tm_info->tm_sec);
    } else {
      snprintf(timeText, sizeof(timeText), "%02d:%02d",
               tm_info->tm_hour, tm_info->tm_min);
    }
  }

  // 2. 光栅化字到 mask (居中)
  memset(s_clockMask, 0, sizeof(s_clockMask));
  rasterizeClockTextToMask(
    s_clockMask, timeText,
    (int)s_config.clockX, (int)s_config.clockY,
    s_config.fontId, s_config.fontScale,
    1  // center
  );

  // 3. 算 mask bbox
  int minX = SCREEN_W, minY = SCREEN_H, maxX = -1, maxY = -1;
  for (int y = 0; y < SCREEN_H; y++) {
    for (int x = 0; x < SCREEN_W; x++) {
      if (s_clockMask[y * SCREEN_W + x]) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return;  // 空文本

  // 4. 扩展 PAD=2 圈做切比雪夫距离边框
  constexpr int PAD = 2;
  int x0 = minX - PAD; if (x0 < 0) x0 = 0;
  int y0 = minY - PAD; if (y0 < 0) y0 = 0;
  int x1 = maxX + PAD; if (x1 >= SCREEN_W) x1 = SCREEN_W - 1;
  int y1 = maxY + PAD; if (y1 >= SCREEN_H) y1 = SCREEN_H - 1;

  uint8_t* tc = s_config.clockTextColor;
  uint8_t* bgIn = s_config.clockBgInner;
  uint8_t* bgOut = s_config.clockBgOuter;

  for (int y = y0; y <= y1; y++) {
    for (int x = x0; x <= x1; x++) {
      if (s_clockMask[y * SCREEN_W + x]) continue;  // 字本体后面画

      // 算到 mask 最近距离 (切比雪夫: max(|dx|,|dy|))
      // 仅扫描 PAD 范围邻域
      int minD = 99;
      for (int dy = -PAD; dy <= PAD && minD > 0; dy++) {
        for (int dx = -PAD; dx <= PAD && minD > 0; dx++) {
          int nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= SCREEN_W || ny < 0 || ny >= SCREEN_H) continue;
          if (!s_clockMask[ny * SCREEN_W + nx]) continue;
          int d = (dx < 0 ? -dx : dx);
          int dyAbs = (dy < 0 ? -dy : dy);
          if (dyAbs > d) d = dyAbs;
          if (d < minD) minD = d;
        }
      }

      if (minD == 1) {
        putPixel(x, y, bgIn[0], bgIn[1], bgIn[2]);
      } else if (minD == 2) {
        putPixel(x, y, bgOut[0], bgOut[1], bgOut[2]);
      }
    }
  }

  // 5. 字本体覆盖最上层
  for (int y = minY; y <= maxY; y++) {
    for (int x = minX; x <= maxX; x++) {
      if (s_clockMask[y * SCREEN_W + x]) {
        putPixel(x, y, tc[0], tc[1], tc[2]);
      }
    }
  }
}

// 取当前帧"动态状态"(翅膀帧 / 守卫帧 / 光团抖动 / 时钟字)
//   只用于跟上次比对; 真正的渲染发生在 buildFrame
struct DynamicState {
  uint8_t wingFrame;
  uint8_t guardianFrame;
  int8_t  guardianBobYx10;  // *10 防 float 比对误差
  uint8_t orbDy;
  char    timeText[12];
};

DynamicState computeDynamicState() {
  DynamicState st = {};
  uint32_t tick = (uint32_t)(s_animTimeSec * 60.0f);

  // 翅膀帧 (用实际 sprite 的 frameCount 和 frameStart, 不写死)
  float wingTime = s_animTimeSec * 60.0f * ((float)s_config.wingSpeed / 100.0f);
  uint8_t wingAnimFrames = 3;  // fallback
  uint8_t wingFrameStart = 1;
  if (s_config.wingId != 0) {
    const TerrariaSpriteAnim* wAnim = TerrariaSprites::getWings(s_config.wingId);
    if (wAnim != nullptr) {
      wingFrameStart = wAnim->frameStart;
      wingAnimFrames = wAnim->frameCount - wingFrameStart;
      if (wingAnimFrames == 0) wingAnimFrames = 1;
    }
  }
  st.wingFrame = wingFrameStart + (((uint32_t)(wingTime / 5.0f)) % wingAnimFrames);

  // 守卫
  st.guardianFrame = (tick / 9) % 8;
  float bobY = sinf((float)tick / 72.0f * (float)M_PI * 2.0f) * 1.5f;
  st.guardianBobYx10 = (int8_t)(bobY * 10.0f);

  // 光团
  st.orbDy = ((tick % 5) < 3) ? 0 : 1;

  // 时钟文本
  time_t now = time(nullptr);
  struct tm* tm_info = localtime(&now);
  if (s_config.hourFormat == 12) {
    int h = tm_info->tm_hour % 12;
    if (h == 0) h = 12;
    if (s_config.showSeconds) {
      snprintf(st.timeText, sizeof(st.timeText), "%02d:%02d:%02d",
               h, tm_info->tm_min, tm_info->tm_sec);
    } else {
      snprintf(st.timeText, sizeof(st.timeText), "%02d:%02d",
               h, tm_info->tm_min);
    }
  } else {
    if (s_config.showSeconds) {
      snprintf(st.timeText, sizeof(st.timeText), "%02d:%02d:%02d",
               tm_info->tm_hour, tm_info->tm_min, tm_info->tm_sec);
    } else {
      snprintf(st.timeText, sizeof(st.timeText), "%02d:%02d",
               tm_info->tm_hour, tm_info->tm_min);
    }
  }
  return st;
}

DynamicState s_lastDynamicState = {};

bool dynamicStateChanged(const DynamicState& a, const DynamicState& b) {
  return a.wingFrame != b.wingFrame ||
         a.guardianFrame != b.guardianFrame ||
         a.guardianBobYx10 != b.guardianBobYx10 ||
         a.orbDy != b.orbDy ||
         strcmp(a.timeText, b.timeText) != 0;
}

// 把整个场景画到 s_renderBuffer (不直接刷 display)
// ============ 背景色单点查询 (用于 boss delta clear 段擦回背景) ============
//   逻辑必须跟 buildFrame 第 1/1.5/1.6 步完全一致
//   1. 草地区 (y >= 59): 查 biome tile (palette)
//   2. 天空 + 云区: 天空渐变, 云区域用云白色 (云没有 mask 可查 → 用屏幕坐标算)
inline void paintBossBackground(int x, int y) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;

  constexpr int blockSize = 5;
  constexpr int groundY = SCREEN_H - blockSize;  // 59

  // 1) 草地
  if (y >= groundY) {
    const TerrariaBiomeTile* tiles[3] = {
      getBiomeTile(s_config.biome, 0),
      getBiomeTile(s_config.biome, 1),
      getBiomeTile(s_config.biome, 2),
    };
    int xBase = (x / blockSize) * blockSize;
    int dx = x - xBase;
    int dy = y - groundY;
    const TerrariaBiomeTile* tile = tiles[(xBase / blockSize) % 3];
    if (tile != nullptr) {
      int tx = (int)((float)dx * 16.0f / (float)blockSize + 0.5f);
      int ty = (int)((float)dy * 16.0f / (float)blockSize + 0.5f);
      if (tx > 15) tx = 15; if (ty > 15) ty = 15;
      uint8_t palIdx = pgm_read_byte(&tile->indices[ty * 16 + tx]);
      const uint8_t* pe = tile->palette + (size_t)palIdx * 3;
      putPixel(x, y, pgm_read_byte(pe), pgm_read_byte(pe+1), pgm_read_byte(pe+2));
      return;
    }
  }

  // 2) 云 (跟 buildFrame 1.5 节算法一致 — 但这里不重算 mask, 只查像素是否在某朵云的 bbox)
  //    简化: 对 boss clear 像素, 直接用天空色; 云区有少数像素被 boss 遮挡时, 擦回天空色虽不完美,
  //    但 boss bbox 通常远离云 (云在 y=4~17, boss 默认 y=20~50), 实际问题极少
  const BiomeSkyGradient& sky = kBiomeSkies[s_config.biome < 10 ? s_config.biome : 0];
  float t = (float)y / 63.0f;
  uint8_t r = (uint8_t)((float)sky.top[0] * (1.0f - t) + (float)sky.bottom[0] * t);
  uint8_t g = (uint8_t)((float)sky.top[1] * (1.0f - t) + (float)sky.bottom[1] * t);
  uint8_t b = (uint8_t)((float)sky.top[2] * (1.0f - t) + (float)sky.bottom[2] * t);
  putPixel(x, y, r, g, b);
}

void buildFrame() {
  // ===== 1. 背景: biome 天空渐变 =====
  const BiomeSkyGradient& sky = kBiomeSkies[s_config.biome < 10 ? s_config.biome : 0];
  for (int y = 0; y < SCREEN_H; y++) {
    float t = (float)y / 63.0f;
    uint8_t r = (uint8_t)((float)sky.top[0] * (1.0f - t) + (float)sky.bottom[0] * t);
    uint8_t g = (uint8_t)((float)sky.top[1] * (1.0f - t) + (float)sky.bottom[1] * t);
    uint8_t b = (uint8_t)((float)sky.top[2] * (1.0f - t) + (float)sky.bottom[2] * t);
    for (int x = 0; x < SCREEN_W; x++) {
      putPixel(x, y, r, g, b);
    }
  }

  // ===== 1.5 3 朵手画云 (做 2 圈切比雪夫膨胀 → 视觉上每朵云外扩 2 px) =====
  static const char* kCloudShapes[3][4] = {
    {"..####....", ".######...", "##########", ".########."},
    {".####.",     "######",     ".####.",     nullptr},
    {"...####...", ".########.", "##########", "..######.."},
  };
  static const uint8_t kCloudPos[3][2] = {{4, 6}, {26, 14}, {44, 4}};
  constexpr int CLOUD_PAD = 2;

  // 1) 把云像素标到 mask
  static uint8_t s_cloudMask[SCREEN_H][SCREEN_W];
  memset(s_cloudMask, 0, sizeof(s_cloudMask));
  for (int i = 0; i < 3; i++) {
    int ox = kCloudPos[i][0], oy = kCloudPos[i][1];
    for (int row = 0; row < 4; row++) {
      const char* line = kCloudShapes[i][row];
      if (line == nullptr) break;
      for (int col = 0; line[col] != '\0'; col++) {
        if (line[col] == '#') {
          int px = ox + col, py = oy + row;
          if (px >= 0 && px < SCREEN_W && py >= 0 && py < SCREEN_H) {
            s_cloudMask[py][px] = 1;
          }
        }
      }
    }
  }

  // 2) 切比雪夫膨胀 2 圈: 对每个非云像素, 看 PAD 邻域内有没有云像素 → 标 2
  for (int y = 0; y < SCREEN_H; y++) {
    for (int x = 0; x < SCREEN_W; x++) {
      if (s_cloudMask[y][x] == 1) continue;
      bool nearCloud = false;
      for (int dy = -CLOUD_PAD; dy <= CLOUD_PAD && !nearCloud; dy++) {
        for (int dx = -CLOUD_PAD; dx <= CLOUD_PAD && !nearCloud; dx++) {
          if (dx == 0 && dy == 0) continue;
          int nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= SCREEN_W || ny < 0 || ny >= SCREEN_H) continue;
          if (s_cloudMask[ny][nx] == 1) nearCloud = true;
        }
      }
      if (nearCloud) s_cloudMask[y][x] = 2;
    }
  }

  // 3) 把云画到 render buffer (原始 + 膨胀都用同一个云白色)
  for (int y = 0; y < SCREEN_H; y++) {
    for (int x = 0; x < SCREEN_W; x++) {
      if (s_cloudMask[y][x]) {
        putPixel(x, y, 0xE8, 0xF0, 0xFF);
      }
    }
  }

  // ===== 1.6 草地: 用 palette 压缩 tile 渲染, 按 biome 切换 =====
  //   数据: TerrariaBiomeTile (palette + 16×16 indices), 每 biome 3 个 tile 横向循环
  //   缩放: 16×16 → 5×5 (反向采样 round)
  {
    const TerrariaBiomeTile* tiles[3] = {
      getBiomeTile(s_config.biome, 0),
      getBiomeTile(s_config.biome, 1),
      getBiomeTile(s_config.biome, 2),
    };
    if (tiles[0] && tiles[1] && tiles[2]) {
      constexpr int blockSize = 5;
      constexpr int groundY = SCREEN_H - blockSize;  // 59 → 草地占 59..63
      for (int x = 0; x < SCREEN_W; x += blockSize) {
        const TerrariaBiomeTile* tile = tiles[(x / blockSize) % 3];
        for (int dy = 0; dy < blockSize; dy++) {
          int py = groundY + dy;
          if (py < 0 || py >= SCREEN_H) continue;
          int ty = (int)((float)dy * 16.0f / (float)blockSize + 0.5f);
          if (ty < 0) ty = 0;
          if (ty > 15) ty = 15;
          for (int dx = 0; dx < blockSize; dx++) {
            int px = x + dx;
            if (px < 0 || px >= SCREEN_W) continue;
            int tx = (int)((float)dx * 16.0f / (float)blockSize + 0.5f);
            if (tx < 0) tx = 0;
            if (tx > 15) tx = 15;
            uint8_t palIdx = pgm_read_byte(&tile->indices[ty * 16 + tx]);
            const uint8_t* palEntry = tile->palette + (size_t)palIdx * 3;
            uint8_t r = pgm_read_byte(palEntry);
            uint8_t g = pgm_read_byte(palEntry + 1);
            uint8_t b = pgm_read_byte(palEntry + 2);
            putPixel(px, py, r, g, b);
          }
        }
      }
    }
  }

  // ===== 取角色配置 =====
  const float playerScale = (float)s_config.playerScale / 100.0f;
  const float cx = (float)s_config.playerX;
  const float cy = (float)s_config.playerY;
  const uint8_t character = s_config.character;
  const CharSet& charSet = kCharSets[character];

  // ===== 2. Boss (预渲染动画, base+delta(set+clear), 屏幕绝对坐标) — 最底层 =====
  if (s_config.bossEnabled && s_config.bossId < ::kBossCount) {
    const TerrariaSpriteAnim* bossAnim = ::getBossAnim(s_config.bossId);
    if (bossAnim != nullptr) {
      // 像素已是屏幕绝对坐标 (0~63), 用中心 (32,32) scale=1.0 直接画
      // boss 多 part 移动会有"旧位置残留" → 传 paintBossBackground 用来擦回背景色
      uint32_t tick = (uint32_t)(s_animTimeSec * 60.0f);
      uint8_t bossFrame = (tick / 9) % bossAnim->frameCount;
      drawSpriteAnimFrame(bossAnim, bossFrame, 32.0f, 32.0f, 1.0f, nullptr, paintBossBackground);
    }
  }

  // ===== 3. 守卫 (仅召唤师) =====
  if (charSet.hasGuardian) {
    const TerrariaSpriteAnim* guardian = TerrariaSprites::getGuardian(623);
    if (guardian) {
      uint32_t tick = (uint32_t)(s_animTimeSec * 60.0f);
      uint8_t idleFrame = (tick / 9) % 8;
      float bobY = sinf((float)tick / 72.0f * (float)M_PI * 2.0f) * 1.5f;
      float gx = cx + (float)s_config.guardianX;
      float gy = cy + (float)s_config.guardianY + bobY;
      drawSpriteAnimFrame(guardian, idleFrame, gx, gy, playerScale);
    }
  }

  // ===== 3.5 星尘龙 (持星尘龙杖 3531 时) =====
  if (s_config.weaponId == 3531) {
    float drX = cx + (float)s_config.dragonX;
    float drY = cy + (float)s_config.dragonY;
    uint32_t tick = (uint32_t)(s_animTimeSec * 60.0f);
    drX += sinf(tick * 0.02f) * 2.0f;
    drY += sinf(tick * 0.03f) * 2.0f;
    float angle = (float)s_config.dragonAngle * (float)M_PI / 180.0f + sinf(tick * 0.04f) * 0.2f;
    float cosA = cosf(angle), sinA = sinf(angle);
    // 用真正 sprite 旋转绘制
    const TerrariaSprite* drSprite = &kStardustDragon;
    float sprCx = (float)drSprite->w * 0.5f;
    float sprCy = (float)drSprite->h * 0.5f;
    const uint8_t* p = drSprite->pixels;
    for (uint16_t i = 0; i < drSprite->pixelCount; i++) {
      uint8_t lx = pgm_read_byte(p + i*5);
      uint8_t ly = pgm_read_byte(p + i*5 + 1);
      uint8_t r = pgm_read_byte(p + i*5 + 2);
      uint8_t g = pgm_read_byte(p + i*5 + 3);
      uint8_t b = pgm_read_byte(p + i*5 + 4);
      float rx = (float)lx - sprCx;
      float ry = (float)ly - sprCy;
      float nx = rx * cosA - ry * sinA;
      float ny = rx * sinA + ry * cosA;
      int px = (int)(drX + nx + 0.5f);
      int py = (int)(drY + ny + 0.5f);
      putPixel(px, py, r, g, b);
    }
  }

  // ===== 3.6 帝皇飞剑 (持帝皇之刃 5005 时) =====
  if (s_config.weaponId == 5005) {
    float blX = cx + (float)s_config.bladeX;
    float blY = cy + (float)s_config.bladeY + sinf(s_animTimeSec * 2.0f) * 2.0f;
    float angle = (float)s_config.bladeAngle * (float)M_PI / 180.0f;  // 固定角度,不摆动
    float cosA = cosf(angle), sinA = sinf(angle);
    // 彩虹 hue
    uint32_t hue = ((uint32_t)(s_animTimeSec * 60.0f)) % 360;
    uint8_t hr, hg, hb;
    if (hue < 60)       { hr = 255; hg = hue * 255 / 60; hb = 0; }
    else if (hue < 120) { hr = (120 - hue) * 255 / 60; hg = 255; hb = 0; }
    else if (hue < 180) { hr = 0; hg = 255; hb = (hue - 120) * 255 / 60; }
    else if (hue < 240) { hr = 0; hg = (240 - hue) * 255 / 60; hb = 255; }
    else if (hue < 300) { hr = (hue - 240) * 255 / 60; hg = 0; hb = 255; }
    else                { hr = 255; hg = 0; hb = (360 - hue) * 255 / 60; }
    // 用真正 sprite 旋转 + 着色
    const TerrariaSprite* blSprite = &kEmpressBlade;
    float sprCx = (float)blSprite->w * 0.5f;
    float sprCy = (float)blSprite->h * 0.5f;
    const uint8_t* p = blSprite->pixels;
    for (uint16_t i = 0; i < blSprite->pixelCount; i++) {
      uint8_t lx = pgm_read_byte(p + i*5);
      uint8_t ly = pgm_read_byte(p + i*5 + 1);
      uint8_t sr = pgm_read_byte(p + i*5 + 2);
      uint8_t sg = pgm_read_byte(p + i*5 + 3);
      uint8_t sb = pgm_read_byte(p + i*5 + 4);
      // 亮度 × hue 着色
      uint16_t lum = ((uint16_t)sr + sg + sb) / 3;
      uint8_t cr = (uint8_t)((uint16_t)hr * lum / 255);
      uint8_t cg = (uint8_t)((uint16_t)hg * lum / 255);
      uint8_t cb = (uint8_t)((uint16_t)hb * lum / 255);
      float rx = (float)lx - sprCx;
      float ry = (float)ly - sprCy;
      float nx = rx * cosA - ry * sinA;
      float ny = rx * sinA + ry * cosA;
      int px = (int)(blX + nx + 0.5f);
      int py = (int)(blY + ny + 0.5f);
      putPixel(px, py, cr, cg, cb);
    }
  }

  // ===== 4. 角色合成 — 最上层 =====
  drawPlayer(character, s_config.weaponId, playerScale, cx, cy);

  // ===== 4. 时钟 + 草膨胀边框 =====
  drawClockWithBorder();
}

// 把 s_renderBuffer 推到 display
//   走项目统一的 DisplayManager::presentOffscreenFrame() 流程:
//   - 内部已实现 dirty diff (跟 liveFrameBuffer 比对, 仅推差异像素)
//   - 单/双缓冲都正确处理 (双缓冲会 flipDMABuffer)
//   - 用 animationBuffer 跟 maze/snake 完全一致, 排除 buffer 内存布局差异
void flushFrameToDisplay(MatrixPanel_I2S_DMA* /*display*/) {
  DisplayManager::presentOffscreenFrame(&DisplayManager::animationBuffer[0][0]);
  s_lastFrameValid = true;
}

}  // anon namespace

// ============================================================
// API 实现
// ============================================================

namespace TerrariaClockEffect {

void init() {
  s_active = false;
  s_animStartMs = 0;
  s_animTimeSec = 0.0f;
  s_lastError = nullptr;
}

void deactivate() {
  s_active = false;
  s_lastFrameValid = false;
  memset(&s_lastDynamicState, 0, sizeof(s_lastDynamicState));
}

void applyConfig(const TerrariaModeConfig& config) {
  s_config = config;
  s_animStartMs = millis();
  s_animTimeSec = 0.0f;
  s_active = true;
  s_lastError = nullptr;
  // 配置变化 → 强制下一帧重画 + 全屏推送
  s_lastFrameValid = false;
  memset(&s_lastDynamicState, 0, sizeof(s_lastDynamicState));
}

void update() {
  if (!s_active) return;
  uint32_t now = millis();
  s_animTimeSec = (float)(now - s_animStartMs) / 1000.0f;
}

bool isActive() { return s_active; }
const TerrariaModeConfig& getConfig() { return s_config; }
const char* getLastError() { return s_lastError; }

void render() {
  if (!s_active) return;
  auto* display = DisplayManager::dma_display;
  if (display == nullptr) return;

  // 1) 看动态状态有没有变 (没变 + 已经画过 → 直接返回, 不刷屏)
  DynamicState now = computeDynamicState();
  if (s_lastFrameValid && !dynamicStateChanged(now, s_lastDynamicState)) {
    return;
  }

  // 2) 重建当前帧到 s_renderBuffer (只写 SRAM, 不碰 display)
  buildFrame();

  // 3) 跟上一帧 diff, 仅推差异像素到 display
  flushFrameToDisplay(display);

  // 4) 记录这次的动态状态
  s_lastDynamicState = now;
}

}  // namespace TerrariaClockEffect
