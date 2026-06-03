// ============================================================
// KOF '97 渲染器
// 移植自 website/src/utils/kof97Renderer.js
// 资产: include/theme_assets/kof97/sprites_*.h
// ============================================================

#include "kof97_effect.h"

#include <pgmspace.h>
#include <string.h>
#include <time.h>

#include "display_manager.h"
#include "theme_assets/kof97/index.h"
#include "theme_assets/kof97/sprites_bg.h"

namespace {

// ============ 屏幕常量 ============
constexpr int SCREEN_W = 64;
constexpr int SCREEN_H = 64;

// ============ 屏幕区 (TV_CONFIG, 跟 kof97Renderer.js 一致) ============
constexpr uint8_t SX0  = 4;
constexpr uint8_t SY0  = 4;
constexpr uint8_t SCRW = 56;
constexpr uint8_t SCRH = 45;

// ============ 屏幕背景色 ============
// #0a3870 = (10, 56, 112)
constexpr uint8_t BG_R = 0x0a, BG_G = 0x38, BG_B = 0x70;

// ============ 电视壳颜色 (街机黑红) ============
// tvBlack #1a1a1a / tvDark #0a0a0a / tvEdge #000000 / tvLight #c00808
constexpr uint8_t TV_BLACK_R = 0x1a, TV_BLACK_G = 0x1a, TV_BLACK_B = 0x1a;
constexpr uint8_t TV_DARK_R  = 0x0a, TV_DARK_G  = 0x0a, TV_DARK_B  = 0x0a;
constexpr uint8_t TV_EDGE_R  = 0x00, TV_EDGE_G  = 0x00, TV_EDGE_B  = 0x00;

// ============ 头像选中色 (P1 红 / P2 蓝) ============
// HL_P1 #e80000, HL_P2 #3870ff, PANEL #f0f0f0 (默认白边框)
constexpr uint8_t HL_P1_R = 0xe8, HL_P1_G = 0x00, HL_P1_B = 0x00;
constexpr uint8_t HL_P2_R = 0x38, HL_P2_G = 0x70, HL_P2_B = 0xff;
constexpr uint8_t PANEL_R = 0xf0, PANEL_G = 0xf0, PANEL_B = 0xf0;

// ============ 时间显示色 (#00ff66 老式 LED 绿) ============
constexpr uint8_t TIME_R = 0x00, TIME_G = 0xff, TIME_B = 0x66;

// ============ 圆角 ============
constexpr uint8_t TV_CORNER = 1;

// ============ 底座 ============
constexpr uint8_t BASE_TOP    = 51;
constexpr uint8_t BASE_BOT    = 58;
constexpr uint8_t BASE_LEFT   = 12;
constexpr uint8_t BASE_RIGHT_INSET = 12;
constexpr uint8_t SLOT_Y0 = 53;
constexpr uint8_t SLOT_Y1 = 57;

// ============ LED 灯 (固定色) ============
constexpr uint8_t LED_Y     = 61;
constexpr uint8_t LED1_X    = 18;   // 黄
constexpr uint8_t LED1_R = 0xdc, LED1_G = 0xb4, LED1_B = 0x1e;
constexpr uint8_t LED2_X    = 22;   // 灰
constexpr uint8_t LED2_R = 0x8c, LED2_G = 0x8c, LED2_B = 0x91;
constexpr uint8_t LED3_X    = 26;   // 红
constexpr uint8_t LED3_R = 0xb4, LED3_G = 0x1e, LED3_B = 0x1e;
constexpr uint8_t LED4_X    = 45;   // 绿
constexpr uint8_t LED4_R = 0x50, LED4_G = 0xc8, LED4_B = 0x3c;

// ============ 时间 (3×5 字体) ============
constexpr uint8_t TIME_X = 31;
constexpr uint8_t TIME_Y = 53;

// ============ 底脚 ============
constexpr uint8_t FOOT_TOP = 63;
constexpr uint8_t FOOT_BOT = 63;
constexpr uint8_t FOOT_LX0 = 8;
constexpr uint8_t FOOT_LX1 = 16;

// ============ 角色 stance ============
constexpr uint8_t CHAR_X_LEFT  = 14;   // P1 脚中心 x
constexpr uint8_t CHAR_X_RIGHT = 40;   // P2 脚中心 x
constexpr uint8_t CHAR_Y       = 42;   // 脚的基线 y
// stance 数据已经在 build 阶段缩到 20×23, 板载 1:1 渲染
constexpr uint8_t STANCE_MAX_W = 35;
constexpr uint8_t STANCE_MAX_H = 57;
constexpr uint16_t STANCE_MAX_PIXELS = STANCE_MAX_W * STANCE_MAX_H;

// ============ 头像区 (7×2 = 14 格) ============
constexpr uint8_t PORTRAIT_W = 4, PORTRAIT_H = 4;
constexpr uint8_t CELL_W = PORTRAIT_W + 2;   // 含 1px 边框 = 6
constexpr uint8_t CELL_H = PORTRAIT_H + 2;   // = 6
constexpr uint8_t PORTRAIT_GAP = 1;
constexpr uint8_t PORTRAIT_COLS = 7;
constexpr uint8_t PORTRAIT_ROWS = 2;

// ============ 时间帧推进 / 选人切换 ============
constexpr uint8_t  CHAR_FRAME_INTERVAL = 4;
constexpr uint16_t SELECT_INTERVAL     = 1;

// ============ 状态 ============
bool s_active = false;
uint32_t s_lastTickMs = 0;

struct State {
  uint32_t frame;
  uint8_t  selectP1;       // 0..13
  uint8_t  selectP2;
  uint16_t selectTimer;
  uint16_t charTimer;
  uint16_t charFrame;
  char     timeText[8];    // "HH:MM\0"
};
State s_state = {};

struct StanceBuffer {
  uint8_t w;
  uint8_t h;
  uint8_t opaque[STANCE_MAX_PIXELS];
  uint16_t color[STANCE_MAX_PIXELS];
};
StanceBuffer s_stanceBuffer = {};

// ============ 简易 PRNG (避免依赖 random()) ============
uint32_t s_prng = 0x12345678;
inline uint32_t rng() {
  s_prng ^= s_prng << 13;
  s_prng ^= s_prng >> 17;
  s_prng ^= s_prng << 5;
  return s_prng;
}

// ============ 像素写入 (含 y+1 行偏移补偿) ============
inline void putPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;
  int by = (y + 1) % SCREEN_H;
  DisplayManager::animationBuffer[by][x] =
      MatrixPanel_I2S_DMA::color565(r, g, b);
}

inline void putPixel565(int x, int y, uint16_t color) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;
  int by = (y + 1) % SCREEN_H;
  DisplayManager::animationBuffer[by][x] = color;
}

inline void fillRect(int x0, int y0, int x1, int y1,
                     uint8_t r, uint8_t g, uint8_t b) {
  if (x0 > x1) { int t = x0; x0 = x1; x1 = t; }
  if (y0 > y1) { int t = y0; y0 = y1; y1 = t; }
  for (int y = y0; y <= y1; y++) {
    for (int x = x0; x <= x1; x++) {
      putPixel(x, y, r, g, b);
    }
  }
}

inline void drawRectBorder(int x0, int y0, int x1, int y1,
                           uint8_t r, uint8_t g, uint8_t b) {
  for (int x = x0; x <= x1; x++) {
    putPixel(x, y0, r, g, b);
    putPixel(x, y1, r, g, b);
  }
  for (int y = y0; y <= y1; y++) {
    putPixel(x0, y, r, g, b);
    putPixel(x1, y, r, g, b);
  }
}

// ============ 3×5 字体 (跟 kof97Renderer.js FONT_3x5 一致) ============
// 每字符 5 字节, 每字节低 3 位代表行像素 (左->右), 5 行 → 5 字节
struct GlyphRow { uint8_t bits; };

// 0..9 + ':' (索引: '0'=0..'9'=9, ':'=10)
const uint8_t kFontRows[11][5] PROGMEM = {
  {0b111, 0b101, 0b101, 0b101, 0b111},   // 0
  {0b010, 0b110, 0b010, 0b010, 0b111},   // 1
  {0b111, 0b001, 0b111, 0b100, 0b111},   // 2
  {0b111, 0b001, 0b111, 0b001, 0b111},   // 3
  {0b101, 0b101, 0b111, 0b001, 0b001},   // 4
  {0b111, 0b100, 0b111, 0b001, 0b111},   // 5
  {0b111, 0b100, 0b111, 0b101, 0b111},   // 6
  {0b111, 0b001, 0b010, 0b010, 0b010},   // 7
  {0b111, 0b101, 0b111, 0b101, 0b111},   // 8
  {0b111, 0b101, 0b111, 0b001, 0b111},   // 9
  {0b000, 0b010, 0b000, 0b010, 0b000},   // ':' (1 列宽用第 1 列)
};

inline int charToFontIdx(char ch) {
  if (ch >= '0' && ch <= '9') return ch - '0';
  if (ch == ':') return 10;
  return -1;
}

void drawText3x5(const char* text, int x, int y,
                 uint8_t r, uint8_t g, uint8_t b) {
  int cx = x;
  for (int i = 0; text[i] != '\0'; i++) {
    int idx = charToFontIdx(text[i]);
    if (idx < 0) continue;
    if (text[i] == ':') {
      // 冒号只用中间列
      for (int row = 0; row < 5; row++) {
        uint8_t bits = pgm_read_byte(&kFontRows[idx][row]);
        if (bits & 0b010) putPixel(cx, y + row, r, g, b);
      }
      cx += 1 + 1;
    } else {
      for (int row = 0; row < 5; row++) {
        uint8_t bits = pgm_read_byte(&kFontRows[idx][row]);
        // bit2 = 左列, bit1 = 中列, bit0 = 右列
        if (bits & 0b100) putPixel(cx + 0, y + row, r, g, b);
        if (bits & 0b010) putPixel(cx + 1, y + row, r, g, b);
        if (bits & 0b001) putPixel(cx + 2, y + row, r, g, b);
      }
      cx += 3 + 1;
    }
  }
}

void drawKofTimeText(const char* text, int x, int y) {
  if (text == nullptr) return;
  char leftText[3] = {0};
  char rightText[3] = {0};
  leftText[0] = text[0];
  leftText[1] = text[1];
  rightText[0] = text[3];
  rightText[1] = text[4];
  const int startX = x - 8;
  drawText3x5(leftText, startX, y, HL_P1_R, HL_P1_G, HL_P1_B);
  drawText3x5(":", startX + 8, y, TIME_R, TIME_G, TIME_B);
  drawText3x5(rightText, startX + 10, y, HL_P2_R, HL_P2_G, HL_P2_B);
}

// ============ 画 KofSprite ============
// fmt=5: 每像素 5 字节 [x, y, r, g, b]
void drawSpriteAt(const KofSprite* sprite, int dx, int dy, bool mirror) {
  if (sprite == nullptr) return;
  KofSprite copied;
  memcpy_P(&copied, sprite, sizeof(KofSprite));
  if (copied.fmt != 5) return;
  const uint8_t* src = copied.pixels;
  uint16_t pixelCount = copied.pixelCount;
  uint8_t w = copied.w;
  for (uint16_t i = 0; i < pixelCount; i++) {
    uint8_t x = pgm_read_byte(src + i * 5 + 0);
    uint8_t y = pgm_read_byte(src + i * 5 + 1);
    uint8_t r = pgm_read_byte(src + i * 5 + 2);
    uint8_t g = pgm_read_byte(src + i * 5 + 3);
    uint8_t b = pgm_read_byte(src + i * 5 + 4);
    int drawX = mirror ? (w - 1 - x) : x;
    putPixel(dx + drawX, dy + y, r, g, b);
  }
}

// 画角色 stance 帧 (脚中心 footX, 脚基线 footY, 镜像)
bool readPaletteColor(const uint8_t* palette, uint16_t paletteCount,
                      uint16_t colorIndex, uint16_t& color) {
  if (palette == nullptr || colorIndex >= paletteCount) return false;
  const uint16_t offset = colorIndex * 3;
  const uint8_t r = pgm_read_byte(palette + offset + 0);
  const uint8_t g = pgm_read_byte(palette + offset + 1);
  const uint8_t b = pgm_read_byte(palette + offset + 2);
  color = MatrixPanel_I2S_DMA::color565(r, g, b);
  return true;
}

bool applyPaletteFullStanceFrame(const KofSprite& copied,
                                 const uint8_t* palette,
                                 uint16_t paletteCount,
                                 StanceBuffer& buffer) {
  if (copied.fmt != 7 && copied.fmt != 9) return false;
  if (copied.w > STANCE_MAX_W || copied.h > STANCE_MAX_H) return false;

  buffer.w = copied.w;
  buffer.h = copied.h;
  memset(buffer.opaque, 0, sizeof(buffer.opaque));

  const uint8_t* src = copied.pixels;
  const uint8_t stride = copied.fmt == 7 ? 3 : 4;
  for (uint16_t i = 0; i < copied.pixelCount; i++) {
    const uint16_t base = i * stride;
    const uint16_t packedPos =
        pgm_read_byte(src + base + 0) |
        (static_cast<uint16_t>(pgm_read_byte(src + base + 1)) << 8);
    const uint16_t pos = packedPos & 0x7fff;
    uint16_t colorIndex = pgm_read_byte(src + base + 2);
    if (copied.fmt == 9) {
      colorIndex |= static_cast<uint16_t>(pgm_read_byte(src + base + 3)) << 8;
    }
    if (pos >= static_cast<uint16_t>(buffer.w) * buffer.h) return false;
    uint16_t color = 0;
    if (!readPaletteColor(palette, paletteCount, colorIndex, color)) return false;
    buffer.opaque[pos] = 1;
    buffer.color[pos] = color;
  }
  return true;
}

bool applyPaletteDeltaStanceFrame(const KofSprite& copied,
                                  const uint8_t* palette,
                                  uint16_t paletteCount,
                                  StanceBuffer& buffer) {
  if (copied.fmt != 8 && copied.fmt != 10) return false;
  if (copied.w != buffer.w || copied.h != buffer.h) return false;

  const uint8_t* src = copied.pixels;
  const uint8_t stride = copied.fmt == 8 ? 3 : 4;
  for (uint16_t i = 0; i < copied.pixelCount; i++) {
    const uint16_t base = i * stride;
    const uint16_t packedPos =
        pgm_read_byte(src + base + 0) |
        (static_cast<uint16_t>(pgm_read_byte(src + base + 1)) << 8);
    const uint8_t op = (packedPos & 0x8000) ? 1 : 0;
    const uint16_t pos = packedPos & 0x7fff;
    uint16_t colorIndex = pgm_read_byte(src + base + 2);
    if (copied.fmt == 10) {
      colorIndex |= static_cast<uint16_t>(pgm_read_byte(src + base + 3)) << 8;
    }
    if (pos >= static_cast<uint16_t>(buffer.w) * buffer.h) return false;
    if (op == 0) {
      buffer.opaque[pos] = 0;
    } else {
      uint16_t color = 0;
      if (!readPaletteColor(palette, paletteCount, colorIndex, color)) return false;
      buffer.opaque[pos] = 1;
      buffer.color[pos] = color;
    }
  }
  return true;
}

bool rebuildStanceFrame(uint8_t charIdx, uint8_t frameIdx, StanceBuffer& buffer) {
  const KofStanceSet* set = KofSprites::getStanceSetByIndex(charIdx);
  if (set == nullptr) return false;

  KofStanceSet copiedSet;
  memcpy_P(&copiedSet, set, sizeof(KofStanceSet));
  if (frameIdx >= copiedSet.frameCount) return false;

  for (uint8_t i = 0; i <= frameIdx; i++) {
    const KofSprite* frame = KofSprites::getStanceFrame(charIdx, i);
    if (frame == nullptr) return false;

    KofSprite copied;
    memcpy_P(&copied, frame, sizeof(KofSprite));
    bool ok = false;
    if (copied.fmt == 7 || copied.fmt == 9) {
      ok = applyPaletteFullStanceFrame(
          copied, copiedSet.palette, copiedSet.paletteCount, buffer);
    } else if (copied.fmt == 8 || copied.fmt == 10) {
      ok = applyPaletteDeltaStanceFrame(
          copied, copiedSet.palette, copiedSet.paletteCount, buffer);
    }
    if (!ok) return false;
  }
  return true;
}

void drawDecodedStanceFrame(int footX, int footY,
                            const StanceBuffer& buffer, bool mirror) {
  const int leftX = footX - (buffer.w / 2);
  const int topY = footY - buffer.h + 1;
  for (uint8_t y = 0; y < buffer.h; y++) {
    for (uint8_t x = 0; x < buffer.w; x++) {
      const uint16_t pos = y * buffer.w + x;
      if (buffer.opaque[pos] == 0) continue;
      const int drawX = mirror ? (buffer.w - 1 - x) : x;
      putPixel565(leftX + drawX, topY + y, buffer.color[pos]);
    }
  }
}

void drawStanceFrame(int footX, int footY,
                     uint8_t charIdx, uint8_t frameIdx, bool mirror) {
  if (!rebuildStanceFrame(charIdx, frameIdx, s_stanceBuffer)) return;
  drawDecodedStanceFrame(footX, footY, s_stanceBuffer, mirror);
}

// ============ 画头像 ============
void drawPortraits() {
  const int totalW = PORTRAIT_COLS * CELL_W + (PORTRAIT_COLS - 1) * PORTRAIT_GAP;
  const int startX = SX0 + (SCRW - totalW) / 2;
  const int startY = SY0 + 2;

  for (int i = 0; i < PORTRAIT_COLS * PORTRAIT_ROWS; i++) {
    int row = i / PORTRAIT_COLS;
    int col = i % PORTRAIT_COLS;
    int cellX = startX + col * (CELL_W + PORTRAIT_GAP);
    int cellY = startY + row * (CELL_H + PORTRAIT_GAP);
    // 边框颜色: 默认白; P1 选中红; P2 选中蓝
    uint8_t br = PANEL_R, bg = PANEL_G, bb = PANEL_B;
    if (i == s_state.selectP1) {
      br = HL_P1_R; bg = HL_P1_G; bb = HL_P1_B;
    } else if (i == s_state.selectP2) {
      br = HL_P2_R; bg = HL_P2_G; bb = HL_P2_B;
    }
    drawRectBorder(cellX, cellY, cellX + CELL_W - 1, cellY + CELL_H - 1,
                   br, bg, bb);
    // 头像内容 (单元内偏 1px)
    if (i < KofSprites::charCount()) {
      const KofSprite* head = KofSprites::getHeadByIndex(i);
      drawSpriteAt(head, cellX + 1, cellY + 1, false);
    }
  }
}

// ============ 画屏幕中央 stance ============
void drawCharacters() {
  // P1 (左, 镜像朝右)
  const KofStanceSet* p1Set = KofSprites::getStanceSetByIndex(s_state.selectP1);
  if (p1Set != nullptr) {
    KofStanceSet copied;
    memcpy_P(&copied, p1Set, sizeof(KofStanceSet));
    if (copied.frameCount > 0) {
      uint8_t fIdx = s_state.charFrame % copied.frameCount;
      drawStanceFrame(SX0 + CHAR_X_LEFT, SY0 + CHAR_Y,
                      s_state.selectP1, fIdx, true);
    }
  }
  // P2 (右, 不镜像)
  const KofStanceSet* p2Set = KofSprites::getStanceSetByIndex(s_state.selectP2);
  if (p2Set != nullptr) {
    KofStanceSet copied;
    memcpy_P(&copied, p2Set, sizeof(KofStanceSet));
    if (copied.frameCount > 0) {
      uint8_t fIdx = s_state.charFrame % copied.frameCount;
      drawStanceFrame(SX0 + CHAR_X_RIGHT, SY0 + CHAR_Y,
                      s_state.selectP2, fIdx, false);
    }
  }
}

uint8_t getFrameCount(uint8_t charIdx) {
  const KofStanceSet* set = KofSprites::getStanceSetByIndex(charIdx);
  if (set == nullptr) return 0;
  KofStanceSet copied;
  memcpy_P(&copied, set, sizeof(KofStanceSet));
  return copied.frameCount;
}

// ============ 画屏幕 ============
void drawScreenBackground() {
  for (uint8_t y = 0; y < SCRH; y++) {
    for (uint8_t x = 0; x < SCRW; x++) {
      const uint16_t index = (y * SCRW + x) * 3;
      const uint8_t r = pgm_read_byte(kKof97BgPixels + index + 0);
      const uint8_t g = pgm_read_byte(kKof97BgPixels + index + 1);
      const uint8_t b = pgm_read_byte(kKof97BgPixels + index + 2);
      putPixel(SX0 + x, SY0 + y, r, g, b);
    }
  }
}

void drawScreen() {
  // 屏幕背景 (KOF 经典深蓝)
  drawScreenBackground();
  drawPortraits();
  drawCharacters();
}

// ============ 画电视壳 ============
void drawTvFrame() {
  // 上下黑边
  fillRect(0, 0, SCREEN_W - 1, SY0 - 1, TV_BLACK_R, TV_BLACK_G, TV_BLACK_B);
  // 左右黑边 (屏幕区上下范围内)
  fillRect(0, SY0, SX0 - 1, SY0 + SCRH - 1, TV_BLACK_R, TV_BLACK_G, TV_BLACK_B);
  fillRect(SX0 + SCRW, SY0, SCREEN_W - 1, SY0 + SCRH - 1,
           TV_BLACK_R, TV_BLACK_G, TV_BLACK_B);
  // 屏幕下方区域
  fillRect(0, SY0 + SCRH, SCREEN_W - 1, SCREEN_H - 1,
           TV_BLACK_R, TV_BLACK_G, TV_BLACK_B);

  // 屏幕边框 (1px 内描边)
  drawRectBorder(SX0 - 1, SY0 - 1, SX0 + SCRW, SY0 + SCRH,
                 TV_EDGE_R, TV_EDGE_G, TV_EDGE_B);

  // 圆角削角 (corner=1, 4 角各削 1 像素)
  for (int i = 0; i < TV_CORNER; i++) {
    for (int j = 0; j < TV_CORNER - i; j++) {
      putPixel(i, j, TV_DARK_R, TV_DARK_G, TV_DARK_B);
      putPixel(SCREEN_W - 1 - i, j, TV_DARK_R, TV_DARK_G, TV_DARK_B);
      putPixel(i, SCREEN_H - 1 - j, TV_DARK_R, TV_DARK_G, TV_DARK_B);
      putPixel(SCREEN_W - 1 - i, SCREEN_H - 1 - j,
               TV_DARK_R, TV_DARK_G, TV_DARK_B);
    }
  }

  // 颈部 - neckOn=false, 跳过

  // 底座
  const int bl = BASE_LEFT;
  const int br = SCREEN_W - 1 - BASE_RIGHT_INSET;
  fillRect(bl, BASE_TOP, br, BASE_BOT, TV_DARK_R, TV_DARK_G, TV_DARK_B);
  fillRect(bl, BASE_TOP, br, BASE_TOP, TV_EDGE_R, TV_EDGE_G, TV_EDGE_B);   // 顶部高光
  fillRect(bl, BASE_TOP + 1, bl, BASE_BOT, TV_EDGE_R, TV_EDGE_G, TV_EDGE_B);
  fillRect(br, BASE_TOP + 1, br, BASE_BOT, TV_EDGE_R, TV_EDGE_G, TV_EDGE_B);
  // 中央光驱缝
  fillRect(bl + 6, SLOT_Y0, br - 6, SLOT_Y1, TV_BLACK_R, TV_BLACK_G, TV_BLACK_B);
  // 底座下沿黑边 (baseBot + 1 行)
  if (BASE_BOT + 1 < SCREEN_H) {
    fillRect(bl, BASE_BOT + 1, br, BASE_BOT + 1, TV_EDGE_R, TV_EDGE_G, TV_EDGE_B);
  }

  // 时间显示 (3×5 老式 LED 绿)
  drawKofTimeText(s_state.timeText, TIME_X, TIME_Y);

  // LED 灯 (静态)
  putPixel(LED1_X, LED_Y, LED1_R, LED1_G, LED1_B);
  putPixel(LED2_X, LED_Y, LED2_R, LED2_G, LED2_B);
  putPixel(LED3_X, LED_Y, LED3_R, LED3_G, LED3_B);
  putPixel(LED4_X, LED_Y, LED4_R, LED4_G, LED4_B);

  // 底脚
  fillRect(FOOT_LX0, FOOT_TOP, FOOT_LX1, FOOT_BOT,
           TV_DARK_R, TV_DARK_G, TV_DARK_B);
  fillRect(SCREEN_W - 1 - FOOT_LX1, FOOT_TOP, SCREEN_W - 1 - FOOT_LX0, FOOT_BOT,
           TV_DARK_R, TV_DARK_G, TV_DARK_B);
  fillRect(FOOT_LX0, FOOT_TOP, FOOT_LX1, FOOT_TOP,
           TV_EDGE_R, TV_EDGE_G, TV_EDGE_B);
  fillRect(SCREEN_W - 1 - FOOT_LX1, FOOT_TOP, SCREEN_W - 1 - FOOT_LX0, FOOT_TOP,
           TV_EDGE_R, TV_EDGE_G, TV_EDGE_B);
}

// ============ 时间字符串刷新 ============
void refreshTimeText() {
  time_t now = time(nullptr);
  struct tm tmInfo;
  localtime_r(&now, &tmInfo);
  snprintf(s_state.timeText, sizeof(s_state.timeText),
           "%02d:%02d", tmInfo.tm_hour, tmInfo.tm_min);
}

// ============ 状态推进 ============
void tickScene() {
  s_state.frame++;
  s_state.selectTimer++;
  s_state.charTimer++;

  // 每 30 帧 (1 秒) 刷新时间
  if ((s_state.frame % 30) == 0) {
    refreshTimeText();
  }

  // stance 动画推进
  bool cycleWrapped = false;
  const uint8_t p1FrameCount = getFrameCount(s_state.selectP1);
  const uint8_t p2FrameCount = getFrameCount(s_state.selectP2);
  const uint8_t totalFrames =
      p1FrameCount > p2FrameCount ? p1FrameCount : p2FrameCount;
  if (s_state.charTimer >= CHAR_FRAME_INTERVAL) {
    s_state.charTimer = 0;
    s_state.charFrame++;
    if (totalFrames > 0 && s_state.charFrame >= totalFrames) {
      s_state.charFrame = 0;
      cycleWrapped = true;
    }
  }

  // 选人光标动画: 每 SELECT_INTERVAL 帧随机切一次
  if (cycleWrapped && s_state.selectTimer >= SELECT_INTERVAL) {
    s_state.selectTimer = 0;
    const uint8_t N = KofSprites::charCount();
    uint8_t nextP1 = rng() % N;
    while (nextP1 == s_state.selectP1) nextP1 = rng() % N;
    s_state.selectP1 = nextP1;
    uint8_t nextP2 = rng() % N;
    while (nextP2 == s_state.selectP2 || nextP2 == s_state.selectP1) {
      nextP2 = rng() % N;
    }
    s_state.selectP2 = nextP2;
    s_state.charFrame = 0;
    s_state.charTimer = 0;
  }
}

}  // namespace

namespace Kof97Effect {

void init() {
  memset(&s_state, 0, sizeof(s_state));
  s_state.selectP1 = 0;
  s_state.selectP2 = 5;
  s_prng = (uint32_t)millis() ^ 0xa5a5a5a5;
  refreshTimeText();
}

void deactivate() {
  s_active = false;
}

void applyConfig() {
  init();
  s_active = true;
  s_lastTickMs = 0;
}

void update() {
  if (!s_active) return;
  uint32_t now = millis();
  if (s_lastTickMs == 0) s_lastTickMs = now;
  // 30 fps 节流
  if (now - s_lastTickMs < 33) return;
  s_lastTickMs = now;
  tickScene();
}

void render() {
  if (!s_active) return;
  if (DisplayManager::dma_display == nullptr) return;
  drawScreen();
  drawTvFrame();
  DisplayManager::presentOffscreenFrame(&DisplayManager::animationBuffer[0][0]);
}

bool isActive() {
  return s_active;
}

}  // namespace Kof97Effect
