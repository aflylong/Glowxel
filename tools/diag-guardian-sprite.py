"""分析 guardian sprite 数据,找出 sprite 各帧像素的实际位置和颜色,
   定位"3x3 灰色方块"问题源头"""
import re
from pathlib import Path

GUARDIAN_H = Path(__file__).parent.parent / "esp32-firmware" / "include" / "theme_assets" / "terraria" / "sprites_guardian.h"

text = GUARDIAN_H.read_text(encoding="utf-8")

arrays = {}
for m in re.finditer(r'static const uint8_t (\w+)Pixels\[\] PROGMEM = \{([^}]+)\};', text):
    name = m.group(1)
    body = m.group(2)
    nums = re.findall(r'0x([0-9a-fA-F]{2})', body)
    arrays[name] = [int(h, 16) for h in nums]

print(f"sprite 尺寸: 29x25, 共 8 帧")
print()

# 1. 看 base 帧覆盖了哪些 (x, y),哪些位置 base 没画
base_data = arrays.get("kGuardian_623Base", [])
n_base = len(base_data) // 5
base_coords = set()
base_pixels = {}
for i in range(n_base):
    x, y, r, g, b = base_data[i*5:i*5+5]
    base_coords.add((x, y))
    base_pixels[(x, y)] = (r, g, b)

print(f"base 帧像素数: {n_base}")
print(f"base 帧 x 范围: {min(p[0] for p in base_coords)}..{max(p[0] for p in base_coords)}")
print(f"base 帧 y 范围: {min(p[1] for p in base_coords)}..{max(p[1] for p in base_coords)}")
print()

# 2. 每个 delta 帧,找出它画了哪些 (x, y),哪些是 base 没有的(新出现像素),
#    更关键: 切到下一帧时,这一帧的"独有像素"是不是有人擦?
delta_frames = {}
for k in range(7):
    name = f"kGuardian_623Delta{k}Set"
    data = arrays.get(name, [])
    n = len(data) // 5
    coords = {}
    for i in range(n):
        x, y, r, g, b = data[i*5:i*5+5]
        coords[(x, y)] = (r, g, b)
    delta_frames[k] = coords

# 3. 每帧的实际"屏上呈现":
#    frame 0 = base
#    frame N (N>=1) = base + delta_{N-1}.set 覆盖
# 但 delta 帧之间没 clear,所以从 frame i 切换到 frame j 时,
# 屏上像素 = base 重画 + delta_{j-1}.set 覆盖
# 因为 buildFrame 每帧都重画背景 + base + delta,所以前一帧的 delta 不会残留
# 这里没问题。
#
# 那"3x3 灰色"哪来的?可能是:
#  - delta 帧中有"看起来灰" 的像素(虽然不是中性灰)
#  - 或缩放算法误差
#  - 或天空背景色透过 sprite 透明像素显出来形成"灰块"

# 4. 看 delta 帧画过但 base 没画的位置 — 这些是 delta 独有像素
print("=== delta 独有像素分析 (delta 画了 base 没画) ===")
for k in range(7):
    coords = delta_frames[k]
    delta_only = [(xy, rgb) for xy, rgb in coords.items() if xy not in base_coords]
    if delta_only:
        print(f"\nDelta {k}: {len(delta_only)} 个 delta 独有像素")
        for xy, rgb in sorted(delta_only)[:20]:
            x, y = xy
            r, g, b = rgb
            print(f"  ({x},{y})  rgb=({r},{g},{b})  hex=#{r:02x}{g:02x}{b:02x}")

# 5. 看每帧的"高 y" 区域,如果 y < 5 (sprite top) 的位置是"头顶上方"
print()
print("=== 各帧 y < 5 的像素 (sprite 顶部, 即角色头顶) ===")
for k in range(7):
    coords = delta_frames[k]
    top_pixels = sorted(((xy, rgb) for xy, rgb in coords.items() if xy[1] < 5),
                       key=lambda p: (p[0][1], p[0][0]))
    if top_pixels:
        print(f"\nDelta {k}:")
        for xy, rgb in top_pixels[:15]:
            x, y = xy
            r, g, b = rgb
            print(f"  ({x},{y})  rgb=({r},{g},{b})")
print()
print("=== base 帧 y < 5 的像素 ===")
top_base = sorted(((xy, base_pixels[xy]) for xy in base_coords if xy[1] < 5),
                  key=lambda p: (p[0][1], p[0][0]))
for xy, rgb in top_base[:25]:
    x, y = xy
    r, g, b = rgb
    print(f"  ({x},{y})  rgb=({r},{g},{b})")
