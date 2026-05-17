#ifndef TERRARIA_CLOCK_EFFECT_H
#define TERRARIA_CLOCK_EFFECT_H

#include <Arduino.h>
#include <ESP32-HUB75-MatrixPanel-I2S-DMA.h>
#include "terraria_mode_types.h"

namespace TerrariaClockEffect {
void init();
void deactivate();
void applyConfig(const TerrariaModeConfig& config);
void update();   // 每帧调用, 推进 animTick
void render();   // 实际画到 display
bool isActive();
const TerrariaModeConfig& getConfig();
const char* getLastError();
}

#endif
