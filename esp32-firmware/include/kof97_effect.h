// ============================================================
// KOF '97 选人界面 + 像素电视机外壳 主题渲染器
// 移植自 website/src/utils/kof97Renderer.js
// 资产: include/theme_assets/kof97/sprites_*.h
// ============================================================
#ifndef KOF97_EFFECT_H
#define KOF97_EFFECT_H

#include <Arduino.h>

namespace Kof97Effect {

void init();
void deactivate();
void applyConfig();   // 无参数: 用户端只发"启动", 全部参数板载常量
void update();        // ~30fps tick (推进随机切换 / stance 帧)
void render();        // 写 buffer + presentOffscreenFrame
bool isActive();

}  // namespace Kof97Effect

#endif
