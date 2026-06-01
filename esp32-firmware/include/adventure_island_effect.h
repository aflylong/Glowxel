// ============================================================
// Adventure Island (高桥名人冒险岛) 主题渲染器
// 移植自 website/src/utils/adventureIslandRenderer.js
// 资产: include/theme_assets/adventure_island/sprites_*.h
// ============================================================
#ifndef ADVENTURE_ISLAND_EFFECT_H
#define ADVENTURE_ISLAND_EFFECT_H

#include <Arduino.h>

namespace AdventureIslandEffect {

void init();
void deactivate();
void applyConfig();   // 无参数: 用户端只发"启动"信号, 所有参数板载常量
void update();        // 30fps tick
void render();        // 写 buffer + presentOffscreenFrame
bool isActive();

}  // namespace AdventureIslandEffect

#endif
