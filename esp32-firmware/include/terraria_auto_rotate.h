#ifndef TERRARIA_AUTO_ROTATE_H
#define TERRARIA_AUTO_ROTATE_H

#include "terraria_mode_types.h"

namespace TerrariaAutoRotate {
  void init();
  void applyConfig(const RotateConfig& cfg);
  void tick();  // 每帧调用, 按真实时钟检查是否到切换时刻
  void saveToFlash();
  void loadFromFlash();
  bool isEnabled();
}

#endif
