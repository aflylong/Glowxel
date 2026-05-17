from PIL import Image
from collections import Counter

p = r'd:\project\Glowxel\esp32-firmware\ScreenShot.png'
im = Image.open(p).convert('RGB')
W, H = im.size
print(f"size={W}x{H}")

# 1. 缩到 64x64 看主色块分布(用最近邻和Lanczos各看一次)
for resample, name in [(Image.NEAREST, 'NEAREST'), (Image.LANCZOS, 'LANCZOS')]:
    small = im.resize((64, 64), resample)
    pixels = list(small.getdata())
    cnt = Counter(pixels)
    print(f"\n--- {name} top 12 colors ---")
    for c, n in cnt.most_common(12):
        print(f"  rgb{c}  count={n}")

# 2. 把图像切成 8x8 区块,每块的平均色,反映粗略布局
small = im.resize((64, 64), Image.LANCZOS)
print("\n--- 8x8 块的代表色（用 . 表示亮度）---")
import statistics
def lum(rgb):
    r, g, b = rgb
    return 0.2126*r + 0.7152*g + 0.0722*b
chars = ' .:-=+*#%@'
for by in range(8):
    row = ''
    for bx in range(8):
        rs = []
        for y in range(by*8, by*8+8):
            for x in range(bx*8, bx*8+8):
                rs.append(small.getpixel((x, y)))
        avgL = sum(lum(p) for p in rs) / len(rs)
        idx = min(len(chars)-1, int(avgL/255*len(chars)))
        row += chars[idx]
    print('  ' + row)

# 3. 画面四角和中心采样
print("\n--- 关键采样点 (基于原图) ---")
for label, (x, y) in [('TL',(0,0)),('TR',(W-1,0)),('BL',(0,H-1)),('BR',(W-1,H-1)),
                      ('CENTER',(W//2,H//2)),
                      ('TOP_MID',(W//2,H//8)),('BOT_MID',(W//2,H*7//8))]:
    print(f"  {label} {im.getpixel((x,y))}")

# 4. 直方图(亮度)
hist = [0]*8
for p in im.getdata():
    L = lum(p)
    hist[min(7, int(L/32))] += 1
print("\n--- 亮度直方图 (8 桶) ---")
for i, c in enumerate(hist):
    print(f"  bucket{i} ({i*32}-{i*32+31}): {c}")
