// Terraria sprite 类型定义
// 不要手改; 由 uniapp/tools/build-firmware-sprites.js 生成同步
#pragma once

#include <Arduino.h>
#include <pgmspace.h>

// 单帧 sprite
struct TerrariaSprite {
  uint16_t w;
  uint16_t h;
  uint16_t pixelCount;
  const uint8_t* pixels;
  uint8_t fmt;  // 5 = 每像素 5 字节 (x8,y8,r,g,b); 7 = 每像素 7 字节 (x16,y16,r,g,b)
};

// 多帧差异: base (帧 0) + (frameCount-1) 个 delta
// delta 既可"加像素"(set 段) 也可"擦像素"(clear 段) → 解决 part 移动后旧位置残留(重影)
struct TerrariaFrameBlock {
  uint16_t setCount;            // 这一帧出现/变色的像素数 (跟 base 不同)
  const uint8_t* setPixels;     // fmt=5: [x,y,r,g,b]; fmt=7: [x_lo,x_hi,y_lo,y_hi,r,g,b]
  uint16_t clearCount;          // 这一帧需要擦回背景色的像素数 (base 有但 frame_i 没有)
  const uint8_t* clearPixels;   // 每像素 2 字节: [x, y]
};

struct TerrariaSpriteAnim {
  uint16_t w;
  uint16_t h;
  uint8_t frameCount;
  uint8_t frameStart;
  TerrariaFrameBlock base;
  const TerrariaFrameBlock* deltas;
  uint8_t fmt;
};
