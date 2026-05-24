"""模拟飞剑在屏幕上的实际渲染位置(精确 reproducing 板载 C++ 算法)"""
import math
import re
from pathlib import Path

SPRITE_FILE = Path(__file__).parent.parent / "esp32-firmware" / "include" / "theme_assets" / "terraria" / "sprites_summon_extras.h"

text = SPRITE_FILE.read_text(encoding="utf-8")
m = re.search(r'static const uint8_t kEmpressBladePixels\[\] PROGMEM = \{([^}]+)\};', text)
nums = re.findall(r'0x([0-9a-fA-F]{2})', m.group(1))
data = [int(h, 16) for h in nums]
n = len(data) // 5

pixels = []
for i in range(n):
    x, y, r, g, b = data[i*5:i*5+5]
    pixels.append((x, y, r, g, b))

W, H = 25, 8
sprCx = W * 0.5
sprCy = H * 0.5

# 默认配置(召唤师 + 飞剑)
playerX = 14
playerY = 51
bladeX = -8
bladeY = 1
bladeAngle_deg = 105

cx, cy = float(playerX), float(playerY)
blX = cx + bladeX
# bobY 范围 ±2,这里取最大上浮(blY 最小)
for bob_phase, bob_val in [("中位 0", 0.0), ("上浮 -2", -2.0), ("下浮 +2", 2.0)]:
    blY = cy + bladeY + bob_val
    angle = bladeAngle_deg * math.pi / 180.0
    cosA = math.cos(angle)
    sinA = math.sin(angle)
    # 屏幕上 64x64 grid,标记飞剑像素位置
    grid = [['.' for _ in range(64)] for _ in range(64)]
    for lx, ly, r, g, b in pixels:
        rx = lx - sprCx
        ry = ly - sprCy
        nx = rx * cosA - ry * sinA
        ny = rx * sinA + ry * cosA
        px = int(blX + nx + 0.5)
        py = int(blY + ny + 0.5)
        if 0 <= px < 64 and 0 <= py < 64:
            grid[py][px] = '#'
    print(f"=== bob {bob_phase} (blY={blY}) ===")
    # 只打印 y=0..63 的精简区域
    minX, maxX, minY, maxY = 64, -1, 64, -1
    for y in range(64):
        for x in range(64):
            if grid[y][x] == '#':
                if x < minX: minX = x
                if x > maxX: maxX = x
                if y < minY: minY = y
                if y > maxY: maxY = y
    if maxX < 0:
        print("  no pixels rendered on screen")
        continue
    print(f"  bbox: x={minX}..{maxX}, y={minY}..{maxY}")
    # 打印 bbox 周围,扩展 2 像素
    pad = 2
    y0 = max(0, minY - pad)
    y1 = min(63, maxY + pad)
    x0 = max(0, minX - pad)
    x1 = min(63, maxX + pad)
    print(f"  display range x={x0}..{x1}, y={y0}..{y1}:")
    for y in range(y0, y1 + 1):
        line = []
        for x in range(x0, x1 + 1):
            line.append(grid[y][x])
        print(f"  y={y:2d}: " + ''.join(line))
    print()
