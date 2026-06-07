/**
 * 冒险岛 1 代主题渲染器
 * 输入: state + animTimeSec → 输出: Map<"x,y", "#hex">
 * 
 * 64×64 像素屏，无角色死亡，循环展示。
 * 角色固定在屏幕左侧 X 位置，背景滚动。
 */

import { SPRITES } from './adventureIslandSprites.js';

const SCREEN_W = 64;
const SCREEN_H = 64;
const GROUND_Y = 48;     // 地面顶部 Y
const CHAR_X = 12;       // 角色固定 X
const CHAR_HIT_W = 16;   // 角色碰撞宽度

// NES 真实调色板
const SKY = '#001E74';
const GRASS_LIGHT = '#7CD420';
const GRASS_MID = '#38CC6C';
const GRASS_DARK = '#087C00';
const DIRT_LIGHT = '#D48820';
const DIRT_DARK = '#783C00';
const CLOUD = '#ECEEEC';

// =============================================================
// 工具函数
// =============================================================

function setPx(pixels, x, y, hex) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;
  pixels.set(`${x},${y}`, hex);
}

function drawSprite(pixels, spriteKey, dx, dy, flip = false, scale = 1) {
  const spr = SPRITES[spriteKey];
  if (!spr) return;
  const { w, h, p } = spr;
  if (scale === 1) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = p[y * w + x];
        if (!px) continue;
        const tx = dx + (flip ? (w - 1 - x) : x);
        const ty = dy + y;
        setPx(pixels, tx, ty, px);
      }
    }
    return;
  }
  // 缩放: 用最近邻采样
  const dw = Math.max(1, Math.round(w * scale));
  const dh = Math.max(1, Math.round(h * scale));
  for (let dyy = 0; dyy < dh; dyy++) {
    const sy = Math.min(h - 1, Math.floor(dyy / scale));
    for (let dxx = 0; dxx < dw; dxx++) {
      const sx = Math.min(w - 1, Math.floor(dxx / scale));
      const px = p[sy * w + (flip ? (w - 1 - sx) : sx)];
      if (!px) continue;
      setPx(pixels, dx + dxx, dy + dyy, px);
    }
  }
}

// =============================================================
// 背景: 用 bg.tile 真实像素背景横向循环平铺
// =============================================================

function drawBackground(pixels, scrollX, bgYOffset = 0) {
  const tile = SPRITES['bg.tile'];
  if (!tile) return;
  const { w: tw, h: th, p: tp } = tile;

  // 背景 48x82, 屏幕 64x64
  // bgYOffset 控制背景在屏幕中的 Y 位置
  // 默认 srcYOffset = th - SCREEN_H = 18, 即底部对齐
  const srcYOffset = (th - SCREEN_H) + bgYOffset;

  const sx = Math.floor(scrollX);
  for (let dy = 0; dy < SCREEN_H; dy++) {
    const sy = srcYOffset + dy;
    if (sy < 0 || sy >= th) continue;
    for (let dx = 0; dx < SCREEN_W; dx++) {
      const tx = ((dx + sx) % tw + tw) % tw;
      const px = tp[sy * tw + tx];
      if (px) setPx(pixels, dx, dy, px);
    }
  }
}

// =============================================================
// 角色 sprite key 选择
// =============================================================

function getCharSpriteKey(state, frame) {
  // 磕到优先级最高 (滑板撞石头后的弹起+下落动画)
  if (state.stumbleT > 0) return 'higgins.stumble';
  
  // 投掷: 只显示 frame3 这一帧 (滑板状态下不切换sprite, 仍画滑板)
  if (state.throwT > 0 && state.type !== 'skateboard') {
    return 'higgins.throw.3';
  }
  
  // 滑板
  if (state.type === 'skateboard') {
    if (state.jumping) {
      // 滑板跳跃全程用 skateboard_land.0
      return 'higgins.skateboard_land.0';
    }
    if (state.landing > 0) return 'higgins.skateboard_land.0';
    return `higgins.skateboard.${Math.floor(frame / 8) % 2}`;
  }
  
  // 普通跑步状态下跳跃: 用 throw.2 (脸朝前)
  if (state.jumping) return 'higgins.throw.2';
  
  // 跑步循环
  return `higgins.run.${Math.floor(frame / 6) % 3}`;
}

// =============================================================
// 主渲染
// =============================================================

/**
 * @param {object} sceneState - 完整场景状态
 *   {
 *     frame: number,
 *     scrollX: number,
 *     character: { type, jumping, jumpY, jumpV, throwT, landing, fairyT },
 *     entities: [{ type, sub, x, f, ... }],
 *     axes: [{ x, f }]
 *   }
 */
export function renderAdventureIslandScene(sceneState, layoutOpts = {}) {
  const pixels = new Map();
  const { frame, scrollX, character: ch, entities, axes } = sceneState;
  const {
    bgYOffset = 0,
    charX = CHAR_X,
    groundY = GROUND_Y,
    obstacleScale = 1,
    enemyScale = 1,
    itemScale = 1,
    fruitScale = 1,
  } = layoutOpts;
  
  // 1. 背景
  drawBackground(pixels, scrollX, bgYOffset);
  
  // 2. 实体（敌人/障碍/蛋/水果）
  for (const e of entities) {
    drawEntity(pixels, e, groundY, {
      obstacleScale, enemyScale, itemScale, fruitScale,
      crowYOffset: layoutOpts.crowYOffset,
      fruitAirY: layoutOpts.fruitAirY,
    });
  }
  
  // 3. 飞行斧头
  for (const a of axes) {
    const animSpeed = layoutOpts.axeAnimSpeed || 3;
    // 帧顺序: 1 → 2 → 3 → 0 → 循环
    const seq = [1, 2, 3, 0];
    const key = `item.axe.${seq[Math.floor(a.f / animSpeed) % 4]}`;
    // 飞行斧头跟蛋里掉出来的斧头同样大小 (用 itemScale)
    const axeScale = layoutOpts.itemScale || 1;
    const spr = SPRITES[key];
    if (spr) {
      const drawH = Math.round(spr.h * axeScale);
      drawSprite(pixels, key, Math.floor(a.x), groundY - 24 - (a.y || 0) + (16 - drawH), false, axeScale);
    }
  }
  
  // 4. 角色
  const charKey = getCharSpriteKey(ch, frame);
  const charSpr = SPRITES[charKey];
  if (charSpr) {
    const cy = groundY - charSpr.h - ch.jumpY;
    drawSprite(pixels, charKey, charX, cy);
  }
  
  // 5. 仙女跟随
  if (ch.fairyT > 0) {
    const fy = Math.sin(frame * 0.15) * 3;
    const fairyOffsetY = layoutOpts.fairyOffsetY != null ? layoutOpts.fairyOffsetY : 36;
    const fairyOffsetX = layoutOpts.fairyOffsetX != null ? layoutOpts.fairyOffsetX : -14;
    drawSprite(pixels, 'item.fairy', charX + fairyOffsetX, groundY - fairyOffsetY + Math.round(fy));
  }
  
  // 6. HUD 时钟 (灯笼 + 数字)
  if (layoutOpts.showClock !== false) {
    drawClock(pixels, layoutOpts);
  }
  
  return pixels;
}

// =============================================================
// HUD 时钟: HH:MM, 每位 = 灯笼底 (16x16) + 数字 (8x8) 居中叠加
// =============================================================

function drawClock(pixels, opts) {
  const {
    clockX = 0,
    clockY = 0,
    clockSpacing = 1,   // 数字之间间隔
    clockColonGap = 2,  // HH 和 MM 之间额外间隔(画冒号)
    clockColon = true,  // 是否画冒号
    clockHour = null,
    clockMinute = null,
  } = opts;
  
  let h, m;
  if (clockHour !== null && clockMinute !== null) {
    h = clockHour; m = clockMinute;
  } else {
    const d = new Date();
    h = d.getHours(); m = d.getMinutes();
  }
  
  const digits = [
    Math.floor(h / 10), h % 10,
    Math.floor(m / 10), m % 10,
  ];
  
  let x = clockX;
  for (let i = 0; i < 4; i++) {
    drawSprite(pixels, `hud.digit.${digits[i]}`, x, clockY);
    x += 8 + clockSpacing;
    if (i === 1) {
      // HH 完了, 留间隔, 可选画冒号
      if (clockColon && clockColonGap >= 2) {
        const colonX = x + Math.floor((clockColonGap - 2) / 2);
        const colonY = clockY + 2;
        setPx(pixels, colonX, colonY, '#ffffff');
        setPx(pixels, colonX, colonY + 1, '#a40000');
        setPx(pixels, colonX, colonY + 4, '#ffffff');
        setPx(pixels, colonX, colonY + 5, '#a40000');
      }
      x += clockColonGap;
    }
  }
}

function drawEntity(pixels, e, groundY, scales = {}) {
  let key = null;
  let yOff = 0;
  let scale = 1;
  const af = Math.floor(e.f / 6) % 2;
  
  if (e.type === 'enemy') {
    if (e.dying) {
      // 死亡: 蜗牛/乌鸦用翻转 dead sprite, 蛇/野猪用首帧
      if (e.sub === 'snail') key = 'enemy.snail.dead';
      else if (e.sub === 'crow') key = 'enemy.crow.dead';
      else key = `enemy.${e.sub}.0`;
    } else {
      key = `enemy.${e.sub}.${af}`;
    }
    if (e.sub === 'crow' && !e.dying) yOff = -(scales.crowYOffset != null ? scales.crowYOffset : 28);
    if (e.sub === 'crow' && e.dying) yOff = -(scales.crowYOffset != null ? scales.crowYOffset : 28);
    scale = scales.enemyScale || 1;
  } else if (e.type === 'obs') {
    if (e.sub === 'rock') key = 'obstacle.rock';
    else key = `obstacle.fire.${Math.floor(e.f / 4) % 4}`;
    scale = scales.obstacleScale || 1;
  } else if (e.type === 'egg') {
    if (e.stage === 'rolling' || e.stage === undefined) {
      key = 'item.egg';
    } else if (e.stage === 'flying') {
      key = 'item.egg';
      yOff = e.flyY || 0;
    } else if (e.stage === 'cracking') {
      key = 'item.egg_cracked';
    } else if (e.stage === 'item') {
      if (e.sub === 'axe') key = 'item.axe.0';
      else if (e.sub === 'fairy') key = 'item.fairy';
      else if (e.sub === 'skateboard') key = 'item.skateboard';
      else key = 'item.axe.0';
    }
    scale = scales.itemScale || 1;
  } else if (e.type === 'fruit') {
    key = `fruit.${e.sub}`;
    // 水果全部空中, 高度由 layoutOpts.fruitAirY 实时控制
    yOff = -(scales.fruitAirY != null ? scales.fruitAirY : 28);
    scale = scales.fruitScale || 1;
  }
  
  if (!key) return;
  const spr = SPRITES[key];
  if (!spr) return;
  const drawH = Math.round(spr.h * scale);
  // 死亡偏移 (相对原位置, 让敌人独立做抛物线 + 穿过地面)
  const dyOffX = e.dying ? Math.round(e.dyOffX || 0) : 0;
  const dyOffY = e.dying ? Math.round(e.dyOffY || 0) : 0;
  drawSprite(pixels, key, Math.floor(e.x) + dyOffX, groundY + yOff - drawH + dyOffY, false, scale);
}

// =============================================================
// 场景状态机 (供页面驱动)
// =============================================================

export function createInitialState() {
  return {
    frame: 0,
    scrollX: 0,
    character: {
      type: 'run',     // run | throw | skateboard
      hasAxe: false,
      jumping: false,
      jumpY: 0,
      jumpV: 0,
      throwT: 0,
      landing: 0,
      fairyT: 0,
      stumbleT: 0,    // 磕到滑板的停顿帧 (>0 时显示 stumble sprite)
      skateJumpOverCount: 0, // 滑板态下成功跳过的障碍物计数; >=5 时下一颗石头必撞
    },
    entities: [],
    axes: [],
    spawnCooldown: 60,    // 开局 2 秒就先出斧蛋, 不等抽签
    eggCooldown: 0,
    firstAxeSpawned: false,
    eggSeq: 0,            // 蛋出现顺序计数器: 0=斧, 1=滑板, 2=仙女, 3=滑板, 4=仙女...
  };
}

/**
 * 推进一帧
 */
export function tickScene(state, params = {}) {
  const {
    bgSpeed = 0.5,
    entSpeed = 0.6,
    jumpHeight = 14,
    autoMode = true,
    charX = CHAR_X,
    spawnInterval = 300,    // 主生成间隔 (帧, 30fps下 300=10s)
    spawnJitter = 60,       // 生成抖动 ±2s
    eggCooldownFrames = 5400, // 蛋(滑板/仙女)最小帧数 (90s @30fps); 开局斧蛋走单独支路, 不受影响
    eggSkipPercent = 50,    // 抽签到"蛋"段时再掷一次, 50% 跳过本次出蛋
    rightZoneClear = 40,    // 右侧多少 px 内有实体则跳过本次
    minJumpYToAirFruit = 8, // 跳到多高才能吃水果(水果在天上)
    crowYOffset = 28,       // 乌鸦距地高度
  } = params;
  
  state.frame++;
  // 滑板状态下整体加速 2 倍 (bg + ent 同步加速)
  const skateboardBoost = (state.character.type === 'skateboard') ? 2.0 : 1.0;
  const bgSpeedNow = bgSpeed * skateboardBoost;
  const entSpeedNow = entSpeed * skateboardBoost;
  state.scrollX += bgSpeedNow;
  
  const ch = state.character;
  
  // 跳跃物理
  if (ch.jumping) {
    ch.jumpY += ch.jumpV;
    ch.jumpV -= 0.5;
    if (ch.jumpY <= 0) {
      ch.jumpY = 0;
      ch.jumping = false;
      ch.jumpV = 0;
      if (ch.type === 'skateboard') ch.landing = 8;
    }
  }
  if (ch.landing > 0) ch.landing--;
  if (ch.throwT > 0) {
    ch.throwT--;
    // 注意: throwT 自然结束不再覆盖 type, 保留滑板等状态
  }
  if (ch.fairyT > 0) ch.fairyT--;
  if (ch.stumbleT > 0) ch.stumbleT--;
  
  // 实体移动
  const totalSpeed = entSpeedNow + bgSpeedNow;
  for (let i = state.entities.length - 1; i >= 0; i--) {
    const e = state.entities[i];
    e.f++;
    
    // 死亡中的敌人: 独立运动 (不跟场景滚动), 重力下落
    if (e.dying) {
      e.dyT++;
      e.dyOffX = (e.dyOffX || 0) + e.dyVx;
      e.dyOffY = (e.dyOffY || 0) + e.dyVy;
      e.dyVy += 0.7;   // 重力
      // 死亡 entity 不跟场景滚动 (e.x 锁死, 只用 dyOff 偏移)
      // 离屏移除: 超出屏幕底部 32px 或 飞出屏幕
      if (e.dyOffY > 64 || e.x + e.dyOffX < -32 || e.x + e.dyOffX > 96) {
        state.entities.splice(i, 1);
      }
      continue;
    }
    
    e.x -= totalSpeed;
    
    const eRight = e.x + 16;
    
    // 滑板态下: 障碍物越过角色右侧, 计 +1 (用于 15 次必栽阈值)
    if (ch.type === 'skateboard' && e.type === 'obs' && !e.passedByChar) {
      if (eRight <= charX) {
        e.passedByChar = true;
        if (ch.skateJumpOverCount < 250) ch.skateJumpOverCount++;
      }
    }
    
    // 蛋阶段: rolling → flying (抛物线右飞) → cracking (蛋碎) → item (道具)
    if (e.type === 'egg') {
      if (e.stage === undefined) e.stage = 'rolling';
      
      if (e.stage === 'rolling') {
        if (eRight > charX && e.x < charX + CHAR_HIT_W) {
          e.stage = 'flying';
          e.flyT = 0;
          e.flyDuration = 8;   // 飞 8 帧落地
          e.flyStartX = e.x;
          e.flyVx = 1.6;
        }
      } else if (e.stage === 'flying') {
        // 抵消默认场景滚, 自己以抛物线右飞
        e.x += totalSpeed + e.flyVx;
        e.flyT++;
        // 抛物线高度: 0 → max → 0, 用 flyY 偏移渲染
        const t = e.flyT / e.flyDuration;        // 0..1
        e.flyY = -16 * 4 * t * (1 - t);          // 最大高度 16, 中间最高
        if (e.flyT >= e.flyDuration) {
          e.stage = 'cracking';
          e.flyY = 0;
          e.crackT = 0;
        }
      } else if (e.stage === 'cracking') {
        e.crackT++;
        // 蛋碎动画 4 帧后变道具
        if (e.crackT >= 4) {
          e.stage = 'item';
        }
      } else if (e.stage === 'item') {
        if (eRight > charX && e.x < charX + CHAR_HIT_W) {
          if (e.sub === 'axe') { ch.hasAxe = true; }
          if (e.sub === 'fairy') { ch.fairyT = 900; }
          if (e.sub === 'skateboard') { ch.type = 'skateboard'; ch.skateJumpOverCount = 0; }
          state.entities.splice(i, 1);
          continue;
        }
      }
      
      if (e.x < -32) state.entities.splice(i, 1);
      continue;
    }
    
    if (eRight > charX && e.x < charX + CHAR_HIT_W) {
      if (e.dying) {
        // 死亡中的敌人不参与任何角色碰撞
      } else if (e.type === 'fruit') {
        // 水果在天上, 角色必须跳到一定高度才能吃到
        if (ch.jumpY < minJumpYToAirFruit) {
          // 跳得不够高, 不吃
        } else {
          state.entities.splice(i, 1);
          continue;
        }
      }
      if (e.type === 'enemy' && ch.fairyT > 0) {
        // 仙女撞到敌人: 敌人和仙女都消失
        state.entities.splice(i, 1);
        ch.fairyT = 0;
        continue;
      }
      // 仙女期间撞到障碍物也消失
      if (e.type === 'obs' && ch.fairyT > 0) {
        state.entities.splice(i, 1);
        ch.fairyT = 0;
        continue;
      }
      // 滑板撞到石头(达到阈值后强制不跳): 被石头顶起到障碍物高度 → 自由落体, 显示 stumble
      // 必须角色还在地面 (jumpY 接近 0) 才算撞到 — 跳起来时 Y 高于石头, 算跳过
      if (e.type === 'obs' && e.sub === 'rock' && ch.type === 'skateboard' && ch.jumpY < 4) {
        ch.type = 'run';            // 滑板没了
        ch.skateJumpOverCount = 0;
        ch.stumbleT = 24;           // stumble 动画持续, 落地后清零
        // 被石头顶起: 弹到障碍物高度 12, 然后自由落体
        ch.jumping = true;
        ch.jumpY = 12;              // 立刻在顶
        ch.jumpV = 0;               // 重力下一帧 -0.5
        state.entities.splice(i, 1); // 石头消失
        continue;
      }
    }
    
    if (e.x < -32) state.entities.splice(i, 1);
  }
  
  // 飞行斧头
  for (let i = state.axes.length - 1; i >= 0; i--) {
    state.axes[i].x += (params.axeSpeed != null ? params.axeSpeed : 2);
    state.axes[i].f++;
    for (let j = state.entities.length - 1; j >= 0; j--) {
      const e = state.entities[j];
      if (e.type !== 'enemy') continue;
      if (e.dying) continue;   // 死亡中的不再被斧打
      const enemyY = e.sub === 'crow' ? crowYOffset : 0;
      if (Math.abs(e.x - state.axes[i].x) < 14 && Math.abs(enemyY - state.axes[i].y) < 20) {
        // 命中: 进入死亡状态
        e.dying = true;
        e.dyT = 0;
        e.dyOffX = 0;
        e.dyOffY = 0;
        // 速度: 蜗牛/乌鸦 → 向右; 蛇/野猪 → 向左
        if (e.sub === 'crow') {
          e.dyVx = 1.5;
          e.dyVy = -2.0;
        } else if (e.sub === 'snail') {
          e.dyVx = 1.5;
          e.dyVy = -2.5;
        } else {
          // 蛇/野猪 向左
          e.dyVx = -1.5;
          e.dyVy = -2.5;
        }
        state.axes.splice(i, 1);
        break;
      }
    }
    if (state.axes[i] && state.axes[i].x > 70) state.axes.splice(i, 1);
  }
  
  // 自动事件
  if (autoMode) {
    if (state.spawnCooldown > 0) state.spawnCooldown--;
    if (state.eggCooldown > 0) state.eggCooldown--;
    
    // 检查右侧空闲: 地面/空中分开检查 (天上水果可以跟地上障碍同屏)
    function isAirEntity(e) {
      if (e.type === 'fruit') return true;
      if (e.type === 'enemy' && e.sub === 'crow') return true;
      return false;
    }
    const rightAirBusy = state.entities.some(e => !e.dying && e.x > SCREEN_W - rightZoneClear && isAirEntity(e));
    const rightGroundBusy = state.entities.some(e => !e.dying && e.x > SCREEN_W - rightZoneClear && !isAirEntity(e));
    
    if (state.spawnCooldown <= 0) {
      // 开局必先出一个斧蛋, 让角色拿到斧再开始正常抽签
      if (!state.firstAxeSpawned) {
        if (!rightGroundBusy) {
          spawnEgg(state, 'axe');
          state.eggCooldown = eggCooldownFrames;
          state.firstAxeSpawned = true;
          state.eggSeq = 1;  // 下一个蛋是滑板
          const jitter = Math.floor((Math.random() * 2 - 1) * spawnJitter);
          state.spawnCooldown = spawnInterval + jitter;
        } else {
          // 右侧地面忙, 等下帧重试
          state.spawnCooldown = 1;
        }
      } else {
        // 抽签 + 区分空中/地面 busy
        // 权重: 水果 25 / 障碍 25 / 敌人 30 / 蛋 20 (总和 100, 无 skip)
        const r = Math.random() * 100;
        if (r < 25 && !rightAirBusy) {
          spawnFruit(state);
        } else if (r < 50 && !rightGroundBusy) {
          Math.random() > 0.5 ? spawnObstacle(state, 'rock') : spawnObstacle(state, 'fire');
        } else if (r < 80) {
          const types = ['snail', 'crow', 'boar', 'snake'];
          const sub = types[Math.floor(Math.random() * types.length)];
          const isAir = sub === 'crow';
          if ((isAir && !rightAirBusy) || (!isAir && !rightGroundBusy)) {
            state.entities.push({ type: 'enemy', sub, x: SCREEN_W, f: 0 });
          }
        } else if (!rightGroundBusy && state.eggCooldown <= 0) {
          // 90 秒冷却到点了也不一定出蛋: eggSkipPercent% 跳过, 让下次抽签机会再来
          // (跳过时不重置 eggCooldown, 这样玩家不必再等 90 秒, 但确实不一定立刻出)
          if (Math.random() * 100 < eggSkipPercent) {
            // skip 本次出蛋
          } else {
            // 蛋固定顺序: 没斧 → 必出斧; 有斧 → 滑板/仙女交替
            // 但角色已经踩滑板时, 不再出滑板, 只出仙女
            let contains;
            if (!ch.hasAxe) {
              contains = 'axe';
              state.eggSeq = 1;
            } else if (ch.type === 'skateboard') {
              contains = 'fairy';
              state.eggSeq++;
            } else {
              // eggSeq 1=滑板, 2=仙女, 3=滑板, 4=仙女...
              contains = (state.eggSeq % 2 === 1) ? 'skateboard' : 'fairy';
              state.eggSeq++;
            }
            spawnEgg(state, contains);
            state.eggCooldown = eggCooldownFrames;
          }
        }
        
        const jitter = Math.floor((Math.random() * 2 - 1) * spawnJitter);
        state.spawnCooldown = spawnInterval + jitter;
      }
    }
    
    // 自动避障 + 投掷
    const jumpV0 = jumpHeight / 4;
    const jumpFrames = Math.ceil(jumpV0 / 0.5) * 2;
    // reachFactor: 起跳提前量 (0.5=原版, 越大越提前)
    // 默认 0.5; 滑板状态默认 0.6 (略提前一点, 但不要早到落到障碍上)
    const userReachFactor = params.reachFactor;
    const reachFactor = userReachFactor != null
      ? userReachFactor
      : (ch.type === 'skateboard' ? 0.6 : 0.5);
    const reachDist = jumpFrames * totalSpeed * reachFactor;
    const triggerStart = reachDist - 4;
    const triggerEnd = reachDist + 4;
    
    for (const e of state.entities) {
      if (e.dying) continue;   // 死亡中的敌人不再触发任何 AI
      const distToChar = e.x - charX;
      
      // 跳跃: 障碍物 / 没斧时的地面敌人 / 吃水果(必须跳)
      // 仙女无敌期间不跳, 直接撞过去触发"撞掉仙女"流程
      // 滑板状态下也要主动跳避障/避地面敌人, 不然会被撞掉滑板
      const isGroundEnemy = e.type === 'enemy' && e.sub !== 'crow';
      const needJumpForFruit = e.type === 'fruit';
      const needJumpOver = ch.fairyT === 0 && (
        (e.type === 'obs') ||
        (isGroundEnemy && !ch.hasAxe) ||
        (isGroundEnemy && ch.type === 'skateboard')
      );
      
      if (distToChar > triggerStart && distToChar < triggerEnd) {
        if ((needJumpOver || needJumpForFruit) && !ch.jumping) {
          // 滑板 + 石头障碍: 跳过足够多障碍后强制不跳, 防止角色一直滑板态
          // 若 skateJumpOverCount >= 5, 则强制不跳 (必撞)
          // (e.failChecked 标记本次已检查, 不重复)
          if (ch.type === 'skateboard' && e.type === 'obs' && e.sub === 'rock' && !e.failChecked) {
            e.failChecked = true;
            const forceWipeout = (ch.skateJumpOverCount || 0) >= 5;
            if (forceWipeout) {
              // 这次不跳, 让石头撞上来 (碰撞段会掉滑板)
            } else {
              triggerJump(ch, jumpHeight);
            }
          } else {
            triggerJump(ch, jumpHeight);
          }
        }
      }
      
      // 投掷
      if (e.type === 'enemy' && ch.hasAxe && ch.throwT === 0) {
        const throwCenter = params.throwDist != null ? params.throwDist : 32;
        const throwRange = params.throwRange != null ? params.throwRange : 16;
        const throwLo = throwCenter - throwRange;
        const throwHi = throwCenter + throwRange;
        const jumpCenter = params.crowJumpDist != null ? params.crowJumpDist : 40;
        const jumpRange = params.crowJumpRange != null ? params.crowJumpRange : 12;
        
        if (e.sub === 'crow') {
          // 乌鸦在天上: 跳起来扔
          if (distToChar > jumpCenter - jumpRange && distToChar < jumpCenter + jumpRange && !ch.jumping) {
            triggerJump(ch, jumpHeight);
          }
          // 在跳跃最高点附近扔斧 (jumpV 接近 0, 上升结束/下落初始)
          if (distToChar > throwLo && distToChar < throwHi && ch.jumping && Math.abs(ch.jumpV) < 1.0) {
            triggerThrow(ch, state, charX, ch.jumpY);
          }
        } else {
          // 地面敌人: 站着扔, 不跳
          if (distToChar > throwLo && distToChar < throwHi && !ch.jumping) {
            triggerThrow(ch, state, charX, 0);
          }
        }
      }
    }
  }
  
  return state;
}

export function triggerJump(ch, jumpHeight = 14) {
  if (!ch.jumping) {
    ch.jumping = true;
    ch.jumpV = jumpHeight / 4;
  }
}

export function triggerThrow(ch, state, charX = CHAR_X, jumpY = 0) {
  if (!ch.hasAxe) return;
  // 同屏只允许 1 把斧头
  if (state.axes.length > 0) return;
  // 不再修改 ch.type, 用 throwT 单独控制投掷动画时长
  ch.throwT = 4;
  // 斧子 y 跟随角色当前高度
  state.axes.push({ x: charX + 16, y: jumpY, f: 0 });
}

export function spawnEnemy(state, sub) {
  const e = { type: 'enemy', sub, x: 64, f: 0 };
  if (sub === 'crow') e.crowY = 28;
  state.entities.push(e);
}
export function spawnObstacle(state, sub) { state.entities.push({ type: 'obs', sub, x: 64, f: 0 }); }
export function spawnFruit(state) {
  state.entities.push({ type: 'fruit', sub: Math.floor(Math.random() * 5), x: 64, f: 0 });
}
export function spawnEgg(state, contains) { state.entities.push({ type: 'egg', sub: contains, x: 64, f: 0, cracked: false, crackTimer: 0 }); }
