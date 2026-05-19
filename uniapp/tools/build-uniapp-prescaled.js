#!/usr/bin/env node
// ============================================================
// uniapp 预缩放资产生成
// 输入: static/terraria/*.js (原始数据 — 不要被覆盖!)
// 输出: static/terraria/prescaled/*.js
// 关键: 网格层每段独立缩放, 保持网格分界清晰
// ============================================================

const fs = require('fs');
const path = require('path');

const STATIC_DIR = path.resolve(__dirname, '../static/terraria');
const OUT_DIR = path.resolve(__dirname, '../static/terraria/prescaled');
const SCALE = 0.27;

// 哪些是网格层 (要按段独立缩放)
const ARMOR_BODY_GRID_SEGS = 6;       // armor_body 6段
const PLAYER_LAYER_GRID_SEGS = 5;     // player_0_X 网格层 5段
const PLAYER_GRID_LAYERS = [3, 4, 5, 6, 7, 8, 9, 13];

const SRC_SEG_H = 56;  // 原始每段高度
const DST_SEG_H = Math.round(SRC_SEG_H * SCALE);  // 15

function b64decode(b64) { return Buffer.from(b64, 'base64'); }

function decodeSpritePixels(sprite) {
  if (!sprite || !sprite.b) return [];
  const buf = b64decode(sprite.b);
  const fmt = sprite.fmt || 5;
  const stride = fmt === 7 ? 7 : 5;
  const pixels = [];
  for (let i = 0; i + stride - 1 < buf.length; i += stride) {
    if (fmt === 7) pixels.push({x:buf[i]|(buf[i+1]<<8), y:buf[i+2]|(buf[i+3]<<8), r:buf[i+4], g:buf[i+5], b:buf[i+6]});
    else pixels.push({x:buf[i], y:buf[i+1], r:buf[i+2], g:buf[i+3], b:buf[i+4]});
  }
  return pixels;
}

// 把一组像素映射到网格大小并缩放
function scaleRegion(pixels, srcW, srcH) {
  const srcBuf = new Uint8Array(srcW * srcH * 4);
  for (const p of pixels) {
    if (p.x >= 0 && p.x < srcW && p.y >= 0 && p.y < srcH) {
      const idx = (p.y * srcW + p.x) * 4;
      srcBuf[idx]=p.r; srcBuf[idx+1]=p.g; srcBuf[idx+2]=p.b; srcBuf[idx+3]=255;
    }
  }
  const dstW = Math.max(1, Math.round(srcW * SCALE));
  const dstH = Math.max(1, Math.round(srcH * SCALE));
  const result = [];
  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx = Math.min(srcW-1, Math.round(dx/SCALE));
      const sy = Math.min(srcH-1, Math.round(dy/SCALE));
      const idx = (sy*srcW+sx)*4;
      if (srcBuf[idx+3]>0) result.push({x:dx,y:dy,r:srcBuf[idx],g:srcBuf[idx+1],b:srcBuf[idx+2]});
    }
  }
  return { pixels: result, w: dstW, h: dstH };
}

// 网格 sprite 按段独立缩放, 重新拼接
function scaleGridSprite(allPixels, srcW, srcH, numSegs) {
  // 拆分各段
  const segPixels = [];
  for (let seg = 0; seg < numSegs; seg++) {
    const segPx = allPixels
      .filter(p => p.y >= seg * SRC_SEG_H && p.y < (seg + 1) * SRC_SEG_H)
      .map(p => ({ x: p.x, y: p.y - seg * SRC_SEG_H, r: p.r, g: p.g, b: p.b }));
    segPixels.push(segPx);
  }
  
  // 每段独立缩放
  const finalPixels = [];
  let dstW = 1;
  for (let seg = 0; seg < numSegs; seg++) {
    const { pixels: scaled, w } = scaleRegion(segPixels[seg], srcW, SRC_SEG_H);
    if (w > dstW) dstW = w;
    for (const p of scaled) {
      finalPixels.push({
        x: p.x,
        y: seg * DST_SEG_H + p.y,
        r: p.r, g: p.g, b: p.b,
      });
    }
  }
  return { pixels: finalPixels, w: dstW, h: DST_SEG_H * numSegs };
}

function packPixels(pixels) {
  const buf = Buffer.alloc(pixels.length * 5);
  for (let i = 0; i < pixels.length; i++) {
    buf[i*5]=pixels[i].x; buf[i*5+1]=pixels[i].y;
    buf[i*5+2]=pixels[i].r; buf[i*5+3]=pixels[i].g; buf[i*5+4]=pixels[i].b;
  }
  return { n: pixels.length, b: buf.toString('base64') };
}

function packClearPixels(pixels) {
  const buf = Buffer.alloc(pixels.length * 2);
  for (let i = 0; i < pixels.length; i++) {
    buf[i*2]=pixels[i].x; buf[i*2+1]=pixels[i].y;
  }
  return { n: pixels.length, b: buf.toString('base64') };
}

function decodeAnimFrame(anim, frameIdx) {
  const buf = b64decode(anim.base.b);
  const fmt = anim.fmt || 5;
  const stride = fmt === 7 ? 7 : 5;
  const map = new Map();
  for (let i = 0; i+stride-1 < buf.length; i += stride) {
    let x,y,r,g,b;
    if(fmt===7){x=buf[i]|(buf[i+1]<<8);y=buf[i+2]|(buf[i+3]<<8);r=buf[i+4];g=buf[i+5];b=buf[i+6];}
    else{x=buf[i];y=buf[i+1];r=buf[i+2];g=buf[i+3];b=buf[i+4];}
    map.set(x+','+y,{x,y,r,g,b});
  }
  if (frameIdx > 0 && anim.deltas && frameIdx-1 < anim.deltas.length) {
    const db = b64decode(anim.deltas[frameIdx-1].b);
    for (let i = 0; i+stride-1 < db.length; i += stride) {
      let x,y,r,g,b;
      if(fmt===7){x=db[i]|(db[i+1]<<8);y=db[i+2]|(db[i+3]<<8);r=db[i+4];g=db[i+5];b=db[i+6];}
      else{x=db[i];y=db[i+1];r=db[i+2];g=db[i+3];b=db[i+4];}
      map.set(x+','+y,{x,y,r,g,b});
    }
  }
  return Array.from(map.values());
}

function computeDelta(base, frame) {
  const bm = new Map();
  for (const p of base) bm.set(p.x+','+p.y, (p.r<<16)|(p.g<<8)|p.b);
  const set = [];
  const seen = new Set();
  for (const p of frame) {
    const k = p.x+','+p.y;
    seen.add(k);
    if (bm.get(k) !== ((p.r<<16)|(p.g<<8)|p.b)) set.push(p);
  }
  // clear 段: base 有但 frame 没有 (移动后旧位置擦回背景)
  const clear = [];
  for (const p of base) {
    if (!seen.has(p.x+','+p.y)) clear.push({x:p.x, y:p.y});
  }
  return { set, clear };
}

function processArmorBodies() {
  const data = require(path.join(STATIC_DIR, 'armor_bodies.js'));
  const result = {};
  for (const [key, sprite] of Object.entries(data)) {
    if (key.startsWith('_')) { result[key] = sprite; continue; }
    if (!sprite || !sprite.b) continue;
    const raw = decodeSpritePixels(sprite);
    // armor_body 是 40×336 (6 段 × 56), 按段独立缩放
    const { pixels, w, h } = scaleGridSprite(raw, sprite.w, sprite.h, ARMOR_BODY_GRID_SEGS);
    result[key] = { w, h, fmt: 5, ...packPixels(pixels) };
  }
  return result;
}

function processPlayerLayers() {
  const data = require(path.join(STATIC_DIR, 'player_layers.js'));
  const result = {};
  for (const [key, sprite] of Object.entries(data)) {
    if (key.startsWith('_')) { result[key] = sprite; continue; }
    if (!sprite) continue;
    
    // 网格层(3,4,5,6,7,8,9,13) 用按段缩放, 其他直接缩放
    const layerNum = parseInt(key.split('_').pop());
    const isGridLayer = PLAYER_GRID_LAYERS.includes(layerNum);
    
    // 数据可能是 {w,h,fmt,n,b} 或 {w,h,pixels:[...]}
    let raw;
    if (sprite.b) raw = decodeSpritePixels(sprite);
    else if (Array.isArray(sprite.pixels)) raw = sprite.pixels.map(p => ({x:p[0], y:p[1], r:p[2], g:p[3], b:p[4]}));
    else continue;
    
    if (isGridLayer && sprite.h >= SRC_SEG_H * 2) {
      // 网格层
      const numSegs = Math.round(sprite.h / SRC_SEG_H);
      const { pixels, w, h } = scaleGridSprite(raw, sprite.w, sprite.h, numSegs);
      result[key] = { w, h, fmt: 5, ...packPixels(pixels) };
    } else {
      // 整张缩放
      const { pixels, w, h } = scaleRegion(raw, sprite.w, sprite.h);
      result[key] = { w, h, fmt: 5, ...packPixels(pixels) };
    }
  }
  return result;
}

function processStaticSprites(srcFile) {
  const data = require(path.join(STATIC_DIR, srcFile));
  const result = {};
  for (const [key, sprite] of Object.entries(data)) {
    if (key.startsWith('_')) { result[key] = sprite; continue; }
    if (!sprite || !sprite.b) continue;
    const raw = decodeSpritePixels(sprite);
    const { pixels, w, h } = scaleRegion(raw, sprite.w, sprite.h);
    result[key] = { w, h, fmt: 5, ...packPixels(pixels) };
  }
  return result;
}

function processAnimSprites(srcFile) {
  const data = require(path.join(STATIC_DIR, srcFile));
  const result = {};
  for (const [key, anim] of Object.entries(data)) {
    if (key.startsWith('_')) { result[key] = anim; continue; }
    if (!anim || !anim.base) continue;
    const fc = anim.frameCount || 1;
    const scaledFrames = [];
    let dstW = 1, dstH = 1;
    for (let f = 0; f < fc; f++) {
      const raw = decodeAnimFrame(anim, f);
      const { pixels, w, h } = scaleRegion(raw, anim.w, anim.h);
      scaledFrames.push(pixels);
      dstW = w; dstH = h;
    }
    if (scaledFrames[0].length === 0) continue;
    const base = packPixels(scaledFrames[0]);
    const deltas = [];
    for (let f = 1; f < fc; f++) {
      const { set, clear } = computeDelta(scaledFrames[0], scaledFrames[f]);
      const setPacked = packPixels(set);
      const clearPacked = packClearPixels(clear);
      deltas.push({
        n: setPacked.n, b: setPacked.b,
        cN: clearPacked.n, cB: clearPacked.b,
      });
    }
    result[key] = { w: dstW, h: dstH, frameCount: fc, fmt: 5, base, deltas };
    if (anim.frameStart != null) result[key].frameStart = anim.frameStart;
  }
  return result;
}

function writeBundle(name, data) {
  const fp = path.join(OUT_DIR, name);
  fs.writeFileSync(fp, `module.exports = ${JSON.stringify(data)};\n`);
  return fs.statSync(fp).size;
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('[uniapp-prescale v2] scale='+SCALE*100+'%, 网格层按段独立缩放');
  let total = 0;

  // 网格层 - 按段独立缩放
  const ab = processArmorBodies();
  // 保留原始的 _gridIndex 元字段
  const origAB = require(path.join(STATIC_DIR, 'armor_bodies.js'));
  if (origAB._gridIndex) ab._gridIndex = origAB._gridIndex;
  total += writeBundle('armor_bodies.js', ab);
  console.log('  armor_bodies.js: '+(fs.statSync(path.join(OUT_DIR, 'armor_bodies.js')).size/1024).toFixed(1)+' KB');
  
  const pl = processPlayerLayers();
  const origPL = require(path.join(STATIC_DIR, 'player_layers.js'));
  if (origPL._gridIndex) pl._gridIndex = origPL._gridIndex;
  if (origPL._gridLayers) pl._gridLayers = origPL._gridLayers;
  total += writeBundle('player_layers.js', pl);
  console.log('  player_layers.js: '+(fs.statSync(path.join(OUT_DIR, 'player_layers.js')).size/1024).toFixed(1)+' KB');

  // 单帧整张缩放
  for (const f of ['armor_heads.js','armor_legs.js','weapons.js']) {
    total += writeBundle(f, processStaticSprites(f));
    console.log('  '+f+': '+(fs.statSync(path.join(OUT_DIR, f)).size/1024).toFixed(1)+' KB');
  }

  // 动画
  for (const f of ['wings.js','summon_guardian.js']) {
    total += writeBundle(f, processAnimSprites(f));
    console.log('  '+f+': '+(fs.statSync(path.join(OUT_DIR, f)).size/1024).toFixed(1)+' KB');
  }

  console.log('\n[done] Total: '+(total/1024).toFixed(1)+' KB');
}

main();
