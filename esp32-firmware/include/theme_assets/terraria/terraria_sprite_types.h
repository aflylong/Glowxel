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
struct TerrariaFrameBlock {
  uint16_t pixelCount;
  const uint8_t* pixels;
};

struct TerrariaSpriteAnim {
  uint16_t w;
  uint16_t h;
  uint8_t frameCount;
  TerrariaFrameBlock base;
  const TerrariaFrameBlock* deltas;
  uint8_t fmt;
};
