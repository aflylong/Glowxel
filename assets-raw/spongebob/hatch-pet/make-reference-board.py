from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "hatch-pet"
OUT_PATH = OUT_DIR / "spongebob-duo-reference-board.png"

TILE_W = 96
TILE_H = 104
LABEL_H = 16
PAD = 10
BG = (18, 54, 66, 255)
PANEL = (42, 103, 119, 255)
TEXT = (245, 238, 181, 255)

ITEMS = [
    ("spongebob idle", "cuts/spongebob-frames-refined/ldle/01.png"),
    ("patrick idle", "cuts/patrick-frames-refined/ldle/01.png"),
    ("spongebob dance", "cuts/spongebob-frames-refined/dance/03.png"),
    ("patrick dance1", "cuts/patrick-frames-refined/dance1/02.png"),
    ("spongebob dance3", "cuts/spongebob-frames-refined/dance3/03.png"),
    ("patrick dance2", "cuts/patrick-frames-refined/dance2/02.png"),
    ("spongebob dance4", "cuts/spongebob-frames-refined/dance4/04.png"),
    ("patrick dance3", "cuts/patrick-frames-refined/dance3/03.png"),
    ("spongebob dance5", "cuts/spongebob-frames-refined/dance5/04.png"),
    ("patrick dance4", "cuts/patrick-frames-refined/dance4/02.png"),
    ("spongebob fail", "cuts/spongebob-frames-refined/fail/02.png"),
    ("patrick fail", "cuts/patrick-frames-refined/fail/02.png"),
    ("spongebob sleep", "cuts/spongebob-frames-refined/sleeping/07.png"),
    ("patrick sleep", "cuts/patrick-frames-refined/sleeping/05.png"),
]


def non_empty_bbox(image):
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    return alpha.getbbox()


def paste_centered(canvas, sprite, tile_x, tile_y):
    bbox = non_empty_bbox(sprite)
    if bbox is None:
        raise RuntimeError("empty sprite")

    cropped = sprite.convert("RGBA").crop(bbox)
    max_w = TILE_W - PAD * 2
    max_h = TILE_H - LABEL_H - PAD * 2
    scale = min(max_w / cropped.width, max_h / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.NEAREST,
    )
    x = tile_x + (TILE_W - resized.width) // 2
    y = tile_y + PAD + (max_h - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))


def draw_label(draw, label, tile_x, tile_y):
    font = ImageFont.load_default()
    text = label[:18]
    box = draw.textbbox((0, 0), text, font=font)
    width = box[2] - box[0]
    x = tile_x + (TILE_W - width) // 2
    y = tile_y + TILE_H - LABEL_H + 2
    draw.text((x, y), text, fill=TEXT, font=font)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    missing = []
    for _, rel_path in ITEMS:
        path = ROOT / rel_path
        if not path.exists():
            missing.append(str(path))
    if missing:
        raise SystemExit("missing reference images:\n" + "\n".join(missing))

    cols = 4
    rows = (len(ITEMS) + cols - 1) // cols
    width = cols * TILE_W
    height = rows * TILE_H
    canvas = Image.new("RGBA", (width, height), BG)
    draw = ImageDraw.Draw(canvas)

    for index, (label, rel_path) in enumerate(ITEMS):
        col = index % cols
        row = index // cols
        x = col * TILE_W
        y = row * TILE_H
        draw.rectangle((x + 2, y + 2, x + TILE_W - 3, y + TILE_H - 3), fill=PANEL)
        paste_centered(canvas, Image.open(ROOT / rel_path), x, y)
        draw_label(draw, label, x, y)

    canvas.save(OUT_PATH)
    print(OUT_PATH)


if __name__ == "__main__":
    main()
