"""正确组装盔甲: 按 player 渲染流程 (皮肤 + body torso 位 + legs + head)"""
import os
from PIL import Image

ROOT = r"D:\project\Pokemon\terraria-clock-preview\terraria-glowxel-1456\_extract_1456"
OUT = r"D:\project\Glowxel\_armor_preview\sets"
os.makedirs(OUT, exist_ok=True)

FRAME_W = 40
FRAME_H = 56

# body sprite 是网格:
# 每行 40 高(实际 56 像素帧高), 网格位:
# row 0 = torso (身体正面)
# row 1 = back_arm (后臂)
# row 2 = back_shoulder
# row 3 = front_arm
# row 4 = front_shoulder
# body png 宽 = 40, 高 = 56 * 5 (或更多)
# torso 在 (0, 0*56, 40, 56)

# legs sprite: 整张就是一帧 40×56 (frame 0)
# head sprite: 整张很长 (40×N), 取 frame 0 = (0, 0, 40, 56)

# Player skin (player_0_X): 我们用灰色作为皮肤底

SETS = [
    ("01_Solar_Flare_战士终极", 171, 177, 112),
    ("02_Vortex_射手终极", 169, 175, 110),
    ("03_Nebula_法师终极", 170, 176, 111),
    ("04_Stardust_召唤终极", 189, 190, 130),
    ("05_Shadow_暗影", 14, 14, 14),
    ("06_Molten_熔岩", 17, 17, 17),
    ("07_Jungle_丛林", 12, 12, 12),
    ("08_Meteor_陨石", 13, 13, 13),
    ("09_Necro_死灵", 11, 11, 11),
    ("10_Bee_蜜蜂", 47, 27, 19),
    ("11_Adamantite_精金", 23, 23, 23),
    ("12_Titanium_钛金", 50, 50, 34),
    ("13_Frost_冰霜", 49, 35, 35),
    ("14_Forbidden_禁戒", 193, 194, 132),
    ("15_Hallowed_melee_神圣战", 46, 26, 18),
    ("16_Hallowed_ranged_神圣射", 44, 26, 18),
    ("17_Hallowed_magic_神圣法", 45, 26, 18),
    ("18_Chlorophyte_叶绿", 51, 36, 36),
    ("19_Turtle_海龟", 52, 37, 37),
    ("20_Beetle_甲虫", 157, 158, 99),
    ("21_Shroomite_蘑菇矿1", 160, 38, 38),
    ("22_Shroomite_蘑菇矿2", 161, 38, 38),
    ("23_Spectre_幽灵面具", 156, 155, 97),
    ("24_Spectre_幽灵兜帽", 148, 155, 97),
    ("25_Tiki_提基", 153, 154, 96),
    ("26_Spider_蜘蛛", 164, 165, 107),
    ("27_Spooky_万圣", 167, 168, 109),
    ("28_Obsidian_黑曜石", 192, 193, 131),
    ("29_Crystal_水晶刺客", 204, 206, 145),
    ("30_Ancient_Shadow_远古暗影", 40, 14, 14),
    ("31_Palladium_钯金", 47, 47, 33),
    ("32_Orichalcum_秘银", 48, 48, 48),
    ("33_Gladiator_角斗士", 28, 28, 28),
    ("34_Dark_Artist_暗黑画师", 215, 216, 148),
    ("35_Red_Riding_小红帽", 217, 218, 149),
    ("36_Valhalla_英灵殿", 219, 220, 150),
    ("37_Shinobi_忍者", 221, 222, 151),
    ("38_Squire_侍从", 178, 179, 113),
    ("39_Apprentice_学徒", 180, 181, 114),
    ("40_Huntress_女猎手", 182, 183, 115),
    ("41_Monk_武僧", 184, 185, 116),
]


def load_frame0(path):
    """加载 frame 0 (40×56) 从整张 sprite"""
    if not os.path.exists(path):
        return None
    im = Image.open(path).convert("RGBA")
    # frame 0 = 顶部 40×56
    return im.crop((0, 0, min(im.width, FRAME_W), min(im.height, FRAME_H)))


def load_body_torso(body_id):
    """body sprite 是网格, torso = row 0 = (0, 0, 40, 56)"""
    p = os.path.join(ROOT, f"Armor_Body_{body_id}.png")
    if not os.path.exists(p):
        return None
    im = Image.open(p).convert("RGBA")
    # torso 位在第 0 行 (0, 0, 40, 56)
    return im.crop((0, 0, min(im.width, FRAME_W), min(im.height, FRAME_H)))


for name, hid, bid, lid in SETS:
    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    # 1. legs (底层)
    legs = load_frame0(os.path.join(ROOT, f"Armor_Legs_{lid}.png"))
    if legs:
        canvas.paste(legs, (0, 0), legs)

    # 2. body torso (中层)
    body = load_body_torso(bid)
    if body:
        canvas.paste(body, (0, 0), body)

    # 3. head (顶层)
    head = load_frame0(os.path.join(ROOT, f"Armor_Head_{hid}.png"))
    if head:
        canvas.paste(head, (0, 0), head)

    # 放大 5x
    big = canvas.resize((FRAME_W*5, FRAME_H*5), Image.NEAREST)
    big.save(os.path.join(OUT, f"{name}.png"))

print(f"Done: {len(SETS)} sets → {OUT}")
