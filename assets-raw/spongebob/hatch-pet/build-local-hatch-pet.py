import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "website" / "public" / "spongebob" / "character-frame-pixels.json"
RUN_DIR = Path(__file__).resolve().parent / "run"
FINAL_DIR = RUN_DIR / "final"
QA_DIR = RUN_DIR / "qa"
PREVIEW_DIR = QA_DIR / "previews"
PACKAGE_DIR = RUN_DIR / "package" / "sponge-bob-duo"

CELL_W = 192
CELL_H = 208
COLS = 8
ROWS = 9
FRAME_MS = 180
SCALE = 2
LEFT_ANCHOR_X = 70
RIGHT_ANCHOR_X = 122
BASELINE_Y = 160
OUTLINE = (23, 48, 71, 255)


POSES = {
    "spongebobIdle": ("spongebob", "ldle"),
    "patrickIdle": ("patrick", "ldle"),
    "spongebobThink": ("spongebob", "beingdumb"),
    "patrickThink": ("patrick", "beingdumb"),
    "spongebobWork": ("spongebob", "walk"),
    "patrickWork": ("patrick", "walk"),
    "spongebobJump": ("spongebob", "jump"),
    "patrickJump": ("patrick", "jump"),
    "spongebobCheer": ("spongebob", "cheering"),
    "patrickCheer": ("patrick", "cheering"),
    "spongebobFail": ("spongebob", "fail"),
    "patrickFail": ("patrick", "fail"),
    "patrickScared": ("patrick", "scared"),
    "spongebobSleep": ("spongebob", "sleeping"),
    "patrickSleep": ("patrick", "sleeping"),
    "spongebobDanceA": ("spongebob", "dance"),
    "spongebobDanceB": ("spongebob", "dance3"),
    "spongebobDanceC": ("spongebob", "dance4"),
    "spongebobDanceD": ("spongebob", "dance5"),
    "patrickDanceA": ("patrick", "dance1"),
    "patrickDanceB": ("patrick", "dance2"),
    "patrickDanceC": ("patrick", "dance3"),
    "patrickDanceD": ("patrick", "dance4"),
}


ROWS_SPEC = [
    {
        "id": "idle",
        "row": 0,
        "frames": 6,
        "loops": True,
        "description": "calm duo idle",
        "steps": [
            ("spongebobIdle", "patrickIdle", 0, 0),
            ("spongebobIdle", "patrickIdle", 1, 1),
            ("spongebobIdle", "patrickIdle", 2, 2),
            ("spongebobIdle", "patrickIdle", 3, 3),
            ("spongebobIdle", "patrickIdle", 4, 4),
            ("spongebobIdle", "patrickIdle", 2, 2),
        ],
    },
    {
        "id": "running-right",
        "row": 1,
        "frames": 8,
        "loops": True,
        "description": "right drag movement",
        "offsets": [(0, 0), (2, 0), (4, -1), (5, 0), (4, 1), (2, 0), (0, -1), (-1, 0)],
        "steps": [("spongebobWork", "patrickWork", i, i) for i in range(8)],
    },
    {
        "id": "running-left",
        "row": 2,
        "frames": 8,
        "loops": True,
        "description": "left drag movement",
        "offsets": [(0, 0), (-2, 0), (-4, -1), (-5, 0), (-4, 1), (-2, 0), (0, -1), (1, 0)],
        "mirror": True,
        "steps": [("spongebobWork", "patrickWork", i, i) for i in range(8)],
    },
    {
        "id": "waving",
        "row": 3,
        "frames": 4,
        "loops": True,
        "description": "waiting/greeting attention gesture",
        "steps": [
            ("spongebobIdle", "patrickIdle", 0, 0),
            ("spongebobCheer", "patrickIdle", 1, 1),
            ("spongebobCheer", "patrickCheer", 2, 2),
            ("spongebobIdle", "patrickIdle", 3, 3),
        ],
    },
    {
        "id": "jumping",
        "row": 4,
        "frames": 5,
        "loops": True,
        "description": "dance mapped to Codex jumping row",
        "offsets": [(0, 0), (0, -5), (0, -10), (0, -5), (0, 0)],
        "steps": [
            ("spongebobDanceA", "patrickDanceA", 0, 0),
            ("spongebobDanceB", "patrickDanceB", 1, 1),
            ("spongebobDanceC", "patrickDanceC", 2, 2),
            ("spongebobDanceD", "patrickDanceD", 3, 0),
            ("spongebobCheer", "patrickCheer", 3, 2),
        ],
    },
    {
        "id": "failed",
        "row": 5,
        "frames": 8,
        "loops": False,
        "description": "separate fail reaction",
        "steps": [
            ("spongebobIdle", "patrickIdle", 0, 0),
            ("spongebobFail", "patrickFail", 0, 0),
            ("spongebobFail", "patrickFail", 1, 1),
            ("spongebobFail", "patrickScared", 2, 1),
            ("spongebobFail", "patrickFail", 2, 2),
            ("spongebobFail", "patrickFail", 2, 2),
            ("spongebobFail", "patrickFail", 2, 2),
            ("spongebobFail", "patrickFail", 2, 2),
        ],
    },
    {
        "id": "waiting",
        "row": 6,
        "frames": 6,
        "loops": True,
        "description": "thinking and waiting for input",
        "steps": [
            ("spongebobThink", "patrickIdle", 0, 0),
            ("spongebobThink", "patrickThink", 1, 0),
            ("spongebobThink", "patrickThink", 2, 1),
            ("spongebobIdle", "patrickThink", 2, 2),
            ("spongebobIdle", "patrickIdle", 3, 3),
            ("spongebobThink", "patrickIdle", 1, 4),
        ],
    },
    {
        "id": "running",
        "row": 7,
        "frames": 6,
        "loops": True,
        "description": "working or processing",
        "steps": [
            ("spongebobWork", "patrickIdle", 0, 0),
            ("spongebobWork", "patrickWork", 1, 1),
            ("spongebobThink", "patrickWork", 1, 2),
            ("spongebobWork", "patrickThink", 3, 1),
            ("spongebobWork", "patrickWork", 4, 4),
            ("spongebobIdle", "patrickWork", 2, 5),
        ],
    },
    {
        "id": "review",
        "row": 8,
        "frames": 6,
        "loops": True,
        "description": "review and success-ready pleased completion",
        "steps": [
            ("spongebobThink", "patrickThink", 0, 0),
            ("spongebobCheer", "patrickThink", 0, 1),
            ("spongebobCheer", "patrickCheer", 1, 1),
            ("spongebobJump", "patrickJump", 2, 2),
            ("spongebobCheer", "patrickCheer", 3, 2),
            ("spongebobIdle", "patrickIdle", 0, 0),
        ],
    },
]

EXTRA_PREVIEWS = {
    "dance": ROWS_SPEC[4],
    "fail": ROWS_SPEC[5],
    "working": ROWS_SPEC[7],
    "thinking": ROWS_SPEC[6],
    "success": ROWS_SPEC[8],
    "error": ROWS_SPEC[5],
    "sleeping": {
        "id": "sleeping",
        "row": -1,
        "frames": 8,
        "loops": False,
        "description": "sleeping preview, holds final frame",
        "steps": [
            ("spongebobIdle", "patrickIdle", 0, 0),
            ("spongebobSleep", "patrickSleep", 0, 0),
            ("spongebobSleep", "patrickSleep", 1, 1),
            ("spongebobSleep", "patrickSleep", 2, 2),
            ("spongebobSleep", "patrickSleep", 3, 3),
            ("spongebobSleep", "patrickSleep", 4, 4),
            ("spongebobSleep", "patrickSleep", 5, 4),
            ("spongebobSleep", "patrickSleep", 6, 4),
        ],
    },
}


def load_data():
    with SOURCE.open("r", encoding="utf-8") as f:
        data = json.load(f)
    palette = []
    for value in data["palette"]:
        value = value.lstrip("#")
        palette.append(tuple(int(value[i : i + 2], 16) for i in (0, 2, 4)) + (255,))
    return data, palette


def get_frame(data, pose_name, index):
    character, action = POSES[pose_name]
    frames = data["characters"][character]["actions"][action]["frames"]
    return frames[index % len(frames)]


def frame_metrics(frame, transparent):
    pixels = frame["p"]
    xs = []
    ys = []
    for y in range(frame["h"]):
        for x in range(frame["w"]):
            if pixels[y * frame["w"] + x] != transparent:
                xs.append(x)
                ys.append(y)
    if not xs:
        return 0, 0, 0, 0
    return min(xs), min(ys), max(xs), max(ys)


def soften_color(color):
    r, g, b, _ = color
    if r < 28 and g < 28 and b < 28:
        return OUTLINE
    if g > 200 and r < 60 and b < 80:
        return (74, 201, 122, 255)
    return color


def draw_frame(target, data, palette, pose_name, frame_index, anchor_x, baseline_y, mirror=False):
    frame = get_frame(data, pose_name, frame_index)
    min_x, min_y, max_x, max_y = frame_metrics(frame, data["transparent"])
    anchor_source_x = (min_x + max_x) / 2
    foot_y = max_y
    pixels = frame["p"]

    draw = ImageDraw.Draw(target)
    for sy in range(frame["h"]):
        for sx in range(frame["w"]):
            value = pixels[sy * frame["w"] + sx]
            if value == data["transparent"]:
                continue
            source_x = frame["w"] - 1 - sx if mirror else sx
            dx = round(anchor_x + (source_x - anchor_source_x) * SCALE)
            dy = round(baseline_y + (sy - foot_y) * SCALE)
            color = soften_color(palette[value])
            draw.rectangle([dx, dy, dx + SCALE - 1, dy + SCALE - 1], fill=color)


def render_duo_frame(data, palette, spec, frame_no):
    left_pose, right_pose, left_index, right_index = spec["steps"][frame_no % len(spec["steps"])]
    dx, dy = spec.get("offsets", [(0, 0)] * spec["frames"])[frame_no % spec["frames"]]
    image = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    mirror = spec.get("mirror", False)
    left_anchor = LEFT_ANCHOR_X + dx
    right_anchor = RIGHT_ANCHOR_X + dx
    if mirror:
        left_anchor, right_anchor = CELL_W - right_anchor, CELL_W - left_anchor
    draw_frame(image, data, palette, left_pose, left_index, left_anchor, BASELINE_Y + dy, mirror)
    draw_frame(image, data, palette, right_pose, right_index, right_anchor, BASELINE_Y + dy, mirror)
    return image


def used_bbox(image):
    alpha = image.getchannel("A")
    return alpha.getbbox()


def make_atlas(data, palette):
    atlas = Image.new("RGBA", (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))
    row_frames = {}
    for spec in ROWS_SPEC:
        frames = []
        for col in range(spec["frames"]):
            frame = render_duo_frame(data, palette, spec, col)
            atlas.alpha_composite(frame, (col * CELL_W, spec["row"] * CELL_H))
            frames.append(frame)
        row_frames[spec["id"]] = frames
    return atlas, row_frames


def make_contact_sheet(row_frames):
    label_w = 140
    sheet = Image.new("RGBA", (label_w + CELL_W * COLS, CELL_H * ROWS), (32, 38, 44, 255))
    draw = ImageDraw.Draw(sheet)
    for spec in ROWS_SPEC:
        y = spec["row"] * CELL_H
        draw.text((12, y + 12), f"{spec['row']} {spec['id']}", fill=(235, 240, 245, 255))
        draw.text((12, y + 34), spec["description"][:22], fill=(184, 196, 204, 255))
        for col, frame in enumerate(row_frames[spec["id"]]):
            x = label_w + col * CELL_W
            tile = Image.new("RGBA", (CELL_W, CELL_H), (238, 243, 245, 255))
            tile.alpha_composite(frame)
            sheet.alpha_composite(tile, (x, y))
            draw.rectangle([x, y, x + CELL_W - 1, y + CELL_H - 1], outline=(138, 151, 160, 255))
    return sheet


def save_previews(row_frames, data, palette):
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    for spec in ROWS_SPEC:
        frames = [f.copy() for f in row_frames[spec["id"]]]
        frames[0].save(
            PREVIEW_DIR / f"{spec['id']}.gif",
            save_all=True,
            append_images=frames[1:],
            duration=FRAME_MS,
            loop=0 if spec["loops"] else 1,
            disposal=2,
        )
    for name, spec in EXTRA_PREVIEWS.items():
        frames = [render_duo_frame(data, palette, spec, i) for i in range(spec["frames"])]
        frames[0].save(
            PREVIEW_DIR / f"{name}.gif",
            save_all=True,
            append_images=frames[1:],
            duration=FRAME_MS,
            loop=0 if spec["loops"] else 1,
            disposal=2,
        )


def validate(atlas, row_frames):
    errors = []
    warnings = []
    if atlas.size != (1536, 1872):
        errors.append(f"atlas size is {atlas.size}, expected 1536x1872")
    for spec in ROWS_SPEC:
        for col in range(COLS):
            cell = atlas.crop((col * CELL_W, spec["row"] * CELL_H, (col + 1) * CELL_W, (spec["row"] + 1) * CELL_H))
            bbox = used_bbox(cell)
            if col < spec["frames"] and bbox is None:
                errors.append(f"{spec['id']} col {col} is empty")
            if col >= spec["frames"] and bbox is not None:
                errors.append(f"{spec['id']} unused col {col} is not transparent")
        baselines = []
        centers = []
        for frame in row_frames[spec["id"]]:
            bbox = used_bbox(frame)
            if bbox:
                centers.append((bbox[0] + bbox[2]) / 2)
                baselines.append(bbox[3])
        if baselines and max(baselines) - min(baselines) > 22:
            warnings.append(f"{spec['id']} baseline variation {max(baselines) - min(baselines)} px")
        if centers and max(centers) - min(centers) > 20:
            warnings.append(f"{spec['id']} center variation {max(centers) - min(centers):.1f} px")
    return {
        "ok": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "atlas": {"width": atlas.width, "height": atlas.height, "cell_width": CELL_W, "cell_height": CELL_H},
        "rows": [{"state": s["id"], "row": s["row"], "frames": s["frames"], "loops": s["loops"]} for s in ROWS_SPEC],
    }


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    data, palette = load_data()
    FINAL_DIR.mkdir(parents=True, exist_ok=True)
    QA_DIR.mkdir(parents=True, exist_ok=True)
    PACKAGE_DIR.mkdir(parents=True, exist_ok=True)

    atlas, row_frames = make_atlas(data, palette)
    atlas_png = FINAL_DIR / "spritesheet.png"
    atlas_webp = FINAL_DIR / "spritesheet.webp"
    atlas.save(atlas_png)
    atlas.save(atlas_webp, lossless=True, quality=100, method=6)

    contact_sheet = make_contact_sheet(row_frames)
    contact_sheet.save(QA_DIR / "contact-sheet.png")
    save_previews(row_frames, data, palette)

    validation = validate(atlas, row_frames)
    write_json(FINAL_DIR / "validation.json", validation)
    write_json(
        QA_DIR / "review.json",
        {
            "ok": validation["ok"],
            "method": "local deterministic restyle from prepared SpongeBob and Patrick frame data",
            "notes": [
                "Patrick dance5 is not used.",
                "Dance is represented in the standard Codex jumping row and as qa/previews/dance.gif.",
                "Sleeping is exported as a non-looping preview that holds the final frame; the standard 9-row atlas has no separate sleeping row.",
            ],
            "warnings": validation["warnings"],
        },
    )

    pet_json = {
        "id": "sponge-bob-duo",
        "displayName": "SpongeBob Duo",
        "description": "A retro pixel two-character Codex desktop pet inspired by SpongeBob and Patrick, rebuilt from prepared local action frames with stable scale and baseline.",
        "spritesheetPath": "spritesheet.webp",
    }
    write_json(PACKAGE_DIR / "pet.json", pet_json)
    shutil.copy2(atlas_webp, PACKAGE_DIR / "spritesheet.webp")
    write_json(
        QA_DIR / "run-summary.json",
        {
            "ok": validation["ok"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "run_dir": str(RUN_DIR),
            "spritesheet": str(atlas_webp),
            "validation": str(FINAL_DIR / "validation.json"),
            "contact_sheet": str(QA_DIR / "contact-sheet.png"),
            "review": str(QA_DIR / "review.json"),
            "package": str(PACKAGE_DIR),
        },
    )
    print(f"ok={validation['ok']}")
    print(f"spritesheet={atlas_webp}")
    print(f"contact_sheet={QA_DIR / 'contact-sheet.png'}")
    print(f"package={PACKAGE_DIR}")
    if validation["warnings"]:
        print("warnings=" + "; ".join(validation["warnings"]))


if __name__ == "__main__":
    main()
