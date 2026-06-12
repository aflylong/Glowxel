import json
from datetime import datetime, timezone
from math import ceil
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "website" / "public" / "spongebob" / "character-frame-pixels.json"
OUT_DIR = Path(__file__).resolve().parent / "extended"

CELL_W = 192
CELL_H = 208
FRAME_MS = 180
SCALE = 2
ANCHOR_X = 96
BASELINE_Y = 160
OUTLINE = (23, 48, 71, 255)
PREVIEW_BG = (238, 243, 245, 255)
SHEET_BG = (32, 38, 44, 255)

PETS = {
    "spongebob-pixel": {
        "displayName": "SpongeBob Pixel",
        "character": "spongebob",
        "skip": ["jump"],
    },
    "patrick-pixel": {
        "displayName": "Patrick Pixel",
        "character": "patrick",
        "skip": ["dance5", "jump"],
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


def soften_color(color):
    r, g, b, _ = color
    if r < 28 and g < 28 and b < 28:
        return OUTLINE
    if g > 200 and r < 60 and b < 80:
        return (74, 201, 122, 255)
    return color


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


def render_action_frame(data, palette, frame):
    min_x, _min_y, max_x, max_y = frame_metrics(frame, data["transparent"])
    source_anchor_x = (min_x + max_x) / 2
    foot_y = max_y
    image = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    for sy in range(frame["h"]):
        for sx in range(frame["w"]):
            value = frame["p"][sy * frame["w"] + sx]
            if value == data["transparent"]:
                continue
            dx = round(ANCHOR_X + (sx - source_anchor_x) * SCALE)
            dy = round(BASELINE_Y + (sy - foot_y) * SCALE)
            draw.rectangle([dx, dy, dx + SCALE - 1, dy + SCALE - 1], fill=soften_color(palette[value]))
    return image


def save_animation(frames, path, loops):
    frames[0].save(
        path,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_MS,
        loop=0 if loops else 1,
        lossless=True,
        quality=100,
        method=6,
    )


def save_gif(frames, path, loops):
    frames[0].save(
        path,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_MS,
        loop=0 if loops else 1,
        disposal=2,
    )


def action_loops(action):
    non_looping = {"fail", "miss", "sleeping", "scared", "buttstomp", "jump", "attack"}
    return action not in non_looping


def action_frames(data, palette, character, action):
    source_frames = data["characters"][character]["actions"][action]["frames"]
    return [render_action_frame(data, palette, frame) for frame in source_frames]


def bbox(image):
    return image.getchannel("A").getbbox()


def validate_action(action, frames):
    errors = []
    warnings = []
    if not frames:
        errors.append(f"{action} has no frames")
        return errors, warnings
    centers = []
    baselines = []
    for index, frame in enumerate(frames):
        box = bbox(frame)
        if box is None:
            errors.append(f"{action} frame {index} is empty")
            continue
        centers.append((box[0] + box[2]) / 2)
        baselines.append(box[3])
    if baselines and max(baselines) - min(baselines) > 22:
        warnings.append(f"{action} baseline variation {max(baselines) - min(baselines)} px")
    if centers and max(centers) - min(centers) > 24:
        warnings.append(f"{action} center variation {max(centers) - min(centers):.1f} px")
    return errors, warnings


def make_contact_sheet(actions):
    label_w = 150
    rows = []
    for action in actions:
        rows.append((action["id"], action["frames"]))
    width = label_w + CELL_W * max(len(item[1]) for item in rows)
    height = CELL_H * len(rows)
    sheet = Image.new("RGBA", (width, height), SHEET_BG)
    draw = ImageDraw.Draw(sheet)
    for row_index, (action, frames) in enumerate(rows):
        y = row_index * CELL_H
        draw.text((12, y + 12), action, fill=(235, 240, 245, 255))
        draw.text((12, y + 34), f"{len(frames)} frames", fill=(184, 196, 204, 255))
        for col, frame in enumerate(frames):
            x = label_w + col * CELL_W
            tile = Image.new("RGBA", (CELL_W, CELL_H), PREVIEW_BG)
            tile.alpha_composite(frame)
            sheet.alpha_composite(tile, (x, y))
            draw.rectangle([x, y, x + CELL_W - 1, y + CELL_H - 1], outline=(138, 151, 160, 255))
    return sheet


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_pet(data, palette, pet_id, pet):
    character = pet["character"]
    actions_dir = OUT_DIR / pet_id / "animations"
    previews_dir = OUT_DIR / pet_id / "previews"
    qa_dir = OUT_DIR / pet_id / "qa"
    actions_dir.mkdir(parents=True, exist_ok=True)
    previews_dir.mkdir(parents=True, exist_ok=True)
    qa_dir.mkdir(parents=True, exist_ok=True)

    actions = []
    errors = []
    warnings = []
    for action in sorted(data["characters"][character]["actions"]):
        if action in pet["skip"]:
            continue
        frames = action_frames(data, palette, character, action)
        loops = action_loops(action)
        save_animation(frames, actions_dir / f"{action}.webp", loops)
        preview_frames = []
        for frame in frames:
            preview = Image.new("RGBA", (CELL_W, CELL_H), PREVIEW_BG)
            preview.alpha_composite(frame)
            preview_frames.append(preview)
        save_gif(preview_frames, previews_dir / f"{action}.gif", loops)
        action_errors, action_warnings = validate_action(action, frames)
        errors.extend(action_errors)
        warnings.extend(action_warnings)
        actions.append(
            {
                "id": action,
                "frames": frames,
                "frameCount": len(frames),
                "loops": loops,
                "webp": str(actions_dir / f"{action}.webp"),
                "gif": str(previews_dir / f"{action}.gif"),
            }
        )

    make_contact_sheet(actions).save(qa_dir / "extended-contact-sheet.png")
    actions_for_json = []
    for action in actions:
        actions_for_json.append(
            {
                "id": action["id"],
                "frameCount": action["frameCount"],
                "loops": action["loops"],
                "webp": action["webp"],
                "gif": action["gif"],
            }
        )
    validation = {
        "ok": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "skipped": pet["skip"],
        "actions": actions_for_json,
    }
    write_json(qa_dir / "extended-validation.json", validation)
    write_json(
        OUT_DIR / pet_id / "extended-actions.json",
        {
            "id": pet_id,
            "displayName": pet["displayName"],
            "cellWidth": CELL_W,
            "cellHeight": CELL_H,
            "frameMs": FRAME_MS,
            "actions": actions_for_json,
        },
    )
    return validation


def main():
    data, palette = load_data()
    summary = {
        "ok": True,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "pets": {},
    }
    for pet_id, pet in PETS.items():
        validation = build_pet(data, palette, pet_id, pet)
        summary["pets"][pet_id] = {
            "ok": validation["ok"],
            "actionCount": len(validation["actions"]),
            "warnings": validation["warnings"],
            "skipped": validation["skipped"],
        }
        summary["ok"] = summary["ok"] and validation["ok"]
        print(f"{pet_id}: ok={validation['ok']} actions={len(validation['actions'])}")
    write_json(OUT_DIR / "extended-run-summary.json", summary)
    print(f"output={OUT_DIR}")


if __name__ == "__main__":
    main()
