#!/usr/bin/env node
// 预生成 4 角色 × 10 高度档 × Down_1 帧的像素数据,写到 uniapp/static/rick-morty-portal/
// 板载完全不动,只产出 uniapp 端用的 character-pixels.js
//
// 用法: 项目根 → node uniapp/tools/build-rick-morty-portal-characters.js
//
// 数据来源: tools/rick-morty-asset-explorer/raw/{key}_Down_1.png (静态站立帧)
// 数据格式: { [characterKey]: { [height]: { width, height, pixels: [{x,y,r,g,b}, ...] } } }

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const RAW_DIR = path.join(PROJECT_ROOT, 'tools', 'rick-morty-asset-explorer', 'raw');
const OUT_DIR = path.join(__dirname, '..', 'static', 'rick-morty-portal');
const OUT_FILE = path.join(OUT_DIR, 'character-pixels.js');

const CHARACTERS = [
  { key: 'rick',       label: 'Rick (C-137)' },
  { key: 'morty',      label: 'Morty' },
  { key: 'weird_rick', label: 'Weird Rick' },
  { key: 'evil_morty', label: 'Evil Morty' },
];

// 10 个高度档(像素), 角色高度从 12 像素到 48 像素, 用户在 uniapp 端的滑块切换
const HEIGHT_LEVELS = [12, 16, 20, 24, 28, 32, 36, 40, 44, 48];

// 透明阈值: 原图 alpha < 此值的像素直接丢弃
const ALPHA_THRESHOLD = 32;

// 缩放算法: 最近邻 (像素艺术不能用 lanczos, 会糊)
function nearestNeighborResize(srcPng, targetH) {
  const srcW = srcPng.width;
  const srcH = srcPng.height;
  // 等比例缩放: 新高度 = targetH, 新宽度按原比例
  const targetW = Math.max(1, Math.round((srcW / srcH) * targetH));

  const result = [];
  for (let dy = 0; dy < targetH; dy++) {
    const sy = Math.min(srcH - 1, Math.floor(dy * srcH / targetH));
    for (let dx = 0; dx < targetW; dx++) {
      const sx = Math.min(srcW - 1, Math.floor(dx * srcW / targetW));
      const idx = (sy * srcW + sx) * 4;
      const r = srcPng.data[idx];
      const g = srcPng.data[idx + 1];
      const b = srcPng.data[idx + 2];
      const a = srcPng.data[idx + 3];
      if (a < ALPHA_THRESHOLD) continue;
      result.push({ x: dx, y: dy, r, g, b });
    }
  }
  return { width: targetW, height: targetH, pixels: result };
}

function loadPng(filePath) {
  const buffer = fs.readFileSync(filePath);
  return PNG.sync.read(buffer);
}

function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error('原始 PNG 目录不存在:', RAW_DIR);
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const out = {
    _meta: {
      source: 'tools/rick-morty-asset-explorer/raw/<key>_Down_1.png (Pocket Mortys IP)',
      generatedAt: new Date().toISOString(),
      heights: HEIGHT_LEVELS,
      note: '只用 Down_1 静态站立帧, 板载未接入。仅 uniapp 调试预览用。',
    },
    characters: {},
  };

  for (const ch of CHARACTERS) {
    const srcFile = path.join(RAW_DIR, `${ch.key}_Down_1.png`);
    if (!fs.existsSync(srcFile)) {
      console.error('  [skip]', ch.key, '缺少 PNG:', srcFile);
      continue;
    }
    const srcPng = loadPng(srcFile);
    const variants = {};
    for (const h of HEIGHT_LEVELS) {
      variants[h] = nearestNeighborResize(srcPng, h);
    }
    out.characters[ch.key] = {
      label: ch.label,
      sourceWidth: srcPng.width,
      sourceHeight: srcPng.height,
      variants,
    };
    console.log(
      `  [ok] ${ch.label.padEnd(20)} src=${srcPng.width}x${srcPng.height} ` +
      `→ ${HEIGHT_LEVELS.length} variants, smallest=${HEIGHT_LEVELS[0]}px ` +
      `(${variants[HEIGHT_LEVELS[0]].pixels.length}px) ` +
      `largest=${HEIGHT_LEVELS[HEIGHT_LEVELS.length - 1]}px ` +
      `(${variants[HEIGHT_LEVELS[HEIGHT_LEVELS.length - 1]].pixels.length}px)`
    );
  }

  // 写成 module.exports = {...},既能 require 也能给 webpack import
  const jsBody = `// 自动生成,勿手改。重新生成: node uniapp/tools/build-rick-morty-portal-characters.js
// 数据源: Pocket Mortys 官方手游 sprite (Adult Swim Games),仅 uniapp 调试预览用
module.exports = ${JSON.stringify(out)};
`;
  fs.writeFileSync(OUT_FILE, jsBody, 'utf8');
  const sizeKB = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(`\n写入 ${OUT_FILE} (${sizeKB} KB)`);
}

main();
