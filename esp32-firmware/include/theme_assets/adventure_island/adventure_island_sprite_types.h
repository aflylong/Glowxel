// Adventure Island sprite 类型定义
// 由 build-firmware-sprites.js 引用; 不要手改
#pragma once

#include <Arduino.h>
#include <pgmspace.h>

struct AISprite {
  uint16_t w;
  uint16_t h;
  uint16_t pixelCount;
  const uint8_t* pixels;
  uint8_t fmt;  // 5 = [x,y,r,g,b] 每像素 5 字节
};
