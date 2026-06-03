// Adventure Island sprite types.
// Generated sprite data is maintained by assets-raw/adventure-island/build-firmware-sprites.js.
#pragma once

#include <Arduino.h>
#include <pgmspace.h>

struct AISprite {
  uint16_t w;
  uint16_t h;
  uint16_t pixelCount;
  const uint8_t* pixels;
  uint8_t fmt;  // 5 = [x,y,r,g,b], 8 = [pos_lo,pos_hi,palette_idx]
};
