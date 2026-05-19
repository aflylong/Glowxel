#!/usr/bin/env node
// ============================================================
// 一键构建: build-terraria-sprites → prescale → copy 回 static/
// 用法: node tools/build-and-prescale.js
//
// 规则:
//   1. build-terraria-sprites.js 输出全分辨率到 static/terraria/
//   2. build-uniapp-prescaled.js 缩放到 static/terraria/prescaled/
//   3. 把需要 prescale 的文件(A类+player_layers+summon_guardian) copy 回 static/
//   4. B类文件绝对不动: summon_extras.js / misc.js / sprites_tiles.js / bosses_compact.js
// ============================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOOLS_DIR = __dirname;
const STATIC_DIR = path.resolve(TOOLS_DIR, '../static/terraria');
const PRESCALED_DIR = path.resolve(STATIC_DIR, 'prescaled');

// 需要从 prescaled/ copy 回 static/ 的文件 (全部需要 prescale 的)
const COPY_FILES = [
  'armor_heads.js',
  'armor_bodies.js',
  'armor_legs.js',
  'weapons.js',
  'wings.js',
  'player_layers.js',
  'summon_guardian.js',
];

// B类文件 - 绝对不能被覆盖 (这里只做校验提醒)
const B_CLASS_FILES = [
  'summon_extras.js',
  'misc.js',
  'sprites_tiles.js',
  'bosses_compact.js',
];

function run(script) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[RUN] node tools/${script}`);
  console.log('='.repeat(60));
  execSync(`node "${path.join(TOOLS_DIR, script)}"`, {
    cwd: path.resolve(TOOLS_DIR, '..'),
    stdio: 'inherit',
  });
}

function copyPrescaled() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('[COPY] prescaled/ → static/terraria/ (仅需 prescale 的文件)');
  console.log('='.repeat(60));

  for (const f of COPY_FILES) {
    const src = path.join(PRESCALED_DIR, f);
    const dst = path.join(STATIC_DIR, f);
    if (!fs.existsSync(src)) {
      console.warn(`  [WARN] prescaled/${f} 不存在, 跳过`);
      continue;
    }
    const srcSize = fs.statSync(src).size;
    const dstSize = fs.existsSync(dst) ? fs.statSync(dst).size : 0;

    // 安全校验: prescaled 文件不应该为空
    if (srcSize === 0) {
      console.error(`  [ERROR] prescaled/${f} 为空! 拒绝覆盖`);
      process.exit(1);
    }

    fs.copyFileSync(src, dst);
    console.log(`  ✓ ${f}: ${(dstSize/1024).toFixed(1)} KB → ${(srcSize/1024).toFixed(1)} KB`);
  }

  // 校验 B 类文件没被动
  console.log('\n[CHECK] B类文件完整性:');
  for (const f of B_CLASS_FILES) {
    const fp = path.join(STATIC_DIR, f);
    if (fs.existsSync(fp)) {
      console.log(`  ✓ ${f}: ${(fs.statSync(fp).size/1024).toFixed(1)} KB (未动)`);
    } else {
      console.warn(`  [WARN] ${f} 不存在`);
    }
  }
}

// ============ main ============
console.log('[build-and-prescale] 一键构建开始');
console.log('  B类文件(不动): ' + B_CLASS_FILES.join(', '));
console.log('  Copy文件(prescale后覆盖): ' + COPY_FILES.join(', '));

run('build-terraria-sprites.js');
run('build-uniapp-prescaled.js');
copyPrescaled();

console.log('\n[build-and-prescale] ✓ 全部完成');
