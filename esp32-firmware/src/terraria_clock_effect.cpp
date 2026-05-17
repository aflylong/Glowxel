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

// 4 职业 → 装备映射
struct CharSet {
  uint16_t armorHead;
  uint16_t armorBody;
  uint16_t armorLegs;
  uint16_t wings;
  bool hasGuardian;
};
constexpr CharSet kCharSets[4] = {
  {171, 177, 112, 29, false},
  {169, 175, 110, 30, false},
  {170, 176, 111, 31, false},
  {189, 190, 130, 32, true},
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
constexpr WeaponProps kWeaponProps[8] = {
  {4956, 1, -5,  4,  0, false},
  {3065, 1, -5,  4,  0, false},
  {3531, 1, -5,  4,  0, false},
  {5005, 1, -5,  4,  0, false},
  {3475, 5,  4, -7,  0, false},
  {3540, 5,  4, -7,  0, false},
  {3541, 5, 22, -7, 90, false},
  {3542, 5,  0,  0,  0, true},
};

const WeaponProps* findWeaponProps(uint16_t weaponId) {
  for (size_t i = 0; i < 8; i++) {
    if (kWeaponProps[i].id == weaponId) return &kWeaponProps[i];
  }
  return nullptr;
}

constexpr uint16_t kLunarBodyIds[4] = {175, 176, 177, 190};
bool isLunarBody(uint16_t id) {
  for (auto v : kLunarBodyIds) if (v == id) return true;
  return false;
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

uint32_t s_animStartMs = 0;
float s_animTimeSec = 0.0f;
TerrariaModeConfig s_config = {};
bool s_active = false;
const char* s_lastError = nullptr;

// ============ 时钟 mask 缓冲 (用于草膨胀边框) ============
// 64×64 = 4096 bit = 512 字节; 用 byte mask 简化
uint8_t s_clockMask[64 * 64] = {};

// ============ 像素绘制 ============

inline uint16_t toRGB565(uint8_t r, uint8_t g, uint8_t b) {
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

// 把一段 PROGMEM 像素 (fmt=5 或 7) 画到屏幕
//   sourceY 范围: [yMin, yMax) 内的 sprite 像素才画 (网格切片用)
//   localOffsetY: sprite 局部 y - sourceYMin
//   centerX/Y: 子图中心在屏幕上的位置
//   spriteW/spriteH: 子图尺寸 (切片后)
//   tintColor: nullptr = 不染色; 否则灰度 lum × baseColor
void drawPixelsRange(
  MatrixPanel_I2S_DMA* display,
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
  const float ox = centerX - (float)spriteW * 0.5f * scale;
  const float oy = centerY - (float)spriteH * 0.5f * scale;
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
    int px = (int)(ox + (float)x * scale + 0.5f);
    int py = (int)(oy + (float)localY * scale + 0.5f);
    if (px < 0 || px >= SCREEN_W || py < 0 || py >= SCREEN_H) continue;
    display->drawPixelRGB888(px, py, r, g, b);
  }
}

// 整张 sprite 画到屏幕
void drawSpriteWhole(
  MatrixPanel_I2S_DMA* display,
  const TerrariaSprite* sprite,
  float centerX, float centerY, float scale,
  const uint8_t* tintColor = nullptr
) {
  if (sprite == nullptr) return;
  drawPixelsRange(display, sprite->pixels, sprite->pixelCount, sprite->fmt,
                   0, sprite->h, centerX, centerY,
                   sprite->w, sprite->h, scale, tintColor);
}

// 网格 sprite 取第 gridIndex 段 (每段 56 高度)
void drawSpriteGrid(
  MatrixPanel_I2S_DMA* display,
  const TerrariaSprite* sprite,
  uint8_t gridIndex,
  float centerX, float centerY, float scale,
  const uint8_t* tintColor = nullptr
) {
  if (sprite == nullptr) return;
  uint16_t yMin = gridIndex * FRAME_H;
  uint16_t yMax = yMin + FRAME_H;
  if (yMax > sprite->h) return;
  drawPixelsRange(display, sprite->pixels, sprite->pixelCount, sprite->fmt,
                   yMin, yMax, centerX, centerY,
                   sprite->w, FRAME_H, scale, tintColor);
}

// 多帧差异 sprite: 画指定帧
//   frame 0 = base;  frame N = base 整张 + delta[N-1] 整张 (delta 像素覆盖)
void drawSpriteAnimFrame(
  MatrixPanel_I2S_DMA* display,
  const TerrariaSpriteAnim* anim,
  uint8_t frameIndex,
  float centerX, float centerY, float scale,
  const uint8_t* tintColor = nullptr
) {
  if (anim == nullptr) return;
  // 画 base
  drawPixelsRange(display, anim->base.pixels, anim->base.pixelCount, anim->fmt,
                   0, anim->h, centerX, centerY,
                   anim->w, anim->h, scale, tintColor);
  // 画 delta (如果不是 frame 0)
  if (frameIndex == 0) return;
  if (frameIndex - 1 >= anim->frameCount - 1) return;
  TerrariaFrameBlock delta;
  memcpy_P(&delta, &anim->deltas[frameIndex - 1], sizeof(delta));
  drawPixelsRange(display, delta.pixels, delta.pixelCount, anim->fmt,
                   0, anim->h, centerX, centerY,
                   anim->w, anim->h, scale, tintColor);
}

// ============ 角色皮肤层取片画 ============

void drawSkinLayer(
  MatrixPanel_I2S_DMA* display,
  uint8_t layer, uint8_t gridIndex, bool useGrid,
  const uint8_t* tintColor,
  float cx, float cy, float scale
) {
  const TerrariaSprite* sprite = TerrariaSprites::getPlayerLayer(layer);
  if (sprite == nullptr) return;
  if (useGrid && isPlayerGridLayer(layer)) {
    drawSpriteGrid(display, sprite, gridIndex, cx, cy, scale, tintColor);
  } else {
    drawSpriteWhole(display, sprite, cx, cy, scale, tintColor);
  }
}

// 胸甲网格画 (4 套全是 9×4 网格已切成 6 段)
void drawArmorBodyGrid(
  MatrixPanel_I2S_DMA* display,
  uint16_t bodyId, uint8_t gridIndex,
  float cx, float cy, float scale
) {
  const TerrariaSprite* sprite = TerrariaSprites::getArmorBody(bodyId);
  if (sprite == nullptr) return;
  drawSpriteGrid(display, sprite, gridIndex, cx, cy, scale, nullptr);
}

// 腿甲 (frame 0)
void drawArmorLegs(
  MatrixPanel_I2S_DMA* display,
  uint16_t legsId, float cx, float cy, float scale
) {
  const TerrariaSprite* sprite = TerrariaSprites::getArmorLegs(legsId);
  if (sprite == nullptr) return;
  drawSpriteWhole(display, sprite, cx, cy, scale, nullptr);
}

// 头甲 (frame 0)
void drawArmorHead(
  MatrixPanel_I2S_DMA* display,
  uint16_t headId, float cx, float cy, float scale
) {
  const TerrariaSprite* sprite = TerrariaSprites::getArmorHead(headId);
  if (sprite == nullptr) return;
  drawSpriteWhole(display, sprite, cx, cy, scale, nullptr);
}

// ============ 翅膀渲染 ============

void drawWings(
  MatrixPanel_I2S_DMA* display,
  uint16_t wingId,
  float playerCenterX, float playerCenterY, float playerScale,
  uint8_t wingSpeedPct
) {
  const TerrariaSpriteAnim* anim = TerrariaSprites::getWings(wingId);
  if (anim == nullptr) return;

  // 帧索引: t = animTime * 60 * (wingSpeedPct/100), frame = (t/5) % 3 (普通翅膀)
  // 强制扇动 (站立态也扇)
  float wingTime = s_animTimeSec * 60.0f * ((float)wingSpeedPct / 100.0f);
  uint8_t frameIdx = ((uint32_t)(wingTime / 5.0f)) % 3;
  if (frameIdx >= anim->frameCount) frameIdx = anim->frameCount - 1;

  // 翅膀挂载点 (角色 sprite 局部 = (W/2, H/2 + 7), direction=1)
  // 翅膀中心相对角色 sprite 中心: (num2 - 9) * dir = -9 * 1 = -9
  // 翅膀中心 y 偏移: 7 + 2 = 9
  // 转屏坐标: (-9) * scale 水平, +9 * scale 垂直
  float wingCx = playerCenterX + (-9.0f) * playerScale;
  float wingCy = playerCenterY + 9.0f * playerScale;

  drawSpriteAnimFrame(display, anim, frameIdx, wingCx, wingCy, playerScale);
}

// ============ 武器渲染 ============

// 把整张 sprite (PROGMEM) 旋转/翻转后画到屏幕
//   旋转用最简版: 中心对齐, 任意角度 (不预切, 每像素直接算)
void drawWeapon(
  MatrixPanel_I2S_DMA* display,
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
  float drawCx, drawCy;
  if (wp->useStyle == 5) {
    drawCx = handX;
    drawCy = handY;
  } else {
    drawCx = handX + (float)sprite->w / 2.0f * playerScale * dir;
    drawCy = handY - (float)sprite->h / 2.0f * playerScale;
  }

  // 旋转角度 (棱镜 90°)
  const float rad = (float)wp->rotateDeg * (float)M_PI / 180.0f;
  const bool needRotate = (wp->rotateDeg != 0);
  const bool needFlip = (wp->useStyle == 5 && dir < 0);
  const float cosR = cosf(rad);
  const float sinR = sinf(rad);

  // 直接遍历 sprite 像素, 算转换后位置画到屏幕
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
    int px = (int)(ox + lx * playerScale + 0.5f);
    int py = (int)(oy + ly * playerScale + 0.5f);
    if (px < 0 || px >= SCREEN_W || py < 0 || py >= SCREEN_H) continue;
    display->drawPixelRGB888(px, py, r, g, b);
  }
}

// 法师烈焰光团 (3542): 手部画 dust_242_f0 + 1px 抖动
void drawWeaponOrb(MatrixPanel_I2S_DMA* display, float cx, float cy, float scale) {
  const TerrariaSprite* sprite = TerrariaSprites::getDust242();
  if (sprite == nullptr) return;
  // 手部位置 (useStyle=5 朝右)
  float handLocalX = 26.0f;
  float handLocalY = 38.0f;
  float handX = cx + (handLocalX - FRAME_W / 2.0f) * scale;
  float handY = cy + (handLocalY - FRAME_H / 2.0f) * scale;
  // 1px 抖动
  uint32_t tick = (uint32_t)(s_animTimeSec * 60.0f);
  int dy = ((tick % 5) < 3) ? 0 : 1;
  drawSpriteWhole(display, sprite, handX, handY + dy, scale, nullptr);
}

// ============ 角色 16 step 合成 ============

void drawPlayer(
  MatrixPanel_I2S_DMA* display,
  uint8_t character, uint16_t weaponId,
  float playerScale, float cx, float cy
) {
  const CharSet& cs = kCharSets[character];
  const uint16_t headId = cs.armorHead;
  const uint16_t bodyId = cs.armorBody;
  const uint16_t legsId = cs.armorLegs;

  const bool isHolding = (weaponId != 0);
  const bool usesCompositeArm = isHolding;

  // 网格位选择
  const uint8_t backArmGrid = usesCompositeArm ? GRID_BACK_ARM : GRID_TORSO;
  const uint8_t frontArmGrid = usesCompositeArm ? GRID_FRONT_ARM : GRID_TORSO;

  // ===== Step 1-2: 后臂皮肤 + 后臂内衬 + 后臂上衣袖 =====
  drawSkinLayer(display, 5, backArmGrid, usesCompositeArm, COLOR_SKIN, cx, cy, playerScale);
  drawSkinLayer(display, 8, backArmGrid, usesCompositeArm, COLOR_UNDERSHIRT, cx, cy, playerScale);
  drawSkinLayer(display, 13, backArmGrid, usesCompositeArm, COLOR_SHIRT, cx, cy, playerScale);

  // ===== Step 3-4: 后臂装甲 + 后肩装甲 =====
  drawArmorBodyGrid(display, bodyId, GRID_BACK_ARM, cx, cy, playerScale);
  drawArmorBodyGrid(display, bodyId, GRID_BACK_SHOULDER, cx, cy, playerScale);

  // ===== Step 5: 翅膀 =====
  if (cs.wings != 0) {
    drawWings(display, cs.wings, cx, cy, playerScale, s_config.wingSpeed);
  }

  // ===== Step 6-8: 腿/裤皮肤 + 裤子 + 鞋子 =====
  drawSkinLayer(display, 10, 0, false, COLOR_SKIN, cx, cy, playerScale);
  drawSkinLayer(display, 11, 0, false, COLOR_PANTS, cx, cy, playerScale);
  drawSkinLayer(display, 12, 0, false, COLOR_SHOE, cx, cy, playerScale);

  // ===== Step 9: 护腿装甲 =====
  drawArmorLegs(display, legsId, cx, cy, playerScale);

  // ===== Step 10-12: 躯干皮肤 + 内衬 + 上衣 =====
  drawSkinLayer(display, 3, GRID_TORSO, usesCompositeArm, COLOR_SKIN, cx, cy, playerScale);
  drawSkinLayer(display, 4, GRID_TORSO, usesCompositeArm, COLOR_UNDERSHIRT, cx, cy, playerScale);
  drawSkinLayer(display, 6, GRID_TORSO, usesCompositeArm, COLOR_SHIRT, cx, cy, playerScale);

  // ===== Step 13: 躯干装甲 =====
  drawArmorBodyGrid(display, bodyId, GRID_TORSO, cx, cy, playerScale);

  // ===== Step 14: 头/眼/眼珠 =====
  drawSkinLayer(display, 0, 0, false, COLOR_SKIN, cx, cy, playerScale);
  drawSkinLayer(display, 1, 0, false, nullptr, cx, cy, playerScale);  // 眼白不染
  drawSkinLayer(display, 2, 0, false, COLOR_EYE, cx, cy, playerScale);

  // ===== Step 15: 头甲 (持械时下移 2px) =====
  float headOffY = isHolding ? 2.0f : 0.0f;
  drawArmorHead(display, headId, cx, cy + headOffY * playerScale, playerScale);

  // ===== Step 16: 头发 — Lunar 头甲全包式跳过 (4 职业全跳) =====

  // ===== 武器 + 前臂层 =====
  // 武器在前臂之前画
  bool hasOrb = false;
  if (isHolding) {
    drawWeapon(display, weaponId, cx, cy, playerScale, 1);
    if (weaponId == 3542) hasOrb = true;
  }

  // 前臂层
  drawSkinLayer(display, 7, frontArmGrid, usesCompositeArm, COLOR_SKIN, cx, cy, playerScale);
  drawSkinLayer(display, 8, frontArmGrid, usesCompositeArm, COLOR_UNDERSHIRT, cx, cy, playerScale);
  drawSkinLayer(display, 13, frontArmGrid, usesCompositeArm, COLOR_SHIRT, cx, cy, playerScale);
  drawArmorBodyGrid(display, bodyId, GRID_FRONT_ARM, cx, cy, playerScale);
  if (usesCompositeArm) {
    drawArmorBodyGrid(display, bodyId, GRID_FRONT_SHOULDER, cx, cy, playerScale);
  }
  if (!isLunarBody(bodyId)) {
    drawSkinLayer(display, 9, frontArmGrid, usesCompositeArm, COLOR_SKIN, cx, cy, playerScale);
  }

  // 烈焰光团 (在前臂之后)
  if (hasOrb) {
    drawWeaponOrb(display, cx, cy, playerScale);
  }
}

// ============ 时钟 + 草膨胀边框 ============

void drawClockWithBorder(MatrixPanel_I2S_DMA* display) {
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
        display->drawPixelRGB888(x, y, bgIn[0], bgIn[1], bgIn[2]);
      } else if (minD == 2) {
        display->drawPixelRGB888(x, y, bgOut[0], bgOut[1], bgOut[2]);
      }
    }
  }

  // 5. 字本体覆盖最上层
  for (int y = minY; y <= maxY; y++) {
    for (int x = minX; x <= maxX; x++) {
      if (s_clockMask[y * SCREEN_W + x]) {
        display->drawPixelRGB888(x, y, tc[0], tc[1], tc[2]);
      }
    }
  }
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
}

void applyConfig(const TerrariaModeConfig& config) {
  s_config = config;
  s_animStartMs = millis();
  s_animTimeSec = 0.0f;
  s_active = true;
  s_lastError = nullptr;
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

  // ===== 1. 背景: 渐变天空 =====
  for (int y = 0; y < SCREEN_H; y++) {
    float t = (float)y / 63.0f;
    uint8_t r = (uint8_t)(0x34 * (1 - t) + 0x65 * t);
    uint8_t g = (uint8_t)(0x2C * (1 - t) + 0x89 * t);
    uint8_t b = (uint8_t)(0xF3 * (1 - t) + 0xF9 * t);
    for (int x = 0; x < SCREEN_W; x++) {
      display->drawPixelRGB888(x, y, r, g, b);
    }
  }

  // ===== 1.5 3 朵手画云 =====
  static const char* kCloudShapes[3][4] = {
    {"..####....", ".######...", "##########", ".########."},
    {".####.",     "######",     ".####.",     nullptr},
    {"...####...", ".########.", "##########", "..######.."},
  };
  static const uint8_t kCloudPos[3][2] = {{4, 6}, {26, 14}, {44, 4}};

  for (int i = 0; i < 3; i++) {
    int ox = kCloudPos[i][0], oy = kCloudPos[i][1];
    for (int row = 0; row < 4; row++) {
      const char* line = kCloudShapes[i][row];
      if (line == nullptr) break;
      for (int col = 0; line[col] != '\0'; col++) {
        if (line[col] == '#') {
          int px = ox + col, py = oy + row;
          if (px >= 0 && px < SCREEN_W && py >= 0 && py < SCREEN_H) {
            display->drawPixelRGB888(px, py, 0xE8, 0xF0, 0xFF);
          }
        }
      }
    }
  }

  // ===== 1.6 草地: biome_forest_0/1/2 三块循环铺, blockSize=5 =====
  const TerrariaSprite* tiles[3] = {
    TerrariaSprites::getBiomeForest(0),
    TerrariaSprites::getBiomeForest(1),
    TerrariaSprites::getBiomeForest(2),
  };
  if (tiles[0] && tiles[1] && tiles[2]) {
    constexpr int blockSize = 5;
    constexpr int groundY = SCREEN_H - blockSize;
    int x = 0, idx = 0;
    while (x < SCREEN_W) {
      const TerrariaSprite* tile = tiles[idx % 3];
      const float sx = (float)blockSize / (float)tile->w;
      const float sy = (float)blockSize / (float)tile->h;
      const uint8_t stride = (tile->fmt == 7) ? 7 : 5;
      for (uint16_t i = 0; i < tile->pixelCount; i++) {
        const uint8_t* p = tile->pixels + (size_t)i * stride;
        uint16_t tx, ty;
        uint8_t r, g, b;
        if (tile->fmt == 7) {
          tx = pgm_read_byte(p) | (pgm_read_byte(p+1) << 8);
          ty = pgm_read_byte(p+2) | (pgm_read_byte(p+3) << 8);
          r = pgm_read_byte(p+4); g = pgm_read_byte(p+5); b = pgm_read_byte(p+6);
        } else {
          tx = pgm_read_byte(p); ty = pgm_read_byte(p+1);
          r = pgm_read_byte(p+2); g = pgm_read_byte(p+3); b = pgm_read_byte(p+4);
        }
        int px = x + (int)((float)tx * sx + 0.5f);
        int py = groundY + (int)((float)ty * sy + 0.5f);
        if (px < 0 || px >= SCREEN_W || py < 0 || py >= SCREEN_H) continue;
        display->drawPixelRGB888(px, py, r, g, b);
      }
      x += blockSize;
      idx++;
    }
  }

  // ===== 取角色配置 =====
  const float playerScale = (float)s_config.playerScale / 100.0f;
  const float cx = (float)s_config.playerX;
  const float cy = (float)s_config.playerY;
  const uint8_t character = s_config.character;
  const CharSet& charSet = kCharSets[character];

  // ===== 2. 守卫 (仅召唤师) =====
  if (charSet.hasGuardian) {
    const TerrariaSpriteAnim* guardian = TerrariaSprites::getGuardian(623);
    if (guardian) {
      uint32_t tick = (uint32_t)(s_animTimeSec * 60.0f);
      uint8_t idleFrame = (tick / 9) % 8;
      float bobY = sinf((float)tick / 72.0f * (float)M_PI * 2.0f) * 1.5f;
      float gx = cx + (float)s_config.guardianX;
      float gy = cy + (float)s_config.guardianY + bobY;
      drawSpriteAnimFrame(display, guardian, idleFrame, gx, gy, playerScale);
    }
  }

  // ===== 3. 角色合成 =====
  drawPlayer(display, character, s_config.weaponId, playerScale, cx, cy);

  // ===== 4. 时钟 + 草膨胀边框 =====
  drawClockWithBorder(display);
}

}  // namespace TerrariaClockEffect
