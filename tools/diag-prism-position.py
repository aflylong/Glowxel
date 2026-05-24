"""模拟最后的棱镜(3541)渲染位置,看是不是头顶有 4x4 块"""
import math
import re
from pathlib import Path

SPRITE_FILE = Path(__file__).parent.parent / "esp32-firmware" / "include" / "theme_assets" / "terraria" / "sprites_weapons.h"

text = SPRITE_FILE.read_text(encoding="utf-8")
m = re.search(r'static const uint8_t kWeapon_3541Pixels\[\] PROGMEM = \{([^}]+)\};', text)
nums = re.findall(r'0x([0-9a-fA-F]{2})', m.group(1))
data = [int(h, 16) for h in nums]
n = len(data) // 5

pixels = []
for i in range(n):
    x, y, r, g, b = data[i*5:i*5+5]
    pixels.append((x, y, r, g, b))

W, H = 7, 8
print(f"棱镜 sprite: {W}x{H}, {len(pixels)} 像素")
print()

# 1. sprite 本身像素分布
print("sprite 本身像素分布(灰度):")
grid_local = [['.'] * W for _ in range(H)]
for x, y, r, g, b in pixels:
    if 0 <= x < W and 0 <= y < H:
        avg = (r + g + b) // 3
        grid_local[y][x] = ('#' if avg > 100 else '*')
for row in grid_local:
    print('  ' + ''.join(row))

print()
# 2. 颜色分布
from collections import Counter
colors = Counter()
for _, _, r, g, b in pixels:
    colors[(r, g, b)] += 1
print("颜色分布:")
for (r, g, b), cnt in sorted(colors.items(), key=lambda kv: -kv[1]):
    avg = (r + g + b) // 3
    print(f"  rgb=({r:3d},{g:3d},{b:3d}) #{r:02x}{g:02x}{b:02x}  灰度={avg}  × {cnt}")

print()

# 3. 模拟实际渲染 (按板载 drawWeapon 算法精确复制)
# WeaponProps: 3541, useStyle=5, ofsX=22, ofsY=-7, rotateDeg=90
# 默认: playerX=14, playerY=51, playerScale=27 (= 0.27)
playerX = 14.0
playerY = 51.0
playerScale = 0.27
ofsX = 22
ofsY = -7
rotateDeg = 90
useStyle = 5
dir_v = 1  # 朝右

# FRAME_W / FRAME_H 必须查
print(f"playerX={playerX}, playerY={playerY}, playerScale={playerScale}")
print()

# 假设 FRAME_W = 40, FRAME_H = 56 (或其他, 我得查下面)
# 先按代码模拟
FRAME_W = 40  # 待确认
FRAME_H = 56  # 待确认

# 持握手部位置 (角色 sprite 局部坐标)
handLocalX = (26.0 if dir_v > 0 else 14.0) + ofsX * dir_v   # 26+22 = 48
handLocalY = 38.0 + ofsY                                      # 38-7 = 31
handX = playerX + (handLocalX - FRAME_W / 2.0) * playerScale  # 14 + (48-20)*0.27 = 14+7.56=21.56
handY = playerY + (handLocalY - FRAME_H / 2.0) * playerScale  # 51 + (31-28)*0.27 = 51+0.81=51.81
print(f"假设 FRAME_W={FRAME_W}, FRAME_H={FRAME_H}")
print(f"handLocalX={handLocalX}, handLocalY={handLocalY}")
print(f"handX={handX}, handY={handY}")

# useStyle=5: drawCx=handX, drawCy=handY
drawCx = handX
drawCy = handY
print(f"drawCx={drawCx}, drawCy={drawCy}")

# 旋转 90°
rad = rotateDeg * math.pi / 180
cosR = math.cos(rad)
sinR = math.sin(rad)
spriteCx = W * 0.5  # 3.5
spriteCy = H * 0.5  # 4.0

print()
print("渲染到屏幕的像素位置 (drawWeapon 不缩放, sprite 是预缩放过的):")
print()
grid_screen = [['.'] * 64 for _ in range(64)]
positions = []
for sx, sy, r, g, b in pixels:
    lx = sx - spriteCx
    ly = sy - spriteCy
    nx = lx * cosR - ly * sinR
    ny = lx * sinR + ly * cosR
    px = int(drawCx + nx + 0.5)
    py = int(drawCy + ny + 0.5)
    positions.append((px, py, r, g, b))
    if 0 <= px < 64 and 0 <= py < 64:
        avg = (r + g + b) // 3
        grid_screen[py][px] = '#' if avg > 100 else '*'

# 找 bbox
xs = [p[0] for p in positions]
ys = [p[1] for p in positions]
minX, maxX = min(xs), max(xs)
minY, maxY = min(ys), max(ys)
print(f"实际渲染 bbox: x={minX}..{maxX}, y={minY}..{maxY}")
print()

# 打印 bbox + pad
pad = 3
y0 = max(0, minY - pad)
y1 = min(63, maxY + pad)
x0 = max(0, minX - pad)
x1 = min(63, maxX + pad)
print(f"屏幕渲染区 (x={x0}..{x1}, y={y0}..{y1}):")
header = '   ' + ''.join([str(x % 10) for x in range(x0, x1 + 1)])
print(header)
for y in range(y0, y1 + 1):
    line = []
    for x in range(x0, x1 + 1):
        line.append(grid_screen[y][x])
    print(f"y={y:2d} " + ''.join(line))
