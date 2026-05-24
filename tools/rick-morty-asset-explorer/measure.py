"""读取 raw/*.png 的实际像素尺寸,生成 manifest.json
不依赖 PIL,直接读 PNG 头(IHDR chunk)。
PNG 文件结构:
  signature 8B + IHDR chunk(length 4 + type "IHDR" 4 + width 4 + height 4 + ...)
"""
import json
import struct
from pathlib import Path

RAW_DIR = Path(__file__).parent / "raw"
OUT_PATH = Path(__file__).parent / "manifest.json"


def read_png_size(png_path: Path):
    with png_path.open("rb") as f:
        sig = f.read(8)
        if sig != b"\x89PNG\r\n\x1a\n":
            raise ValueError(f"not a PNG: {png_path}")
        # IHDR chunk: length(4) + type(4) + data(13) ...
        f.read(4)  # length
        ctype = f.read(4)
        if ctype != b"IHDR":
            raise ValueError(f"first chunk is not IHDR: {ctype}")
        width, height = struct.unpack(">II", f.read(8))
        return width, height


def main():
    entries = []
    for png in sorted(RAW_DIR.glob("*.png")):
        w, h = read_png_size(png)
        entries.append({
            "file": png.name,
            "width": w,
            "height": h,
            "bytes": png.stat().st_size,
        })

    # 按 character_dir_frame 解析
    by_char = {}
    for e in entries:
        # 文件名形如 rick_Down_1.png / weird_rick_Up_3.png / evil_morty_Down_2.png
        # 角色 key 可能含下划线(weird_rick / evil_morty),所以用方向关键字定位拆分位置
        stem = e["file"][:-4]  # strip .png
        direction = None
        for d in ("Down", "Up", "Side"):
            tag = f"_{d}_"
            if tag in stem:
                idx = stem.rfind(tag)
                char_key = stem[:idx]
                frame_str = stem[idx + len(tag):]
                direction = d
                break
        if direction is None:
            continue
        try:
            frame = int(frame_str)
        except ValueError:
            continue
        char = by_char.setdefault(char_key, {"frames": []})
        char["frames"].append({
            "direction": direction,
            "frame": frame,
            "file": e["file"],
            "width": e["width"],
            "height": e["height"],
            "bytes": e["bytes"],
        })

    for char_key, data in by_char.items():
        data["frames"].sort(key=lambda x: (x["direction"], x["frame"]))
        widths = [f["width"] for f in data["frames"]]
        heights = [f["height"] for f in data["frames"]]
        data["max_width"] = max(widths)
        data["max_height"] = max(heights)
        data["min_width"] = min(widths)
        data["min_height"] = min(heights)

    payload = {
        "source": "https://pocketmortys.net/media/com_pocketmortys/assets/",
        "characters": {
            "rick":       {"asset": "CharacterRickDefault", "label": "Rick (C-137)"},
            "morty":      {"asset": "MortyDefault",         "label": "Morty"},
            "weird_rick": {"asset": "CharacterWeirdRick",   "label": "Weird Rick (Rick Prime)"},
            "evil_morty": {"asset": "MortyEvil",            "label": "Evil Morty"},
        },
        "data": by_char,
    }
    # 把 character.label 合并进 by_char
    for char_key, meta in payload["characters"].items():
        if char_key in by_char:
            payload["data"][char_key].update({
                "asset": meta["asset"],
                "label": meta["label"],
            })

    OUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {OUT_PATH}")
    print()
    print("Summary:")
    for char_key, data in by_char.items():
        label = payload["characters"].get(char_key, {}).get("label", char_key)
        print(f"  {label:30s}  {len(data['frames'])} frames  "
              f"size range {data['min_width']}x{data['min_height']} ~ "
              f"{data['max_width']}x{data['max_height']}")


if __name__ == "__main__":
    main()
