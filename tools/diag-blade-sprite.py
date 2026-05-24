"""分析帝皇飞剑 sprite 数据,看有没有 3x3 灰色块"""
import re
from pathlib import Path

SPRITE_FILE = Path(__file__).parent.parent / "esp32-firmware" / "include" / "theme_assets" / "terraria" / "sprites_summon_extras.h"

text = SPRITE_FILE.read_text(encoding="utf-8")
m = re.search(r'static const uint8_t kEmpressBladePixels\[\] PROGMEM = \{([^}]+)\};', text)
if not m:
    print("找不到 kEmpressBladePixels")
    exit(1)

nums = re.findall(r'0x([0-9a-fA-F]{2})', m.group(1))
data = [int(h, 16) for h in nums]
n = len(data) // 5
print(f"飞剑 sprite: 25x8, {n} 像素")
print()

# 每个像素 (x, y, r, g, b)
pixels = []
for i in range(n):
    x, y, r, g, b = data[i*5:i*5+5]
    pixels.append((x, y, r, g, b))

# 1. 看每个像素的颜色统计
print("颜色分布:")
from collections import Counter
colors = Counter()
for _, _, r, g, b in pixels:
    colors[(r, g, b)] += 1
for (r, g, b), cnt in sorted(colors.items(), key=lambda kv: -kv[1]):
    print(f"  rgb=({r:3d},{g:3d},{b:3d}) #{r:02x}{g:02x}{b:02x}  × {cnt}  灰度={(r+g+b)//3}")

# 2. 全局像素分布(x, y 矩阵)
print()
print("像素分布(. = 透明, # = 有像素):")
grid = [['.' for _ in range(25)] for _ in range(8)]
for x, y, r, g, b in pixels:
    if 0 <= x < 25 and 0 <= y < 8:
        grid[y][x] = '#'
for row in grid:
    print('  ' + ''.join(row))
