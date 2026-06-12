import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "website" / "public" / "spongebob" / "character-frame-pixels.json"
OUT_DIR = Path(__file__).resolve().parent / "separated"

CELL_W = 192
CELL_H = 208
COLS = 8
ROWS = 9
FRAME_MS = 180
SCALE = 2
ANCHOR_X = 96
BASELINE_Y = 160
OUTLINE = (23, 48, 71, 255)


PETS = {
    "spongebob-pixel": {
        "displayName": "SpongeBob Pixel",
        "description": "A retro pixel Codex desktop pet inspired by SpongeBob, rebuilt as a separate stable single-character sprite.",
        "character": "spongebob",
        "poses": {
            "idle": "ldle",
            "think": "beingdumb",
            "work": "walk",
            "jump": "jump",
            "cheer": "cheering",
            "fail": "fail",
            "sleep": "sleeping",
            "dance_a": "dance",
            "dance_b": "dance3",
            "dance_c": "dance4",
            "dance_d": "dance5",
        },
    },
    "patrick-pixel": {
        "displayName": "Patrick Pixel",
        "description": "A retro pixel Codex desktop pet inspired by Patrick, rebuilt as a separate stable single-character sprite.",
        "character": "patrick",
        "poses": {
            "idle": "ldle",
            "think": "beingdumb",
            "work": "walk",
            "jump": "jump",
            "cheer": "cheering",
            "fail": "fail",
            "scared": "scared",
            "sleep": "sleeping",
            "dance_a": "dance1",
            "dance_b": "dance2",
            "dance_c": "dance3",
            "dance_d": "dance4",
        },
    },
}


ROWS_SPEC = [
    {
        "id": "idle",
        "row": 0,
        "frames": 6,
        "loops": True,
        "description": "calm idle",
        "steps": [("idle", 0), ("idle", 1), ("idle", 2), ("idle", 3), ("idle", 4), ("idle", 2)],
    },
    {
        "id": "running-right",
        "row": 1,
        "frames": 8,
        "loops": True,
        "description": "right drag movement",
        "offsets": [(0, 0), (3, 0), (6, -1), (8, 0), (6, 1), (3, 0), (0, -1), (-2, 0)],
        "steps": [("work", i) for i in range(8)],
    },
    {
        "id": "running-left",
        "row": 2,
        "frames": 8,
        "loops": True,
        "description": "left drag movement",
        "offsets": [(0, 0), (-3, 0), (-6, -1), (-8, 0), (-6, 1), (-3, 0), (0, -1), (2, 0)],
        "mirror": True,
        "steps": [("work", i) for i in range(8)],
    },
    {
        "id": "waving",
        "row": 3,
        "frames": 4,
        "loops": True,
        "description": "attention gesture",
        "steps": [("idle", 0), ("cheer", 0), ("cheer", 1), ("idle", 2)],
    },
    {
        "id": "jumping",
        "row": 4,
        "frames": 5,
        "loops": True,
        "description": "dance mapped to Codex jumping row",
        "offsets": [(0, 0), (0, -5), (0, -10), (0, -5), (0, 0)],
        "steps": [("dance_a", 0), ("dance_b", 1), ("dance_c", 2), ("dance_d", 0), ("cheer", 2)],
    },
    {
        "id": "failed",
        "row": 5,
        "frames": 8,
        "loops": False,
        "description": "separate fail reaction",
        "steps": [("idle", 0), ("fail", 0), ("fail", 1), ("fail", 2), ("fail", 2), ("fail", 2), ("fail", 2), ("fail", 2)],
    },
    {
        "id": "waiting",
        "row": 6,
        "frames": 6,
        "loops": True,
        "description": "thinking and waiting",
        "steps": [("think", 0), ("think", 1), ("think", 2), ("idle", 2), ("idle", 3), ("think", 1)],
    },
    {
        "id": "running",
        "row": 7,
        "frames": 6,
        "loops": True,
        "description": "working or processing",
        "steps": [("work", 0), ("work", 1), ("think", 1), ("work", 3), ("work", 4), ("idle", 2)],
    },
    {
        "id": "review",
        "row": 8,
        "frames": 6,
        "loops": True,
        "description": "review and success-ready",
        "steps": [("think", 0), ("cheer", 0), ("cheer", 1), ("jump", 2), ("cheer", 2), ("idle", 0)],
    },
]


EXTRA_PREVIEW_IDS = {
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
        "steps": [("idle", 0), ("sleep", 0), ("sleep", 1), ("sleep", 2), ("sleep", 3), ("sleep", 4), ("sleep", 5), ("sleep", 6)],
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


def get_frame(data, pet, pose_key, index):
    action = pet["poses"][pose_key]
    frames = data["characters"][pet["character"]]["actions"][action]["frames"]
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


def draw_character(target, data, palette, pet, pose_key, frame_index, anchor_x, baseline_y, mirror=False):
    frame = get_frame(data, pet, pose_key, frame_index)
    min_x, _min_y, max_x, max_y = frame_metrics(frame, data["transparent"])
    source_anchor_x = (min_x + max_x) / 2
    foot_y = max_y
    draw = ImageDraw.Draw(target)
    for sy in range(frame["h"]):
        for sx in range(frame["w"]):
            value = frame["p"][sy * frame["w"] + sx]
            if value == data["transparent"]:
                continue
            source_x = frame["w"] - 1 - sx if mirror else sx
            dx = round(anchor_x + (source_x - source_anchor_x) * SCALE)
            dy = round(baseline_y + (sy - foot_y) * SCALE)
            draw.rectangle([dx, dy, dx + SCALE - 1, dy + SCALE - 1], fill=soften_color(palette[value]))


def render_frame(data, palette, pet, spec, frame_no):
    pose_key, index = spec["steps"][frame_no % len(spec["steps"])]
    dx, dy = spec.get("offsets", [(0, 0)] * spec["frames"])[frame_no % spec["frames"]]
    image = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    draw_character(image, data, palette, pet, pose_key, index, ANCHOR_X + dx, BASELINE_Y + dy, spec.get("mirror", False))
    return image


def make_atlas(data, palette, pet):
    atlas = Image.new("RGBA", (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))
    row_frames = {}
    for spec in ROWS_SPEC:
        frames = []
        for col in range(spec["frames"]):
            frame = render_frame(data, palette, pet, spec, col)
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
        draw.text((12, y + 34), spec["description"][:24], fill=(184, 196, 204, 255))
        for col, frame in enumerate(row_frames[spec["id"]]):
            x = label_w + col * CELL_W
            tile = Image.new("RGBA", (CELL_W, CELL_H), (238, 243, 245, 255))
            tile.alpha_composite(frame)
            sheet.alpha_composite(tile, (x, y))
            draw.rectangle([x, y, x + CELL_W - 1, y + CELL_H - 1], outline=(138, 151, 160, 255))
    return sheet


def used_bbox(image):
    return image.getchannel("A").getbbox()


def validate(atlas, row_frames):
    errors = []
    warnings = []
    if atlas.size != (1536, 1872):
        errors.append(f"atlas size is {atlas.size}, expected 1536x1872")
    for spec in ROWS_SPEC:
        baselines = []
        centers = []
        for col in range(COLS):
            cell = atlas.crop((col * CELL_W, spec["row"] * CELL_H, (col + 1) * CELL_W, (spec["row"] + 1) * CELL_H))
            bbox = used_bbox(cell)
            if col < spec["frames"] and bbox is None:
                errors.append(f"{spec['id']} col {col} is empty")
            if col >= spec["frames"] and bbox is not None:
                errors.append(f"{spec['id']} unused col {col} is not transparent")
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
        "ok": not errors,
        "errors": errors,
        "warnings": warnings,
        "atlas": {"width": atlas.width, "height": atlas.height, "cell_width": CELL_W, "cell_height": CELL_H},
        "rows": [{"state": s["id"], "row": s["row"], "frames": s["frames"], "loops": s["loops"]} for s in ROWS_SPEC],
    }


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def save_previews(data, palette, pet, row_frames, preview_dir):
    preview_dir.mkdir(parents=True, exist_ok=True)
    for spec in ROWS_SPEC:
        frames = [frame.copy() for frame in row_frames[spec["id"]]]
        frames[0].save(preview_dir / f"{spec['id']}.gif", save_all=True, append_images=frames[1:], duration=FRAME_MS, loop=0 if spec["loops"] else 1, disposal=2)
    for name, spec in EXTRA_PREVIEW_IDS.items():
        frames = [render_frame(data, palette, pet, spec, i) for i in range(spec["frames"])]
        frames[0].save(preview_dir / f"{name}.gif", save_all=True, append_images=frames[1:], duration=FRAME_MS, loop=0 if spec["loops"] else 1, disposal=2)


def build_pet(data, palette, pet_id, pet):
    pet_dir = OUT_DIR / pet_id
    final_dir = pet_dir / "final"
    qa_dir = pet_dir / "qa"
    package_dir = pet_dir / "package"
    final_dir.mkdir(parents=True, exist_ok=True)
    qa_dir.mkdir(parents=True, exist_ok=True)
    package_dir.mkdir(parents=True, exist_ok=True)

    atlas, row_frames = make_atlas(data, palette, pet)
    atlas_png = final_dir / "spritesheet.png"
    atlas_webp = final_dir / "spritesheet.webp"
    atlas.save(atlas_png)
    atlas.save(atlas_webp, lossless=True, quality=100, method=6)
    make_contact_sheet(row_frames).save(qa_dir / "contact-sheet.png")
    save_previews(data, palette, pet, row_frames, qa_dir / "previews")

    validation = validate(atlas, row_frames)
    write_json(final_dir / "validation.json", validation)
    write_json(
        qa_dir / "review.json",
        {
            "ok": validation["ok"],
            "method": "separate deterministic single-character atlas from prepared local action frames",
            "notes": [
                "This pet is separated from the other character to avoid mutual pose, scale, and baseline influence.",
                "Dance is represented in the standard Codex jumping row and as qa/previews/dance.gif.",
                "Sleeping is exported as a non-looping preview that holds the final frame; the standard 9-row atlas has no separate sleeping row.",
            ],
            "warnings": validation["warnings"],
        },
    )
    pet_json = {
        "id": pet_id,
        "displayName": pet["displayName"],
        "description": pet["description"],
        "spritesheetPath": "spritesheet.webp",
    }
    write_json(package_dir / "pet.json", pet_json)
    shutil.copy2(atlas_webp, package_dir / "spritesheet.webp")
    write_json(
        qa_dir / "run-summary.json",
        {
            "ok": validation["ok"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "spritesheet": str(atlas_webp),
            "validation": str(final_dir / "validation.json"),
            "contact_sheet": str(qa_dir / "contact-sheet.png"),
            "review": str(qa_dir / "review.json"),
            "package": str(package_dir),
        },
    )
    return validation


def main():
    data, palette = load_data()
    results = {}
    for pet_id, pet in PETS.items():
        results[pet_id] = build_pet(data, palette, pet_id, pet)
        print(f"{pet_id}: ok={results[pet_id]['ok']}")
    write_json(OUT_DIR / "run-summary.json", {"ok": all(item["ok"] for item in results.values()), "pets": results})
    print(f"output={OUT_DIR}")


if __name__ == "__main__":
    main()
