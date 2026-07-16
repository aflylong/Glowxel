/**
 * 鍐掗櫓宀?1 浠ｄ富棰樻覆鏌撳櫒
 * 杈撳叆: state + animTimeSec 鈫?杈撳嚭: Map<"x,y", "#hex">
 * 
 * 64脳64 鍍忕礌灞忥紝鏃犺鑹叉浜★紝寰幆灞曠ず銆?
 * 瑙掕壊鍥哄畾鍦ㄥ睆骞曞乏渚?X 浣嶇疆锛岃儗鏅粴鍔ㄣ€?
 */

import { SPRITES } from './adventureIslandSprites.js';

const SCREEN_W = 64;
const SCREEN_H = 64;
const GROUND_Y = 48;     // 鍦伴潰椤堕儴 Y
const CHAR_X = 12;       // 瑙掕壊鍥哄畾 X
const CHAR_HIT_W = 16;   // 瑙掕壊纰版挒瀹藉害

// NES 鐪熷疄璋冭壊鏉?
const SKY = '#001E74';
const GRASS_LIGHT = '#7CD420';
const GRASS_MID = '#38CC6C';
const GRASS_DARK = '#087C00';
const DIRT_LIGHT = '#D48820';
const DIRT_DARK = '#783C00';
const CLOUD = '#ECEEEC';

// =============================================================
// 宸ュ叿鍑芥暟
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
  // 缂╂斁: 鐢ㄦ渶杩戦偦閲囨牱
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
// 鑳屾櫙: 鐢?bg.tile 鐪熷疄鍍忕礌鑳屾櫙妯悜寰幆骞抽摵
// =============================================================

function drawBackground(pixels, scrollX, bgYOffset = 0) {
  const tile = SPRITES['bg.tile'];
  if (!tile) return;
  const { w: tw, h: th, p: tp } = tile;

  // 鑳屾櫙 48x82, 灞忓箷 64x64
  // bgYOffset 鎺у埗鑳屾櫙鍦ㄥ睆骞曚腑鐨?Y 浣嶇疆
  // 榛樿 srcYOffset = th - SCREEN_H = 18, 鍗冲簳閮ㄥ榻?
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
// 瑙掕壊 sprite key 閫夋嫨
// =============================================================

function getCharSpriteKey(state, frame) {
  // 纾曞埌浼樺厛绾ф渶楂?(婊戞澘鎾炵煶澶村悗鐨勫脊璧?涓嬭惤鍔ㄧ敾)
  if (state.stumbleT > 0) return 'higgins.stumble';
  
  // 鎶曟幏: 鍙樉绀?frame3 杩欎竴甯?(婊戞澘鐘舵€佷笅涓嶅垏鎹prite, 浠嶇敾婊戞澘)
  if (state.throwT > 0 && state.type !== 'skateboard') {
    return 'higgins.throw.3';
  }
  
  // 婊戞澘
  if (state.type === 'skateboard') {
    if (state.jumping) {
      // 婊戞澘璺宠穬鍏ㄧ▼鐢?skateboard_land.0
      return 'higgins.skateboard_land.0';
    }
    if (state.landing > 0) return 'higgins.skateboard_land.0';
    return `higgins.skateboard.${Math.floor(frame / 8) % 2}`;
  }
  
  // 鏅€氳窇姝ョ姸鎬佷笅璺宠穬: 鐢?throw.2 (鑴告湞鍓?
  if (state.jumping) return 'higgins.throw.2';
  
  // 璺戞寰幆
  return `higgins.run.${Math.floor(frame / 6) % 3}`;
}

// =============================================================
// 涓绘覆鏌?
// =============================================================

/**
 * @param {object} sceneState - 瀹屾暣鍦烘櫙鐘舵€?
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
  
  // 1. 鑳屾櫙
  drawBackground(pixels, scrollX, bgYOffset);
  
  // 2. 瀹炰綋锛堟晫浜?闅滅/铔?姘存灉锛?
  for (const e of entities) {
    drawEntity(pixels, e, groundY, {
      obstacleScale, enemyScale, itemScale, fruitScale,
      crowYOffset: layoutOpts.crowYOffset,
      fruitAirY: layoutOpts.fruitAirY,
    });
  }
  
  // 3. 椋炶鏂уご
  for (const a of axes) {
    const animSpeed = layoutOpts.axeAnimSpeed || 3;
    // 甯ч『搴? 1 鈫?2 鈫?3 鈫?0 鈫?寰幆
    const seq = [1, 2, 3, 0];
    const key = `item.axe.${seq[Math.floor(a.f / animSpeed) % 4]}`;
    // 椋炶鏂уご璺熻泲閲屾帀鍑烘潵鐨勬枾澶村悓鏍峰ぇ灏?(鐢?itemScale)
    const axeScale = layoutOpts.itemScale || 1;
    const spr = SPRITES[key];
    if (spr) {
      const drawH = Math.round(spr.h * axeScale);
      drawSprite(pixels, key, Math.floor(a.x), groundY - 24 - (a.y || 0) + (16 - drawH), false, axeScale);
    }
  }
  
  // 4. 瑙掕壊
  const charKey = getCharSpriteKey(ch, frame);
  const charSpr = SPRITES[charKey];
  if (charSpr) {
    const cy = groundY - charSpr.h - ch.jumpY;
    drawSprite(pixels, charKey, charX, cy);
  }
  
  // 5. 浠欏コ璺熼殢
  if (ch.fairyT > 0) {
    const fy = Math.sin(frame * 0.15) * 3;
    const fairyOffsetY = layoutOpts.fairyOffsetY != null ? layoutOpts.fairyOffsetY : 36;
    const fairyOffsetX = layoutOpts.fairyOffsetX != null ? layoutOpts.fairyOffsetX : -14;
    drawSprite(pixels, 'item.fairy', charX + fairyOffsetX, groundY - fairyOffsetY + Math.round(fy));
  }
  
  // 6. HUD 鏃堕挓 (鐏 + 鏁板瓧)
  if (layoutOpts.showClock !== false) {
    drawClock(pixels, layoutOpts);
  }
  
  return pixels;
}

// =============================================================
// HUD 鏃堕挓: HH:MM, 姣忎綅 = 鐏搴?(16x16) + 鏁板瓧 (8x8) 灞呬腑鍙犲姞
// =============================================================

function drawClock(pixels, opts) {
  const {
    clockX = 0,
    clockY = 0,
    clockSpacing = 1,   // 鏁板瓧涔嬮棿闂撮殧
    clockColonGap = 2,  // HH 鍜?MM 涔嬮棿棰濆闂撮殧(鐢诲啋鍙?
    clockColon = true,  // 鏄惁鐢诲啋鍙?
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
      // HH 瀹屼簡, 鐣欓棿闅? 鍙€夌敾鍐掑彿
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
      // 姝讳骸: 铚楃墰/涔岄甫鐢ㄧ炕杞?dead sprite, 铔?閲庣尓鐢ㄩ甯?
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
    // 姘存灉鍏ㄩ儴绌轰腑, 楂樺害鐢?layoutOpts.fruitAirY 瀹炴椂鎺у埗
    yOff = -(scales.fruitAirY != null ? scales.fruitAirY : 28);
    scale = scales.fruitScale || 1;
  }
  
  if (!key) return;
  const spr = SPRITES[key];
  if (!spr) return;
  const drawH = Math.round(spr.h * scale);
  // 姝讳骸鍋忕Щ (鐩稿鍘熶綅缃? 璁╂晫浜虹嫭绔嬪仛鎶涚墿绾?+ 绌胯繃鍦伴潰)
  const dyOffX = e.dying ? Math.round(e.dyOffX || 0) : 0;
  const dyOffY = e.dying ? Math.round(e.dyOffY || 0) : 0;
  drawSprite(pixels, key, Math.floor(e.x) + dyOffX, groundY + yOff - drawH + dyOffY, false, scale);
}

// =============================================================
// 鍦烘櫙鐘舵€佹満 (渚涢〉闈㈤┍鍔?
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
      stumbleT: 0,    // 纾曞埌婊戞澘鐨勫仠椤垮抚 (>0 鏃舵樉绀?stumble sprite)
      skateJumpOverCount: 0, // 婊戞澘鎬佷笅鎴愬姛璺宠繃鐨勯殰纰嶇墿璁℃暟; >=5 鏃朵笅涓€棰楃煶澶村繀鎾?    },
    entities: [],
    axes: [],
    spawnCooldown: 60,    // 寮€灞€ 2 绉掑氨鍏堝嚭鏂ц泲, 涓嶇瓑鎶界
    eggCooldown: 0,
    firstAxeSpawned: false,
    eggSeq: 0,            // 铔嬪嚭鐜伴『搴忚鏁板櫒: 0=鏂? 1=婊戞澘, 2=浠欏コ, 3=婊戞澘, 4=浠欏コ...
  };
}

/**
 * 鎺ㄨ繘涓€甯?
 */
export function tickScene(state, params = {}) {
  const {
    bgSpeed = 0.5,
    entSpeed = 0.6,
    jumpHeight = 14,
    autoMode = true,
    charX = CHAR_X,
    spawnInterval = 300,    // 涓荤敓鎴愰棿闅?(甯? 30fps涓?300=10s)
    spawnJitter = 60,       // 鐢熸垚鎶栧姩 卤2s
    eggCooldownFrames = 5400, // 铔?婊戞澘/浠欏コ)鏈€灏忓抚鏁?(90s @30fps); 寮€灞€鏂ц泲璧板崟鐙敮璺? 涓嶅彈褰卞搷
    eggSkipPercent = 50,    // 鎶界鍒?铔?娈垫椂鍐嶆幏涓€娆? 50% 璺宠繃鏈鍑鸿泲
    rightZoneClear = 40,    // 鍙充晶澶氬皯 px 鍐呮湁瀹炰綋鍒欒烦杩囨湰娆?
    minJumpYToAirFruit = 8, // 璺冲埌澶氶珮鎵嶈兘鍚冩按鏋?姘存灉鍦ㄥぉ涓?
    crowYOffset = 28,       // 涔岄甫璺濆湴楂樺害
  } = params;
  
  state.frame++;
  // 婊戞澘鐘舵€佷笅鏁翠綋鍔犻€?2 鍊?(bg + ent 鍚屾鍔犻€?
  const skateboardBoost = (state.character.type === 'skateboard') ? 2.0 : 1.0;
  const bgSpeedNow = bgSpeed * skateboardBoost;
  const entSpeedNow = entSpeed * skateboardBoost;
  state.scrollX += bgSpeedNow;
  
  const ch = state.character;
  
  // 璺宠穬鐗╃悊
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
    // 娉ㄦ剰: throwT 鑷劧缁撴潫涓嶅啀瑕嗙洊 type, 淇濈暀婊戞澘绛夌姸鎬?
  }
  if (ch.fairyT > 0) ch.fairyT--;
  if (ch.stumbleT > 0) ch.stumbleT--;
  
  // 瀹炰綋绉诲姩
  const totalSpeed = entSpeedNow + bgSpeedNow;
  for (let i = state.entities.length - 1; i >= 0; i--) {
    const e = state.entities[i];
    e.f++;
    
    // 姝讳骸涓殑鏁屼汉: 鐙珛杩愬姩 (涓嶈窡鍦烘櫙婊氬姩), 閲嶅姏涓嬭惤
    if (e.dying) {
      e.dyT++;
      e.dyOffX = (e.dyOffX || 0) + e.dyVx;
      e.dyOffY = (e.dyOffY || 0) + e.dyVy;
      e.dyVy += 0.7;   // 閲嶅姏
      // 姝讳骸 entity 涓嶈窡鍦烘櫙婊氬姩 (e.x 閿佹, 鍙敤 dyOff 鍋忕Щ)
      // 绂诲睆绉婚櫎: 瓒呭嚭灞忓箷搴曢儴 32px 鎴?椋炲嚭灞忓箷
      if (e.dyOffY > 64 || e.x + e.dyOffX < -32 || e.x + e.dyOffX > 96) {
        state.entities.splice(i, 1);
      }
      continue;
    }
    
    e.x -= totalSpeed;
    
    const eRight = e.x + 16;
    
    // 婊戞澘鎬佷笅: 闅滅鐗╄秺杩囪鑹插彸渚? 璁?+1 (鐢ㄤ簬 15 娆″繀鏍介槇鍊?
    if (ch.type === 'skateboard' && e.type === 'obs' && !e.passedByChar) {
      if (eRight <= charX) {
        e.passedByChar = true;
        if (ch.skateJumpOverCount < 250) ch.skateJumpOverCount++;
      }
    }
    
    // 铔嬮樁娈? rolling 鈫?flying (鎶涚墿绾垮彸椋? 鈫?cracking (铔嬬) 鈫?item (閬撳叿)
    if (e.type === 'egg') {
      if (e.stage === undefined) e.stage = 'rolling';
      
      if (e.stage === 'rolling') {
        if (eRight > charX && e.x < charX + CHAR_HIT_W) {
          e.stage = 'flying';
          e.flyT = 0;
          e.flyDuration = 8;   // 椋?8 甯ц惤鍦?
          e.flyStartX = e.x;
          e.flyVx = 1.6;
        }
      } else if (e.stage === 'flying') {
        // 鎶垫秷榛樿鍦烘櫙婊? 鑷繁浠ユ姏鐗╃嚎鍙抽
        e.x += totalSpeed + e.flyVx;
        e.flyT++;
        // 鎶涚墿绾块珮搴? 0 鈫?max 鈫?0, 鐢?flyY 鍋忕Щ娓叉煋
        const t = e.flyT / e.flyDuration;        // 0..1
        e.flyY = -16 * 4 * t * (1 - t);          // 鏈€澶ч珮搴?16, 涓棿鏈€楂?
        if (e.flyT >= e.flyDuration) {
          e.stage = 'cracking';
          e.flyY = 0;
          e.crackT = 0;
        }
      } else if (e.stage === 'cracking') {
        e.crackT++;
        // 铔嬬鍔ㄧ敾 4 甯у悗鍙橀亾鍏?
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
        // 姝讳骸涓殑鏁屼汉涓嶅弬涓庝换浣曡鑹茬鎾?
      } else if (e.type === 'fruit') {
        // 姘存灉鍦ㄥぉ涓? 瑙掕壊蹇呴』璺冲埌涓€瀹氶珮搴︽墠鑳藉悆鍒?
        if (ch.jumpY < minJumpYToAirFruit) {
          // 璺冲緱涓嶅楂? 涓嶅悆
        } else {
          state.entities.splice(i, 1);
          continue;
        }
      }
      if (e.type === 'enemy' && ch.fairyT > 0) {
        // 浠欏コ鎾炲埌鏁屼汉: 鏁屼汉鍜屼粰濂抽兘娑堝け
        state.entities.splice(i, 1);
        ch.fairyT = 0;
        continue;
      }
      // 浠欏コ鏈熼棿鎾炲埌闅滅鐗╀篃娑堝け
      if (e.type === 'obs' && ch.fairyT > 0) {
        state.entities.splice(i, 1);
        ch.fairyT = 0;
        continue;
      }
      // 婊戞澘鎾炲埌鐭冲ご(杈惧埌闃堝€煎悗寮哄埗涓嶈烦): 琚煶澶撮《璧峰埌闅滅鐗╅珮搴?鈫?鑷敱钀戒綋, 鏄剧ず stumble
      // 蹇呴』瑙掕壊杩樺湪鍦伴潰 (jumpY 鎺ヨ繎 0) 鎵嶇畻鎾炲埌 鈥?璺宠捣鏉ユ椂 Y 楂樹簬鐭冲ご, 绠楄烦杩?
      if (e.type === 'obs' && e.sub === 'rock' && ch.type === 'skateboard' && ch.jumpY < 4) {
        ch.type = 'run';            // 婊戞澘娌′簡
        ch.skateJumpOverCount = 0;
        ch.stumbleT = 24;           // stumble 鍔ㄧ敾鎸佺画, 钀藉湴鍚庢竻闆?
        // 琚煶澶撮《璧? 寮瑰埌闅滅鐗╅珮搴?12, 鐒跺悗鑷敱钀戒綋
        ch.jumping = true;
        ch.jumpY = 12;              // 绔嬪埢鍦ㄩ《
        ch.jumpV = 0;               // 閲嶅姏涓嬩竴甯?-0.5
        state.entities.splice(i, 1); // 鐭冲ご娑堝け
        continue;
      }
    }
    
    if (e.x < -32) state.entities.splice(i, 1);
  }
  
  // 椋炶鏂уご
  for (let i = state.axes.length - 1; i >= 0; i--) {
    state.axes[i].x += (params.axeSpeed != null ? params.axeSpeed : 2);
    state.axes[i].f++;
    for (let j = state.entities.length - 1; j >= 0; j--) {
      const e = state.entities[j];
      if (e.type !== 'enemy') continue;
      if (e.dying) continue;   // 姝讳骸涓殑涓嶅啀琚枾鎵?
      const enemyY = e.sub === 'crow' ? crowYOffset : 0;
      if (Math.abs(e.x - state.axes[i].x) < 14 && Math.abs(enemyY - state.axes[i].y) < 20) {
        // 鍛戒腑: 杩涘叆姝讳骸鐘舵€?
        e.dying = true;
        e.dyT = 0;
        e.dyOffX = 0;
        e.dyOffY = 0;
        // 閫熷害: 铚楃墰/涔岄甫 鈫?鍚戝彸; 铔?閲庣尓 鈫?鍚戝乏
        if (e.sub === 'crow') {
          e.dyVx = 1.5;
          e.dyVy = -2.0;
        } else if (e.sub === 'snail') {
          e.dyVx = 1.5;
          e.dyVy = -2.5;
        } else {
          // 铔?閲庣尓 鍚戝乏
          e.dyVx = -1.5;
          e.dyVy = -2.5;
        }
        state.axes.splice(i, 1);
        break;
      }
    }
    if (state.axes[i] && state.axes[i].x > 70) state.axes.splice(i, 1);
  }
  
  // 鑷姩浜嬩欢
  if (autoMode) {
    if (state.spawnCooldown > 0) state.spawnCooldown--;
    if (state.eggCooldown > 0) state.eggCooldown--;
    
    // 妫€鏌ュ彸渚х┖闂? 鍦伴潰/绌轰腑鍒嗗紑妫€鏌?(澶╀笂姘存灉鍙互璺熷湴涓婇殰纰嶅悓灞?
    function isAirEntity(e) {
      if (e.type === 'fruit') return true;
      if (e.type === 'enemy' && e.sub === 'crow') return true;
      return false;
    }
    const rightAirBusy = state.entities.some(e => !e.dying && e.x > SCREEN_W - rightZoneClear && isAirEntity(e));
    const rightGroundBusy = state.entities.some(e => !e.dying && e.x > SCREEN_W - rightZoneClear && !isAirEntity(e));
    
    if (state.spawnCooldown <= 0) {
      // 寮€灞€蹇呭厛鍑轰竴涓枾铔? 璁╄鑹叉嬁鍒版枾鍐嶅紑濮嬫甯告娊绛?
      if (!state.firstAxeSpawned) {
        if (!rightGroundBusy) {
          spawnEgg(state, 'axe');
          state.eggCooldown = eggCooldownFrames;
          state.firstAxeSpawned = true;
          state.eggSeq = 1;  // 涓嬩竴涓泲鏄粦鏉?
          const jitter = Math.floor((Math.random() * 2 - 1) * spawnJitter);
          state.spawnCooldown = spawnInterval + jitter;
        } else {
          // 鍙充晶鍦伴潰蹇? 绛変笅甯ч噸璇?
          state.spawnCooldown = 1;
        }
      } else {
        // 鎶界 + 鍖哄垎绌轰腑/鍦伴潰 busy
        // 鏉冮噸: 姘存灉 25 / 闅滅 25 / 鏁屼汉 30 / 铔?20 (鎬诲拰 100, 鏃?skip)
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
          // 90 绉掑喎鍗村埌鐐逛簡涔熶笉涓€瀹氬嚭铔? eggSkipPercent% 璺宠繃, 璁╀笅娆℃娊绛炬満浼氬啀鏉?
          // (璺宠繃鏃朵笉閲嶇疆 eggCooldown, 杩欐牱鐜╁涓嶅繀鍐嶇瓑 90 绉? 浣嗙‘瀹炰笉涓€瀹氱珛鍒诲嚭)
          if (Math.random() * 100 < eggSkipPercent) {
            // skip 鏈鍑鸿泲
          } else {
            // 铔嬪浐瀹氶『搴? 娌℃枾 鈫?蹇呭嚭鏂? 鏈夋枾 鈫?婊戞澘/浠欏コ浜ゆ浛
            // 浣嗚鑹插凡缁忚俯婊戞澘鏃? 涓嶅啀鍑烘粦鏉? 鍙嚭浠欏コ
            let contains;
            if (!ch.hasAxe) {
              contains = 'axe';
              state.eggSeq = 1;
            } else if (ch.type === 'skateboard') {
              contains = 'fairy';
              state.eggSeq++;
            } else {
              // eggSeq 1=婊戞澘, 2=浠欏コ, 3=婊戞澘, 4=浠欏コ...
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
    
    // 鑷姩閬块殰 + 鎶曟幏
    const jumpV0 = jumpHeight / 4;
    const jumpFrames = Math.ceil(jumpV0 / 0.5) * 2;
    // reachFactor: 璧疯烦鎻愬墠閲?(0.5=鍘熺増, 瓒婂ぇ瓒婃彁鍓?
    // 榛樿 0.5; 婊戞澘鐘舵€侀粯璁?0.6 (鐣ユ彁鍓嶄竴鐐? 浣嗕笉瑕佹棭鍒拌惤鍒伴殰纰嶄笂)
    const userReachFactor = params.reachFactor;
    const reachFactor = userReachFactor != null
      ? userReachFactor
      : (ch.type === 'skateboard' ? 0.6 : 0.5);
    const reachDist = jumpFrames * totalSpeed * reachFactor;
    const triggerStart = reachDist - 4;
    const triggerEnd = reachDist + 4;
    
    for (const e of state.entities) {
      if (e.dying) continue;   // 姝讳骸涓殑鏁屼汉涓嶅啀瑙﹀彂浠讳綍 AI
      const distToChar = e.x - charX;
      
      // 璺宠穬: 闅滅鐗?/ 娌℃枾鏃剁殑鍦伴潰鏁屼汉 / 鍚冩按鏋?蹇呴』璺?
      // 浠欏コ鏃犳晫鏈熼棿涓嶈烦, 鐩存帴鎾炶繃鍘昏Е鍙?鎾炴帀浠欏コ"娴佺▼"
      // 婊戞澘鐘舵€佷笅涔熻涓诲姩璺抽伩闅?閬垮湴闈㈡晫浜? 涓嶇劧浼氳鎾炴帀婊戞澘
      const isGroundEnemy = e.type === 'enemy' && e.sub !== 'crow';
      const needJumpForFruit = e.type === 'fruit';
      const needJumpOver = ch.fairyT === 0 && (
        (e.type === 'obs') ||
        (isGroundEnemy && !ch.hasAxe) ||
        (isGroundEnemy && ch.type === 'skateboard')
      );
      
      if (distToChar > triggerStart && distToChar < triggerEnd) {
        if ((needJumpOver || needJumpForFruit) && !ch.jumping) {
          // 婊戞澘 + 鐭冲ご闅滅: 璺宠繃瓒冲澶氶殰纰嶅悗寮哄埗涓嶈烦, 闃叉瑙掕壊涓€鐩存粦鏉挎€?          // 鑻?skateJumpOverCount >= 5, 鍒欏己鍒朵笉璺?(蹇呮挒)
          // (e.failChecked 鏍囪鏈宸叉鏌? 涓嶉噸澶?
          if (ch.type === 'skateboard' && e.type === 'obs' && e.sub === 'rock' && !e.failChecked) {
            e.failChecked = true;
            const forceWipeout = (ch.skateJumpOverCount || 0) >= 5;
            if (forceWipeout) {
              // 杩欐涓嶈烦, 璁╃煶澶存挒涓婃潵 (纰版挒娈典細鎺夋粦鏉?
            } else {
              triggerJump(ch, jumpHeight);
            }
          } else {
            triggerJump(ch, jumpHeight);
          }
        }
      }
      
      // 鎶曟幏
      if (e.type === 'enemy' && ch.hasAxe && ch.throwT === 0) {
        const throwCenter = params.throwDist != null ? params.throwDist : 32;
        const throwRange = params.throwRange != null ? params.throwRange : 16;
        const throwLo = throwCenter - throwRange;
        const throwHi = throwCenter + throwRange;
        const jumpCenter = params.crowJumpDist != null ? params.crowJumpDist : 40;
        const jumpRange = params.crowJumpRange != null ? params.crowJumpRange : 12;
        
        if (e.sub === 'crow') {
          // 涔岄甫鍦ㄥぉ涓? 璺宠捣鏉ユ墧
          if (distToChar > jumpCenter - jumpRange && distToChar < jumpCenter + jumpRange && !ch.jumping) {
            triggerJump(ch, jumpHeight);
          }
          // 鍦ㄨ烦璺冩渶楂樼偣闄勮繎鎵旀枾 (jumpV 鎺ヨ繎 0, 涓婂崌缁撴潫/涓嬭惤鍒濆)
          if (distToChar > throwLo && distToChar < throwHi && ch.jumping && Math.abs(ch.jumpV) < 1.0) {
            triggerThrow(ch, state, charX, ch.jumpY);
          }
        } else {
          // 鍦伴潰鏁屼汉: 绔欑潃鎵? 涓嶈烦
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
  // 鍚屽睆鍙厑璁?1 鎶婃枾澶?
  if (state.axes.length > 0) return;
  // 涓嶅啀淇敼 ch.type, 鐢?throwT 鍗曠嫭鎺у埗鎶曟幏鍔ㄧ敾鏃堕暱
  ch.throwT = 4;
  // 鏂у瓙 y 璺熼殢瑙掕壊褰撳墠楂樺害
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
