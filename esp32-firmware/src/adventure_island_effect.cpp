// ============================================================
// Adventure Island 渲染器
// 移植自 website/src/utils/adventureIslandRenderer.js
// 资产: include/theme_assets/adventure_island/sprites_*.h
// ============================================================

#include "adventure_island_effect.h"

#include <math.h>
#include <pgmspace.h>
#include <string.h>
#include <time.h>

#include "display_manager.h"
#include "theme_assets/adventure_island/index.h"

namespace {

// ============ 屏幕常量 ============
constexpr int SCREEN_W = 64;
constexpr int SCREEN_H = 64;

// ============ 默认参数 (从 Vue 端调好的值搬过来, 不可变) ============
// 角色布局
constexpr int8_t  kBgYOffset     = -12;
constexpr uint8_t kCharX         = 6;
constexpr uint8_t kGroundY       = 59;
constexpr uint8_t kJumpHeight    = 21;
constexpr uint8_t kCharHitW      = 16;

// 速度
constexpr float kBgSpeed   = 0.5f;
constexpr float kEntSpeed  = 0.6f;

// 缩放
constexpr float kObstacleScale = 0.73f;
constexpr float kItemScale     = 0.73f;

// 生成节奏
constexpr uint16_t kSpawnInterval     = 100;   // 板载实际帧率 < 30fps, 用 100 帧补偿到约 5 秒
constexpr uint8_t  kSpawnJitter       = 0;
constexpr uint16_t kEggCooldownFrames = 5400;  // 蛋(滑板/仙女)最小间隔 90 秒 @30fps; 开局斧蛋走单独支路, 不受影响
constexpr uint8_t  kEggSkipPercent    = 50;    // 抽签到"蛋"段时再掷一次, 50% 跳过本次出蛋
constexpr uint8_t  kRightZoneClear    = 40;
constexpr uint8_t  kMinJumpYToFruit   = 8;

// 滑板加速倍率
constexpr float kSkateboardBoost = 2.0f;
constexpr uint8_t kStumbleFrames = 24;
constexpr uint8_t kStumbleHoist  = 12;

// 滑板必栽阈值: 滑板态下成功跳过 >= 此值次障碍物后, 下一颗石头必撞
constexpr uint8_t kSkateForceWipeoutAt = 15;

// 实体高度
constexpr uint8_t kCrowYOffset = 36;
constexpr uint8_t kFruitAirY   = 36;

// 仙女
constexpr int8_t  kFairyOffsetX = -14;
constexpr uint8_t kFairyOffsetY = 41;

// 投掷距离
constexpr uint8_t kThrowDist     = 32;
constexpr uint8_t kThrowRange    = 16;
constexpr uint8_t kCrowJumpDist  = 40;
constexpr uint8_t kCrowJumpRange = 12;

// 起跳提前
constexpr float kReachFactorRun        = 0.5f;
constexpr float kReachFactorSkateboard = 0.6f;

// 斧头
constexpr uint8_t kAxeSpeed     = 2;
constexpr uint8_t kAxeAnimSpeed = 3;

// HUD 时钟
constexpr uint8_t kClockX        = 13;
constexpr uint8_t kClockY        = 2;
constexpr uint8_t kClockSpacing  = 1;
constexpr uint8_t kClockColonGap = 2;

// ============ 实体上限 ============
constexpr uint8_t kMaxEntities = 16;
constexpr uint8_t kMaxAxes = 2;

// ============ 类型 ============
enum EntityType : uint8_t {
  ET_ENEMY = 0,
  ET_OBS   = 1,
  ET_FRUIT = 2,
  ET_EGG   = 3,
};

// 敌人 sub
enum EnemySub : uint8_t {
  ES_SNAIL = 0, ES_CROW = 1, ES_BOAR = 2, ES_SNAKE = 3,
};
// 障碍 sub
enum ObsSub : uint8_t {
  OS_ROCK = 0, OS_FIRE = 1,
};
// 蛋内容
enum EggSub : uint8_t {
  EGG_AXE = 0, EGG_FAIRY = 1, EGG_SKATEBOARD = 2,
};
// 蛋阶段
enum EggStage : uint8_t {
  STG_ROLLING = 0, STG_FLYING = 1, STG_CRACKING = 2, STG_ITEM = 3,
};

struct Entity {
  uint8_t  type;       // EntityType
  uint8_t  sub;
  float    x;
  uint16_t f;
  // egg 专用
  uint8_t  stage;
  uint8_t  flyT;
  uint8_t  flyDuration;
  float    flyVx;
  float    flyY;
  uint8_t  crackT;
  // 滑板撞石头掷骰标记 (避免同帧多次掷骰)
  bool     failChecked;
  // 滑板态下"已成功越过角色"标记 (用于 skateJumpOverCount, 避免重复计数)
  bool     passedByChar;
  // 敌人死亡动画
  bool     dying;
  uint16_t dyT;
  float    dyOffX;
  float    dyOffY;
  float    dyVx;
  float    dyVy;
};

struct Axe {
  float    x;
  float    y;     // 角色当时的 jumpY
  uint16_t f;
};

struct Character {
  uint8_t  type;        // 0=run, 1=skateboard
  bool     hasAxe;
  bool     jumping;
  float    jumpY;
  float    jumpV;
  uint8_t  throwT;
  uint8_t  landing;
  uint16_t fairyT;
  uint8_t  stumbleT;    // 磕到滑板的停顿帧 (>0 显示 stumble)
  uint8_t  skateJumpOverCount; // 滑板态下成功跳过的障碍物计数; >=15 时下一颗石头必撞
};

struct SceneState {
  uint32_t  frame;
  float     scrollX;
  Character ch;
  Entity    entities[kMaxEntities];
  uint8_t   entityCount;
  Axe       axes[kMaxAxes];
  uint8_t   axeCount;
  uint16_t  spawnCooldown;
  uint16_t  eggCooldown;
  bool      firstAxeSpawned;
  uint8_t   eggSeq;
};

// ============ 模块状态 ============
bool s_active = false;
SceneState s_state = {};
uint32_t s_lastTickMs = 0;

// ============ putPixel + 行偏移补偿 ============
inline void putPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;
  int by = (y + 1) % SCREEN_H;
  DisplayManager::animationBuffer[by][x] = MatrixPanel_I2S_DMA::color565(r, g, b);
}

inline void clearBuffer() {
  memset(&DisplayManager::animationBuffer[0][0], 0, sizeof(DisplayManager::animationBuffer));
}

struct DecodedSpritePixel {
  uint16_t sx;
  uint16_t sy;
  uint8_t r;
  uint8_t g;
  uint8_t b;
};

bool readSpritePixel(const AISprite* spr, uint16_t i, DecodedSpritePixel& out) {
  const uint8_t* src = spr->pixels;
  if (spr->fmt == 5) {
    const uint8_t* p = src + (size_t)i * 5;
    out.sx = pgm_read_byte(p);
    out.sy = pgm_read_byte(p + 1);
    out.r = pgm_read_byte(p + 2);
    out.g = pgm_read_byte(p + 3);
    out.b = pgm_read_byte(p + 4);
    return true;
  }
  if (spr->fmt == 8) {
    const uint8_t* p = src + (size_t)i * 3;
    uint16_t pos = (uint16_t)pgm_read_byte(p) | ((uint16_t)pgm_read_byte(p + 1) << 8);
    uint8_t paletteIdx = pgm_read_byte(p + 2);
    if (spr->w == 0 || paletteIdx >= kAIPaletteColorCount) return false;
    const uint8_t* color = kAIPalette + (size_t)paletteIdx * 3;
    out.sx = pos % spr->w;
    out.sy = pos / spr->w;
    out.r = pgm_read_byte(color);
    out.g = pgm_read_byte(color + 1);
    out.b = pgm_read_byte(color + 2);
    return out.sy < spr->h;
  }
  return false;
}

// Sprite 绘制
//   dx, dy: sprite 左上角在屏幕的位置
//   flip: 水平镜像 (本主题暂不用, 保留接口)
//   scale: 1.0 = 原大; 其它 = 最近邻缩放
//
// 实现:
//   - scale == 1: 直接遍历像素列表 putPixel (零额外内存)
//   - scale != 1: 每个源像素映射到目标矩形, 循环 putPixel 填充
void drawSprite(const AISprite* spr, int dx, int dy, bool flip, float scale) {
  if (spr == nullptr) return;
  const uint16_t w = spr->w;
  const uint16_t h = spr->h;
  const uint16_t n = spr->pixelCount;

  if (scale == 1.0f) {
    for (uint16_t i = 0; i < n; i++) {
      DecodedSpritePixel px;
      if (!readSpritePixel(spr, i, px)) continue;
      uint16_t sx = px.sx;
      uint16_t sy = px.sy;
      int tx = dx + (flip ? (w - 1 - sx) : sx);
      int ty = dy + sy;
      putPixel(tx, ty, px.r, px.g, px.b);
    }
    return;
  }

  // 缩放: JS 端反向最近邻采样, 每个目标像素 -> floor(dyy/scale) 源像素
  //   为了跟 JS 完全一致, 先把稀疏 PROGMEM 像素列表解到稠密 RGBA 查找表
  //   sprite 最大尺寸 (本主题): 角色 24x32, 蛋 24x16. 用 32x32 buffer 兜底
  static uint16_t s_lut565[32 * 32];
  static uint32_t s_lutMask[32];
  if (w > 32 || h > 32) return;   // 安全门 (scale != 1 仅用于敌人/障碍/水果/蛋/斧, 都不超 32x32)
  const size_t stride = (size_t)w;
  // 清 alpha
  for (uint16_t y = 0; y < h; y++) {
    for (uint16_t x = 0; x < w; x++) {
      if (x == 0) s_lutMask[y] = 0;
    }
  }
  // 填稀疏像素
  for (uint16_t i = 0; i < n; i++) {
    DecodedSpritePixel px;
    if (!readSpritePixel(spr, i, px)) continue;
    uint16_t sx = px.sx;
    uint16_t sy = px.sy;
    if (sx >= w || sy >= h) continue;
    const size_t idx = (size_t)sy * stride + (size_t)sx;
    s_lut565[idx] = MatrixPanel_I2S_DMA::color565(px.r, px.g, px.b);
    s_lutMask[sy] |= (uint32_t(1) << sx);
  }

  // 反向最近邻 (跟 JS Math.floor(dyy/scale) 一致)
  const int dw = (int)(w * scale + 0.5f);
  const int dh = (int)(h * scale + 0.5f);
  const int dwClamped = dw < 1 ? 1 : dw;
  const int dhClamped = dh < 1 ? 1 : dh;
  for (int dyy = 0; dyy < dhClamped; dyy++) {
    int sy = (int)(dyy / scale);
    if (sy >= h) sy = h - 1;
    for (int dxx = 0; dxx < dwClamped; dxx++) {
      int sxIdx = (int)(dxx / scale);
      if (sxIdx >= w) sxIdx = w - 1;
      int sxFinal = flip ? (w - 1 - sxIdx) : sxIdx;
      const size_t idx = (size_t)sy * stride + (size_t)sxFinal;
      if ((s_lutMask[sy] & (uint32_t(1) << sxFinal)) == 0) continue;
      int tx = dx + dxx;
      int ty = dy + dyy;
      if (tx < 0 || tx >= SCREEN_W || ty < 0 || ty >= SCREEN_H) continue;
      int by = (ty + 1) % SCREEN_H;
      DisplayManager::animationBuffer[by][tx] = s_lut565[idx];
    }
  }
}

// ============ 背景滚动绘制 ============
//
// 背景 sprite 是 48x82 (bg.tile), 屏幕 64x64.
// JS 端逻辑:
//   srcYOffset = (bgH - SCREEN_H) + bgYOffset = (82 - 64) + (-12) = 6
//   每屏 y 从源 y = srcYOffset + screenY 取
//   每屏 x 从源 x = ((screenX + scrollX) mod bgW) 取
//
// 这里用 bg sprite 直接做横向循环 + Y 偏移
void drawBackground() {
  const AISprite* tile = AISprites::getByKey("bg.tile");
  if (tile == nullptr) return;
  const uint16_t tw = tile->w;
  const uint16_t th = tile->h;
  const uint16_t n  = tile->pixelCount;

  // 把 PROGMEM 像素列表解到稠密 RGB 表 (48 x 82 x 3 = ~12 KB)
  // 静态 BSS, 只在第一次填充
  static uint16_t s_bg565[82][48] = {};
  static bool s_bgFilled = false;
  if (!s_bgFilled) {
    for (uint16_t i = 0; i < n; i++) {
      DecodedSpritePixel px;
      if (!readSpritePixel(tile, i, px)) continue;
      uint16_t sx = px.sx;
      uint16_t sy = px.sy;
      if (sx >= 48 || sy >= 82) continue;
      s_bg565[sy][sx] = MatrixPanel_I2S_DMA::color565(px.r, px.g, px.b);
    }
    s_bgFilled = true;
  }
  // 注: bg 像素列表里没存"透明像素" → s_bgRgb 默认 0 = 黑色背景天空,
  // 但实际 bg.tile 是不透明全填的 (从 PNG 转换时无透明), 所以全像素都有值.

  // 滚动 + Y 偏移
  const int srcYOffset = (int)th - SCREEN_H + kBgYOffset;
  const int sx0 = (int)s_state.scrollX;
  for (int dy = 0; dy < SCREEN_H; dy++) {
    int sy = srcYOffset + dy;
    if (sy < 0 || sy >= (int)th) continue;
    for (int dx = 0; dx < SCREEN_W; dx++) {
      int tx = ((dx + sx0) % tw + tw) % tw;
      int by = (dy + 1) % SCREEN_H;
      // 全部画 (背景没有透明)
      DisplayManager::animationBuffer[by][dx] = s_bg565[sy][tx];
    }
  }
}

// ============ 角色 sprite key 选择 ============
const char* getCharSpriteKey(uint32_t frame) {
  const Character& ch = s_state.ch;
  // 磕到优先级最高 (滑板撞石头后的弹起+下落动画)
  if (ch.stumbleT > 0) return "higgins.stumble";
  // 投掷: 只显示 frame3 (滑板状态下不切换 sprite)
  if (ch.throwT > 0 && ch.type != 1 /*skateboard*/) {
    return "higgins.throw.3";
  }
  // 滑板
  if (ch.type == 1) {
    if (ch.jumping) return "higgins.skateboard_land.0";  // 滑板跳跃全程用 land
    if (ch.landing > 0) return "higgins.skateboard_land.0";
    static char buf[24];
    int idx = (frame / 8) % 2;
    snprintf(buf, sizeof(buf), "higgins.skateboard.%d", idx);
    return buf;
  }
  // 普通跑步状态下跳跃 → throw.2 (脸朝前)
  if (ch.jumping) return "higgins.throw.2";
  // 跑步循环
  static char buf2[20];
  int idx = (frame / 6) % 3;
  snprintf(buf2, sizeof(buf2), "higgins.run.%d", idx);
  return buf2;
}

// ============ 实体绘制 ============

void drawEntity(const Entity& e) {
  const char* key = nullptr;
  int yOff = 0;
  float scale = 1.0f;
  uint16_t af = (e.f / 6) % 2;
  char keyBuf[24];

  if (e.type == ET_ENEMY) {
    if (e.dying) {
      // 死亡 sprite: 蜗牛/乌鸦用翻转 dead, 蛇/野猪用首帧
      if (e.sub == ES_SNAIL)      key = "enemy.snail.dead";
      else if (e.sub == ES_CROW)  key = "enemy.crow.dead";
      else if (e.sub == ES_BOAR)  key = "enemy.boar.0";
      else                        key = "enemy.snake.0";
    } else {
      snprintf(keyBuf, sizeof(keyBuf), "enemy.%s.%u",
               e.sub == ES_SNAIL ? "snail" :
               e.sub == ES_CROW  ? "crow"  :
               e.sub == ES_BOAR  ? "boar"  : "snake", (unsigned)af);
      key = keyBuf;
    }
    if (e.sub == ES_CROW) yOff = -kCrowYOffset;
  } else if (e.type == ET_OBS) {
    if (e.sub == OS_ROCK) {
      key = "obstacle.rock";
    } else {
      snprintf(keyBuf, sizeof(keyBuf), "obstacle.fire.%u", (unsigned)((e.f / 4) % 4));
      key = keyBuf;
    }
    scale = kObstacleScale;
  } else if (e.type == ET_EGG) {
    if (e.stage == STG_ROLLING) {
      key = "item.egg";
    } else if (e.stage == STG_FLYING) {
      key = "item.egg";
      yOff = (int)e.flyY;
    } else if (e.stage == STG_CRACKING) {
      key = "item.egg_cracked";
    } else if (e.stage == STG_ITEM) {
      if (e.sub == EGG_AXE) key = "item.axe.0";
      else if (e.sub == EGG_FAIRY) key = "item.fairy";
      else if (e.sub == EGG_SKATEBOARD) key = "item.skateboard";
      else key = "item.axe.0";
    }
    scale = kItemScale;
  } else if (e.type == ET_FRUIT) {
    snprintf(keyBuf, sizeof(keyBuf), "fruit.%u", (unsigned)e.sub);
    key = keyBuf;
    yOff = -kFruitAirY;
  }

  if (key == nullptr) return;
  const AISprite* spr = AISprites::getByKey(key);
  if (spr == nullptr) return;
  int drawH = (int)(spr->h * scale + 0.5f);
  // 死亡偏移 (相对原位置, 让敌人独立做抛物线 + 穿过地面)
  int dyOffX = e.dying ? (int)e.dyOffX : 0;
  int dyOffY = e.dying ? (int)e.dyOffY : 0;
  drawSprite(spr, (int)e.x + dyOffX, kGroundY + yOff - drawH + dyOffY, false, scale);
}

// ============ HUD 时钟 ============
//   8x8 数字, HH:MM 4 位 + 冒号
void drawClock() {
  time_t now = time(nullptr);
  struct tm tmInfo;
  localtime_r(&now, &tmInfo);
  uint8_t h = tmInfo.tm_hour;
  uint8_t m = tmInfo.tm_min;

  uint8_t digits[4] = { (uint8_t)(h / 10), (uint8_t)(h % 10),
                        (uint8_t)(m / 10), (uint8_t)(m % 10) };

  int x = kClockX;
  for (int i = 0; i < 4; i++) {
    const AISprite* spr = AISprites::getDigit(digits[i]);
    if (spr) drawSprite(spr, x, kClockY, false, 1.0f);
    x += 8 + kClockSpacing;
    if (i == 1) {
      // HH 完了, 中间画冒号 (跟 JS 端一致: 白主体 + 红阴影)
      if (kClockColonGap >= 2) {
        int colonX = x + (kClockColonGap - 2) / 2;
        int colonY = kClockY + 2;
        // 上点
        putPixel(colonX, colonY,     0xff, 0xff, 0xff);
        putPixel(colonX, colonY + 1, 0xa4, 0x00, 0x00);
        // 下点
        putPixel(colonX, colonY + 4, 0xff, 0xff, 0xff);
        putPixel(colonX, colonY + 5, 0xa4, 0x00, 0x00);
      }
      x += kClockColonGap;
    }
  }
}

}  // namespace



// ============ 状态机辅助 ============

namespace {

// Arduino random 在 ESP32 用法
inline int rndi(int hi) { return (int)random(0, hi); }
inline int rndRange(int lo, int hi) { return lo + (int)random(0, hi - lo); }
inline float rndf() { return (float)random(0, 10000) / 10000.0f; }

void resetSceneState() {
  memset(&s_state, 0, sizeof(s_state));
  s_state.spawnCooldown = 60;          // 开局 2 秒就出斧蛋
  s_state.firstAxeSpawned = false;
  s_state.eggSeq = 0;
}

void spawnEnemy(uint8_t sub) {
  if (s_state.entityCount >= kMaxEntities) return;
  Entity& e = s_state.entities[s_state.entityCount++];
  memset(&e, 0, sizeof(e));
  e.type = ET_ENEMY;
  e.sub  = sub;
  e.x    = SCREEN_W;
}

void spawnObstacle(uint8_t sub) {
  if (s_state.entityCount >= kMaxEntities) return;
  Entity& e = s_state.entities[s_state.entityCount++];
  memset(&e, 0, sizeof(e));
  e.type = ET_OBS;
  e.sub  = sub;
  e.x    = SCREEN_W;
}

void spawnFruit() {
  if (s_state.entityCount >= kMaxEntities) return;
  Entity& e = s_state.entities[s_state.entityCount++];
  memset(&e, 0, sizeof(e));
  e.type = ET_FRUIT;
  e.sub  = (uint8_t)rndi(5);
  e.x    = SCREEN_W;
}

void spawnEgg(uint8_t contains) {
  if (s_state.entityCount >= kMaxEntities) return;
  Entity& e = s_state.entities[s_state.entityCount++];
  memset(&e, 0, sizeof(e));
  e.type  = ET_EGG;
  e.sub   = contains;
  e.x     = SCREEN_W;
  e.stage = STG_ROLLING;
}

void triggerJump() {
  Character& ch = s_state.ch;
  if (ch.jumping) return;
  ch.jumping = true;
  ch.jumpV   = (float)kJumpHeight / 4.0f;
}

void triggerThrow(float jumpY) {
  Character& ch = s_state.ch;
  if (!ch.hasAxe) return;
  if (s_state.axeCount >= 1) return;   // 同屏只 1 把
  ch.throwT = 4;
  Axe& a = s_state.axes[s_state.axeCount++];
  a.x = (float)kCharX + 16.0f;
  a.y = jumpY;
  a.f = 0;
}

// 判断实体是否"空中类型" (跟乌鸦/水果同高度)
inline bool isAirEntity(const Entity& e) {
  if (e.type == ET_FRUIT) return true;
  if (e.type == ET_ENEMY && e.sub == ES_CROW) return true;
  return false;
}

void removeEntityAt(uint8_t i) {
  if (i >= s_state.entityCount) return;
  // 跟最后一个交换 + 减计数 (顺序无关)
  s_state.entities[i] = s_state.entities[s_state.entityCount - 1];
  s_state.entityCount--;
}

void removeAxeAt(uint8_t i) {
  if (i >= s_state.axeCount) return;
  s_state.axes[i] = s_state.axes[s_state.axeCount - 1];
  s_state.axeCount--;
}

// ============ 单帧 tick ============
void tickScene() {
  s_state.frame++;
  // 滑板状态下整体加速 kSkateboardBoost 倍
  const float boost = (s_state.ch.type == 1) ? kSkateboardBoost : 1.0f;
  const float bgSpeedNow = kBgSpeed * boost;
  const float entSpeedNow = kEntSpeed * boost;
  s_state.scrollX += bgSpeedNow;
  // 防 float 累加溢出: scrollX 始终落在 [0, bgW) (bgW=48)
  if (s_state.scrollX >= 48.0f) s_state.scrollX = fmodf(s_state.scrollX, 48.0f);

  Character& ch = s_state.ch;

  // 跳跃物理
  if (ch.jumping) {
    ch.jumpY += ch.jumpV;
    ch.jumpV -= 0.5f;
    if (ch.jumpY <= 0) {
      ch.jumpY = 0;
      ch.jumping = false;
      ch.jumpV = 0;
      if (ch.type == 1) ch.landing = 8;
    }
  }
  if (ch.landing > 0) ch.landing--;
  if (ch.throwT > 0) ch.throwT--;
  if (ch.fairyT > 0) ch.fairyT--;
  if (ch.stumbleT > 0) ch.stumbleT--;

  const float totalSpeed = entSpeedNow + bgSpeedNow;

  // 实体推进 + 碰撞 (倒序遍历, splice 安全)
  for (int i = (int)s_state.entityCount - 1; i >= 0; i--) {
    Entity& e = s_state.entities[i];
    e.f++;

    // 死亡敌人: 独立运动 (e.x 锁死, 不跟场景滚), 重力下落
    if (e.dying) {
      e.dyT++;
      e.dyOffX += e.dyVx;
      e.dyOffY += e.dyVy;
      e.dyVy += 0.7f;
      if (e.dyOffY > 64.0f || e.x + e.dyOffX < -32.0f || e.x + e.dyOffX > 96.0f) {
        removeEntityAt((uint8_t)i);
      }
      continue;
    }

    e.x -= totalSpeed;
    const float eRight = e.x + 16.0f;

    // 滑板态下: 障碍物越过角色右侧, 计 +1 (用于 15 次必栽阈值)
    if (ch.type == 1 && e.type == ET_OBS && !e.passedByChar) {
      if (eRight <= (float)kCharX) {
        e.passedByChar = true;
        if (ch.skateJumpOverCount < 250) ch.skateJumpOverCount++;
      }
    }

    // 蛋: rolling → flying → cracking → item
    if (e.type == ET_EGG) {
      if (e.stage == STG_ROLLING) {
        if (eRight > kCharX && e.x < kCharX + kCharHitW) {
          e.stage = STG_FLYING;
          e.flyT = 0;
          e.flyDuration = 8;
          e.flyVx = 1.6f;
        }
      } else if (e.stage == STG_FLYING) {
        e.x += totalSpeed + e.flyVx;
        e.flyT++;
        float t = (float)e.flyT / (float)e.flyDuration;
        e.flyY = -16.0f * 4.0f * t * (1.0f - t);
        if (e.flyT >= e.flyDuration) {
          e.stage = STG_CRACKING;
          e.flyY = 0;
          e.crackT = 0;
        }
      } else if (e.stage == STG_CRACKING) {
        e.crackT++;
        if (e.crackT >= 4) e.stage = STG_ITEM;
      } else if (e.stage == STG_ITEM) {
        if (eRight > kCharX && e.x < kCharX + kCharHitW) {
          if (e.sub == EGG_AXE) ch.hasAxe = true;
          else if (e.sub == EGG_FAIRY) ch.fairyT = 900;
          else if (e.sub == EGG_SKATEBOARD) { ch.type = 1; ch.skateJumpOverCount = 0; }
          removeEntityAt((uint8_t)i);
          continue;
        }
      }
      if (e.x < -32.0f) removeEntityAt((uint8_t)i);
      continue;
    }

    // 普通碰撞
    if (eRight > kCharX && e.x < kCharX + kCharHitW) {
      // 水果: 跳起来够高才能吃
      if (e.type == ET_FRUIT) {
        if (ch.jumpY >= kMinJumpYToFruit) {
          removeEntityAt((uint8_t)i);
          continue;
        }
      }
      // 仙女撞敌人/障碍: 只消除对方, 仙女继续 (直到时长结束)
      if (ch.fairyT > 0) {
        if (e.type == ET_ENEMY || e.type == ET_OBS) {
          removeEntityAt((uint8_t)i);
          continue;
        }
      }
      // 滑板撞石头(15% 没跳那次, 或达 15 次必栽): 角色被弹起 + stumble + 滑板掉
      // 必须角色基本贴地才算撞到 (jumpY < 4); 跳起来过 X 不算撞
      if (e.type == ET_OBS && e.sub == OS_ROCK && ch.type == 1 && ch.jumpY < 4.0f) {
        ch.type = 0;            // 滑板没了
        ch.skateJumpOverCount = 0;
        ch.stumbleT = kStumbleFrames;
        ch.jumping = true;
        ch.jumpY   = (float)kStumbleHoist;   // 弹起到障碍物高度
        ch.jumpV   = 0.0f;
        removeEntityAt((uint8_t)i);
        continue;
      }
    }

    if (e.x < -32.0f) removeEntityAt((uint8_t)i);
  }

  // 飞行斧子推进 + 命中
  for (int i = (int)s_state.axeCount - 1; i >= 0; i--) {
    s_state.axes[i].x += (float)kAxeSpeed;
    s_state.axes[i].f++;
    bool hit = false;
    for (int j = (int)s_state.entityCount - 1; j >= 0; j--) {
      Entity& e = s_state.entities[j];
      if (e.type != ET_ENEMY) continue;
      if (e.dying) continue;
      float enemyY = (e.sub == ES_CROW) ? (float)kCrowYOffset : 0.0f;
      if (fabsf(e.x - s_state.axes[i].x) < 14.0f &&
          fabsf(enemyY - s_state.axes[i].y) < 20.0f) {
        // 命中: 进入死亡状态
        e.dying = true;
        e.dyT = 0;
        e.dyOffX = 0.0f;
        e.dyOffY = 0.0f;
        // 速度: 蜗牛/乌鸦 → 向右; 蛇/野猪 → 向左
        if (e.sub == ES_SNAIL) { e.dyVx = 1.5f;  e.dyVy = -2.5f; }
        else if (e.sub == ES_CROW) { e.dyVx = 1.5f;  e.dyVy = -2.0f; }
        else                       { e.dyVx = -1.5f; e.dyVy = -2.5f; }
        removeAxeAt((uint8_t)i);
        hit = true;
        break;
      }
    }
    if (hit) continue;
    if (s_state.axes[i].x > 70.0f) removeAxeAt((uint8_t)i);
  }

  // 自动事件 (autoMode 默认开)
  if (s_state.spawnCooldown > 0) s_state.spawnCooldown--;
  if (s_state.eggCooldown > 0) s_state.eggCooldown--;

  // 检查右侧空闲 (空中/地面分开)
  bool rightAirBusy = false;
  bool rightGroundBusy = false;
  for (uint8_t i = 0; i < s_state.entityCount; i++) {
    const Entity& e = s_state.entities[i];
    if (e.dying) continue;
    if (e.x > SCREEN_W - kRightZoneClear) {
      if (isAirEntity(e)) rightAirBusy = true;
      else                rightGroundBusy = true;
    }
  }

  if (s_state.spawnCooldown == 0) {
    // 开局必先出斧蛋
    if (!s_state.firstAxeSpawned) {
      if (!rightGroundBusy) {
        spawnEgg(EGG_AXE);
        s_state.eggCooldown = kEggCooldownFrames;
        s_state.firstAxeSpawned = true;
        s_state.eggSeq = 1;
        s_state.spawnCooldown = kSpawnInterval;
      } else {
        s_state.spawnCooldown = 1;
      }
    } else {
      // 抽签: 水果 25 / 障碍 25 / 敌人 30 / 蛋 20 (无 skip)
      int r = rndi(100);
      if (r < 25 && !rightAirBusy) {
        spawnFruit();
      } else if (r < 50 && !rightGroundBusy) {
        spawnObstacle((rndi(100) >= 50) ? OS_ROCK : OS_FIRE);
      } else if (r < 80) {
        uint8_t types[4] = { ES_SNAIL, ES_CROW, ES_BOAR, ES_SNAKE };
        uint8_t sub = types[rndi(4)];
        bool isAir = (sub == ES_CROW);
        if ((isAir && !rightAirBusy) || (!isAir && !rightGroundBusy)) {
          spawnEnemy(sub);
        }
      } else if (!rightGroundBusy && s_state.eggCooldown == 0) {
        // 90 秒冷却到点了也不一定出蛋: 50% 跳过, 让下次抽签机会再来
        // (跳过时不重置 eggCooldown, 这样玩家不必再等 90 秒, 但确实不一定立刻出)
        if (rndi(100) < kEggSkipPercent) {
          // skip 本次出蛋
        } else {
          // 蛋顺序: 没斧→斧; 有斧→滑板/仙女交替; 已踩滑板时只出仙女
          uint8_t contains;
          if (!ch.hasAxe) {
            contains = EGG_AXE;
            s_state.eggSeq = 1;
          } else if (ch.type == 1) {
            contains = EGG_FAIRY;
            s_state.eggSeq++;
          } else {
            contains = (s_state.eggSeq % 2 == 1) ? EGG_SKATEBOARD : EGG_FAIRY;
            s_state.eggSeq++;
          }
          spawnEgg(contains);
          s_state.eggCooldown = kEggCooldownFrames;
        }
      }
      s_state.spawnCooldown = kSpawnInterval;
    }
  }

  // 自动避障 + 投掷
  float jumpV0 = (float)kJumpHeight / 4.0f;
  int jumpFrames = (int)ceilf(jumpV0 / 0.5f) * 2;
  float reachFactor = (ch.type == 1) ? kReachFactorSkateboard : kReachFactorRun;
  float reachDist = (float)jumpFrames * totalSpeed * reachFactor;
  float triggerStart = reachDist - 4.0f;
  float triggerEnd   = reachDist + 4.0f;

  for (uint8_t i = 0; i < s_state.entityCount; i++) {
    Entity& e = s_state.entities[i];
    if (e.dying) continue;
    float distToChar = e.x - kCharX;

    // 跳跃: 障碍 / 没斧地面敌 / 滑板下地面敌 / 水果(必须跳)
    bool isGroundEnemy = (e.type == ET_ENEMY && e.sub != ES_CROW);
    bool needJumpForFruit = (e.type == ET_FRUIT);
    bool needJumpOver = (ch.fairyT == 0) && (
      (e.type == ET_OBS) ||
      (isGroundEnemy && !ch.hasAxe) ||
      (isGroundEnemy && ch.type == 1)
    );
    if (distToChar > triggerStart && distToChar < triggerEnd) {
      if ((needJumpOver || needJumpForFruit) && !ch.jumping) {
        // 滑板 + 石头: 默认 15% 概率不跳, 让石头撞上来 (碰撞段会触发磕到流程)
        // 若 skateJumpOverCount 达阈值, 则强制不跳 (必撞)
        if (ch.type == 1 && e.type == ET_OBS && e.sub == OS_ROCK && !e.failChecked) {
          e.failChecked = true;
          bool forceWipeout = (ch.skateJumpOverCount >= kSkateForceWipeoutAt);
          if (forceWipeout || rndi(100) < 15) {
            // 不跳, 走碰撞分支
          } else {
            triggerJump();
          }
        } else {
          triggerJump();
        }
      }
    }

    // 投掷
    if (e.type == ET_ENEMY && ch.hasAxe && ch.throwT == 0) {
      float throwLo = (float)kThrowDist - (float)kThrowRange;
      float throwHi = (float)kThrowDist + (float)kThrowRange;
      if (e.sub == ES_CROW) {
        // 乌鸦: 跳起来扔
        if (distToChar > kCrowJumpDist - kCrowJumpRange &&
            distToChar < kCrowJumpDist + kCrowJumpRange &&
            !ch.jumping) {
          triggerJump();
        }
        // 在最高点附近扔斧
        if (distToChar > throwLo && distToChar < throwHi &&
            ch.jumping && fabsf(ch.jumpV) < 1.0f) {
          triggerThrow(ch.jumpY);
        }
      } else {
        // 地面敌: 站着扔, 不跳
        if (distToChar > throwLo && distToChar < throwHi && !ch.jumping) {
          triggerThrow(0);
        }
      }
    }
  }
}

// ============ 单帧渲染 (写到 buffer) ============
void buildFrame() {
  clearBuffer();

  // 1) 背景 (最底层)
  drawBackground();

  // 2) 实体 (敌人/障碍/水果/蛋)
  for (uint8_t i = 0; i < s_state.entityCount; i++) {
    drawEntity(s_state.entities[i]);
  }

  // 3) 飞行斧头 (用蛋里斧头同样大小 = kItemScale)
  for (uint8_t i = 0; i < s_state.axeCount; i++) {
    const Axe& a = s_state.axes[i];
    // 帧顺序: 1 → 2 → 3 → 0 → 循环
    static const uint8_t kSeq[4] = { 1, 2, 3, 0 };
    int idx = kSeq[(a.f / kAxeAnimSpeed) % 4];
    char keyBuf[16];
    snprintf(keyBuf, sizeof(keyBuf), "item.axe.%d", idx);
    const AISprite* spr = AISprites::getByKey(keyBuf);
    if (spr) {
      int drawH = (int)(spr->h * kItemScale + 0.5f);
      drawSprite(spr, (int)a.x, kGroundY - 24 - (int)a.y + (16 - drawH), false, kItemScale);
    }
  }

  // 4) 角色
  const char* charKey = getCharSpriteKey(s_state.frame);
  const AISprite* charSpr = AISprites::getByKey(charKey);
  if (charSpr) {
    int cy = kGroundY - charSpr->h - (int)s_state.ch.jumpY;
    drawSprite(charSpr, kCharX, cy, false, 1.0f);
  }

  // 5) 仙女跟随
  if (s_state.ch.fairyT > 0) {
    float fy = sinf((float)s_state.frame * 0.15f) * 3.0f;
    const AISprite* fairy = AISprites::getByKey("item.fairy");
    if (fairy) {
      drawSprite(fairy, kCharX + kFairyOffsetX,
                 kGroundY - kFairyOffsetY + (int)fy, false, 1.0f);
    }
  }

  // 6) HUD 时钟 (★ 最顶层, 永远不被遮挡)
  drawClock();
}

}  // namespace

// ============ 公共接口 ============

namespace AdventureIslandEffect {

void init() {
  // 模块级 static 已经 0 初始化, 不用再做事
}

void applyConfig() {
  // 没有可变参数, 直接重置场景
  resetSceneState();
  s_active = true;
  s_lastTickMs = millis();
}

void deactivate() {
  s_active = false;
}

void update() {
  if (!s_active) return;
  uint32_t now = millis();
  if (now - s_lastTickMs < 33) return;   // 30 fps
  s_lastTickMs = now;
  tickScene();
}

void render() {
  if (!s_active) return;
  if (DisplayManager::dma_display == nullptr) return;
  buildFrame();
  DisplayManager::presentOffscreenFrame(&DisplayManager::animationBuffer[0][0]);
}

bool isActive() { return s_active; }

}  // namespace AdventureIslandEffect
