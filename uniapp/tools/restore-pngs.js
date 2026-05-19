#!/usr/bin/env node
// 把今天扩展用到的 PNG 从 Pokemon 实验区复制到 esp32-firmware/terraria/_png/
// 只复制 build-terraria-sprites.js 实际需要的 ID, 不做其他动作
//
// 复制完后跑: node tools/build-terraria-sprites.js

const fs = require('fs');
const path = require('path');

const SRC = 'D:/project/Pokemon/terraria-clock-preview/terraria-glowxel-1456/_extract_1456';
const SRC_BODY = path.join(SRC, 'Armor');
const DST = path.resolve(__dirname, '../../esp32-firmware/terraria/_png');

if (!fs.existsSync(DST)) fs.mkdirSync(DST, { recursive: true });

const ARMOR_HEADS  = [169, 170, 171, 189, 157, 101, 156, 134, 46, 41, 78];
const ARMOR_BODIES = [175, 176, 177, 190, 105, 66, 95, 27, 24, 51];
const ARMOR_LEGS   = [110, 111, 112, 130, 98, 55, 79, 26, 23, 47];
const WINGS        = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 29, 30, 31, 32, 34, 35, 36, 37, 38, 39, 42, 43, 46, 48, 49, 50, 51];
const WEAPONS      = [3065, 3475, 3531, 3540, 3541, 3542, 4956, 5005, 757, 1258, 1569, 1571, 3018, 3827, 4923, 4952];
const PLAYER_LAYERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15];
const MISC         = ['biome_forest_0', 'biome_forest_1', 'biome_forest_2', 'dust_242_f0', 'extra_171'];

let copied = 0, skipped = 0, missing = [];

function tryCopy(srcName, dstName, srcDir = SRC) {
  const sp = path.join(srcDir, srcName + '.png');
  const dp = path.join(DST, dstName + '.png');
  if (!fs.existsSync(sp)) {
    missing.push(srcName);
    return false;
  }
  if (fs.existsSync(dp)) {
    skipped++;
    return true;
  }
  fs.copyFileSync(sp, dp);
  copied++;
  return true;
}

console.log('[restore PNGs]');
console.log('  src:', SRC);
console.log('  dst:', DST);

console.log('\n[1] Armor_Head_*');
for (const id of ARMOR_HEADS) tryCopy('Armor_Head_' + id, 'Armor_Head_' + id);

console.log('[2] Armor_Body_* (from Armor/ subdir)');
for (const id of ARMOR_BODIES) tryCopy('Armor_' + id, 'Armor_Body_' + id, SRC_BODY);

console.log('[3] Armor_Legs_*');
for (const id of ARMOR_LEGS) tryCopy('Armor_Legs_' + id, 'Armor_Legs_' + id);

console.log('[4] Wings_*');
for (const id of WINGS) tryCopy('Wings_' + id, 'Wings_' + id);

console.log('[5] Item_*');
for (const id of WEAPONS) tryCopy('Item_' + id, 'Item_' + id);

console.log('[6] Player_0_*');
for (const layer of PLAYER_LAYERS) tryCopy('Player_0_' + layer, 'Player_0_' + layer);

console.log('[7] Projectile_623 (guardian)');
tryCopy('Projectile_623', 'Projectile_623');

console.log('[8] Misc (biome forest / dust / extra_171)');
// biome_forest_* / dust_242_f0 / extra_171 — 这几个不在反编译资产里, 是手动制作的
// 检查 esp32-firmware/terraria/ 下是不是已有 PNG, 不强制复制
for (const n of MISC) {
  const dp = path.join(DST, n + '.png');
  if (fs.existsSync(dp)) {
    skipped++;
    continue;
  }
  console.log('  [warn] ' + n + '.png 缺失, build 脚本会跳过 (misc.js 已有数据保护)');
}

console.log(`\n[done] 复制 ${copied} 个 PNG, 跳过已存在 ${skipped} 个, 缺失 ${missing.length} 个`);
if (missing.length > 0) {
  console.log('缺失:', missing.join(', '));
}
