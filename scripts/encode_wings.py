"""
Encode Terraria wings PNGs into wings.js format.
Format per wing: { w, h, frameCount, fmt, base: {n, b}, deltas: [{n, b}...] }
- fmt=5: each pixel = 5 bytes (x8, y8, r, g, b), for w/h <= 255
- fmt=7: each pixel = 7 bytes (x16LE, y16LE, r, g, b), for w/h > 255
- base: frame 0 non-transparent pixels encoded
- deltas[i]: pixels that differ between frame i+1 and frame 0
"""

import os
import json
import base64
import struct
from PIL import Image

SRC_DIR = r'D:\project\Pokemon\terraria-clock-preview\terraria-glowxel-1456\_extract_1456'
OUTPUT = r'D:\project\Glowxel\uniapp\static\terraria\wings.js'

# IDs to add (exclude 4/22/28/33/41/45/47/44/40)
NEW_IDS = [1,2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,25,26,27,34,35,36,37,38,39,42,43,46,48,49,50,51]

# Existing IDs to preserve
EXISTING_IDS = [29, 30, 31, 32]


def determine_frame_height(w, h):
    """Determine frame height based on image dimensions."""
    # Known frame heights from existing data:
    # 86x248 -> frame_h=62, frames=4
    # Try common frame heights
    if w == 86:
        if h % 62 == 0:
            return 62
        # 264/4=66 - Wings_5 and Wings_27
        if h % 66 == 0:
            return 66
    if w == 108:
        # 240/4=60
        if h % 60 == 0:
            return 60
    if w == 110:
        # 248/4=62
        if h % 62 == 0:
            return 62
    if w == 80:
        # 420 - try common dividers
        # 420/4=105, 420/5=84, 420/6=70, 420/7=60
        if h % 60 == 0:
            return 60
        if h % 70 == 0:
            return 70
        if h % 84 == 0:
            return 84
    if w == 90:
        # 512 - 512/8=64
        if h % 64 == 0:
            return 64
    if w == 120:
        # 1034 - tricky. 1034/2=517, not clean
        # Maybe frame_h varies. Let's try dividing
        # 1034/11=94, 1034/22=47, 1034/517=2
        # Could be 94 pixels per frame, 11 frames
        # Or maybe the actual content tells us - let's try common ones
        if h % 94 == 0:
            return 94
    # Fallback: try to find a reasonable frame height
    # For terraria wings, frame counts are typically 4-11
    for fc in [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]:
        if h % fc == 0:
            fh = h // fc
            if 50 <= fh <= 120:
                return fh
    # Ultimate fallback
    return h


def encode_frame_pixels(img, x_off, y_off, w, h, fmt):
    """Encode non-transparent pixels of a frame region."""
    buf = bytearray()
    n = 0
    for y in range(h):
        for x in range(w):
            px = img.getpixel((x_off + x, y_off + y))
            # Handle RGBA and RGB
            if len(px) == 4:
                r, g, b, a = px
            else:
                r, g, b = px
                a = 255
            if a == 0:
                continue
            if fmt == 5:
                buf.append(x)
                buf.append(y)
            else:  # fmt == 7
                buf += struct.pack('<H', x)
                buf += struct.pack('<H', y)
            buf.append(r)
            buf.append(g)
            buf.append(b)
            n += 1
    return n, base64.b64encode(bytes(buf)).decode('ascii')


def encode_delta_pixels(img, base_img, x_off_cur, y_off_cur, x_off_base, y_off_base, w, h, fmt):
    """Encode pixels that differ between current frame and base frame."""
    buf = bytearray()
    n = 0
    for y in range(h):
        for x in range(w):
            cur_px = img.getpixel((x_off_cur + x, y_off_cur + y))
            base_px = img.getpixel((x_off_base + x, y_off_base + y))
            if len(cur_px) == 4:
                cr, cg, cb, ca = cur_px
            else:
                cr, cg, cb = cur_px
                ca = 255
            if len(base_px) == 4:
                br, bg, bb, ba = base_px
            else:
                br, bg, bb = base_px
                ba = 255

            # Skip if identical
            if (cr, cg, cb, ca) == (br, bg, bb, ba):
                continue
            # Skip transparent-to-transparent
            if ca == 0 and ba == 0:
                continue

            # Encode the current pixel (even if transparent in current - 
            # use r=0,g=0,b=0 for transparent? Let's check existing behavior)
            # Based on the format description: encode [x,y,r,g,b] difference
            # If current is transparent, we still encode it with r,g,b = 0,0,0
            if fmt == 5:
                buf.append(x)
                buf.append(y)
            else:
                buf += struct.pack('<H', x)
                buf += struct.pack('<H', y)
            if ca == 0:
                buf.append(0)
                buf.append(0)
                buf.append(0)
            else:
                buf.append(cr)
                buf.append(cg)
                buf.append(cb)
            n += 1
    return n, base64.b64encode(bytes(buf)).decode('ascii')


def process_wing(wing_id):
    """Process a single wing PNG and return its data dict."""
    filepath = os.path.join(SRC_DIR, f'Wings_{wing_id}.png')
    img = Image.open(filepath).convert('RGBA')
    w, h_total = img.size
    
    frame_h = determine_frame_height(w, h_total)
    frame_count = h_total // frame_h
    
    # Determine fmt
    fmt = 7 if (w > 255 or frame_h > 255) else 5
    
    # Encode base (frame 0)
    base_n, base_b = encode_frame_pixels(img, 0, 0, w, frame_h, fmt)
    
    # Encode deltas (frame i vs frame 0)
    deltas = []
    for i in range(1, frame_count):
        y_off = i * frame_h
        delta_n, delta_b = encode_delta_pixels(img, img, 0, y_off, 0, 0, w, frame_h, fmt)
        deltas.append({"n": delta_n, "b": delta_b})
    
    return {
        "w": w,
        "h": frame_h,
        "frameCount": frame_count,
        "fmt": fmt,
        "base": {"n": base_n, "b": base_b},
        "deltas": deltas
    }


def main():
    # Read existing wings.js to preserve existing entries
    with open(OUTPUT, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse existing data - it's module.exports = {...};
    # Extract the JSON part
    json_str = content.replace('module.exports = ', '', 1).rstrip().rstrip(';')
    existing_data = json.loads(json_str)
    
    # Process new wings
    for wing_id in NEW_IDS:
        key = f'wings_{wing_id}'
        if key in existing_data:
            print(f'Skipping {key} (already exists)')
            continue
        print(f'Processing Wings_{wing_id}...')
        data = process_wing(wing_id)
        existing_data[key] = data
        print(f'  {data["w"]}x{data["h"]}, {data["frameCount"]} frames, fmt={data["fmt"]}, base.n={data["base"]["n"]}, deltas={len(data["deltas"])}')
    
    # Write output - sort keys by numeric ID
    def sort_key(k):
        return int(k.replace('wings_', ''))
    
    sorted_keys = sorted(existing_data.keys(), key=sort_key)
    sorted_data = {k: existing_data[k] for k in sorted_keys}
    
    # Write as module.exports = {...} in compact JSON
    json_output = json.dumps(sorted_data, separators=(',', ':'))
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(f'module.exports = {json_output}')
    
    print(f'\nDone! Written to {OUTPUT}')
    print(f'Total wings: {len(sorted_data)}')


if __name__ == '__main__':
    main()
