import { base64ToArrayBuffer } from '@/utils/browser-platform.js'
// ============================================================
// Boss 娓叉煋 v3 鈥?璺熸澘杞藉畬鍏ㄤ竴鑷?
//   鏁版嵁婧? uniapp/static/terraria/bosses_compact.js
//           (build-boss-firmware.js v5 鐢熸垚, 璺?firmware sprites_bosses.h 鍚屾簮)
//   鏁版嵁鏍煎紡: base + delta(set + clear), 閮藉凡棰勬覆鏌撳埌 64脳64 灞忓箷鍧愭爣
//   娓叉煋绠楁硶 = 鏉胯浇 drawSpriteAnimFrame 鐨?JS 缈昏瘧
// ============================================================

import BOSSES_COMPACT_RAW from '../assets/static/terraria/bosses_compact.js';

let _cache = null;
function getBossesCompact() {
  if (_cache !== null) return _cache;
  _cache = BOSSES_COMPACT_RAW || {};
  return _cache;
}

function _b64ToU8(b64) {
  return new Uint8Array(base64ToArrayBuffer(b64));
}

// 瑙ｇ爜缂撳瓨: slug 鈫?{ base: {set: [{x,y,r,g,b}], clear: [{x,y}]}, deltas: [...] }
const _decodedCache = new Map();
function decodeBoss(slug) {
  if (_decodedCache.has(slug)) return _decodedCache.get(slug);
  const all = getBossesCompact();
  const raw = all[slug];
  if (!raw) { _decodedCache.set(slug, null); return null; }

  function decodeSet(b, n) {
    if (!b || n === 0) return [];
    const u8 = _b64ToU8(b);
    const out = [];
    for (let i = 0; i < n; i++) {
      const o = i * 5;
      out.push({ x: u8[o], y: u8[o+1], r: u8[o+2], g: u8[o+3], b: u8[o+4] });
    }
    return out;
  }
  function decodeClear(b, n) {
    if (!b || n === 0) return [];
    const u8 = _b64ToU8(b);
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({ x: u8[i*2], y: u8[i*2+1] });
    }
    return out;
  }

  const decoded = {
    idx: raw.idx,
    biome: raw.biome,
    nameZh: raw.nameZh,
    x: raw.x, y: raw.y, scale: raw.scale,
    frameCount: raw.frameCount,
    base: { set: decodeSet(raw.base.s, raw.base.sN), clear: [] },
    deltas: (raw.deltas || []).map(d => ({
      set: decodeSet(d.s, d.sN),
      clear: decodeClear(d.c, d.cN),
    })),
  };
  _decodedCache.set(slug, decoded);
  return decoded;
}

// ============ 鍏叡 API ============

export function getBossCatalog() {
  const all = getBossesCompact();
  const byBiome = {};
  for (const slug of Object.keys(all)) {
    const meta = all[slug];
    const biome = meta.biome || 'forest';
    if (!byBiome[biome]) byBiome[biome] = [];
    byBiome[biome].push({ slug, nameZh: meta.nameZh, idx: meta.idx });
  }
  return byBiome;
}

export function getBossesForBiome(biome) {
  return getBossCatalog()[biome] || [];
}

export function getBossInfo(slug) {
  const all = getBossesCompact();
  return all[slug] || null;
}

// ============ 棰滆壊婊ら櫎 (閽堝鐗瑰畾 boss 鐨勮祫浜ц剰杈? ============
//   queen_slime sprite 鍦ㄨ浆鎹㈡椂娈嬬暀浜嗕竴鍦?#5A5A5E (90,90,94) / #69696D (105,105,109)
//   鐨勭伆鑹叉弿杈逛吉褰?鈥?涓嶆槸娓告垙鍘熸湰鐨勯鑹? 鏄缉鏀炬姉閿娇鍓骇鐗? 鐩存帴褰撻€忔槑涓㈡帀
function shouldDropPixel(slug, r, g, b) {
  if (slug === 'queen_slime') {
    if (r >= 85 && r <= 95 && g >= 85 && g <= 95 && b >= 88 && b <= 98) return true;   // #5A5A5E
    if (r >= 100 && r <= 110 && g >= 100 && g <= 110 && b >= 104 && b <= 114) return true; // #69696D
  }
  return false;
}

// ============ Boss 鍚庡鐞嗗姩鏁?============
// 闈欐€?boss 鍦ㄥ弽缂栬瘧婧愮爜閲屽叾瀹炴湁 AI 琛屼负, 浣嗙敤鏁翠綋鏅冨姩浼氬緢涓?
// 鏀圭敤"浜害鑴夊啿"妯℃嫙鍙戝厜浣撶殑鍛煎惛鎰? 鍙湪鍏抽敭 boss 鐢ㄧ粏寰綅绉?
//
// 杩斿洖 { dx, dy, brightness, eyePulse, eyeColorMatch }
//   brightness: 鏁翠綋浜害鍊嶆暟 (0.7..1.1)
//   eyePulse: 0..1, 鐢ㄤ簬"鐪奸儴/鍙戝厜鍍忕礌"棰濆鍔犱寒 (鍩轰簬鑹插僵鍖归厤)
//   eyeColorMatch: (r,g,b) 鈫?bool, 鍒ゆ柇鍍忕礌鏄惁涓鸿 boss 鐨勫彂鍏夊儚绱?
function getBossDynamicFx(slug, animTimeSec) {
  const t = animTimeSec || 0;
  // 鎱㈠懠鍚?0..1 (鍛ㄦ湡 2s)
  const breathSlow = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 2.0);
  // 涓€熷懠鍚?(鍛ㄦ湡 1.2s)
  const breathMid = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 1.2);
  // 蹇棯鐑?(鍛ㄦ湡 0.8s)
  const flashFast = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 0.8);
  // 鏅朵綋闂儊 (鍛ㄦ湡 1.5s)
  const breathCrystal = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 1.5);

  switch (slug) {
    case 'eater_of_worlds':
      // 瀹屽叏闈欐€? 涓嶅姞鏁堟灉
      return { dx: 0, dy: 0, brightness: 1.0, eyePulse: 0, eyeColorMatch: null };
    case 'destroyer':
      // 鏈烘锠曡櫕: 绾㈢溂鍍忕礌鑴夊啿 (鏈烘绾?RGB 鈮?FF3333), 涓嶄綅绉?
      return {
        dx: 0,
        dy: 0,
        brightness: 1.0,
        eyePulse: flashFast,
        eyeColorMatch: (r, g, b) => r > 180 && g < 100 && b < 100,
      };
    case 'skeletron':
      // 瀹屽叏闈欐€? 涓嶅姞鏁堟灉
      return { dx: 0, dy: 0, brightness: 1.0, eyePulse: 0, eyeColorMatch: null };
    case 'golem':
      // 鐪奸儴绾㈡鑴夊啿 (璺熶箣鍓嶄竴鑷?
      return {
        dx: 0, dy: 0, brightness: 1.0,
        eyePulse: breathMid,
        eyeColorMatch: (r, g, b) => r > 200 && g > 60 && g < 200 && b < 80,
      };
    case 'solar_pillar':
      // 绾㈡鑳介噺鏌? 鏁翠綋浜害 0.85..1.05
      return { dx: 0, dy: 0, brightness: 0.85 + 0.20 * breathSlow, eyePulse: 0, eyeColorMatch: null };
    case 'nebula_pillar':
      // 绱矇鏄熶簯鏌?
      return { dx: 0, dy: 0, brightness: 0.85 + 0.20 * breathSlow, eyePulse: 0, eyeColorMatch: null };
    case 'stardust_pillar':
      // 钃濈櫧鏄熻景鏌?
      return { dx: 0, dy: 0, brightness: 0.85 + 0.20 * breathSlow, eyePulse: 0, eyeColorMatch: null };
    case 'vortex_pillar':
      // 缁挎丁鑳芥煴
      return { dx: 0, dy: 0, brightness: 0.85 + 0.20 * breathSlow, eyePulse: 0, eyeColorMatch: null };
    default:
      return { dx: 0, dy: 0, brightness: 1.0, eyePulse: 0, eyeColorMatch: null };
  }
}

function applyFx(r, g, b, fx, x, y) {
  let cr = r, cg = g, cb = b;
  // 1) 鏁翠綋浜害
  if (fx.brightness !== 1.0) {
    cr = Math.max(0, Math.min(255, Math.round(cr * fx.brightness)));
    cg = Math.max(0, Math.min(255, Math.round(cg * fx.brightness)));
    cb = Math.max(0, Math.min(255, Math.round(cb * fx.brightness)));
  }
  // 2) 鐪奸儴/鍙戝厜鍍忕礌鑴夊啿 (鍖归厤鍍忕礌棰濆鍔犱寒 30%)
  if (fx.eyePulse > 0 && fx.eyeColorMatch && fx.eyeColorMatch(r, g, b)) {
    const k = 1.0 + 0.3 * fx.eyePulse;
    cr = Math.min(255, Math.round(r * k));
    cg = Math.min(255, Math.round(g * k));
    cb = Math.min(255, Math.round(b * k));
  }
  // 3) 娉ㄥ叆鍙戝厜: 鍦ㄦ寚瀹氬尯鍩熺殑鏆楀儚绱犳贩鍏ュ僵鑹?(鎸?eyePulse 寮哄害娣峰悎)
  if (fx.injectGlow && fx.eyePulse > 0 && fx.injectGlow.match(r, g, b, x, y)) {
    const k = fx.eyePulse;  // 0..1 娣峰悎鏉冮噸
    const [tr, tg, tb] = fx.injectGlow.color;
    cr = Math.round(cr * (1 - k) + tr * k);
    cg = Math.round(cg * (1 - k) + tg * k);
    cb = Math.round(cb * (1 - k) + tb * k);
  }
  return [cr, cg, cb];
}

// ============ drawBoss 鈥?璺熸澘杞?drawSpriteAnimFrame 绠楁硶涓ユ牸涓€鑷?============
//
// 鍏ュ弬:
//   targetMap: Map<"x,y", "#hex">  鐩爣鍍忕礌琛?
//   slug: boss key
//   animTimeSec: 鍔ㄧ敾鏃堕棿绉?
//   bgPainter(x, y) 鈫?"#hex"  鑳屾櫙鑹叉煡璇㈠嚱鏁?(鐢ㄤ簬 clear 娈垫摝鍥?
//   userPos: { bossX, bossY }  鐢ㄦ埛 UI 璋冭妭鍚庣殑浣嶇疆, 璺?sprite 鐑樼剻鍧愭爣 dec.x/y 姹傚樊浣滄暣浣撳亸绉?
//
// 娉ㄦ剰:
//   - 鏉胯浇鍍忕礌宸叉槸灞忓箷缁濆鍧愭爣 (0..63), 涓嶅啀璧?scale/center
//   - 璺熸澘杞?drawSpriteAnimFrame 涓€鏍? 鍏堢敾 base, 鍐?clear (鐢昏儗鏅?, 鍐?set
//   - 闈欐€?boss (frameCount=1) 璧板悗澶勭悊 fx; 澶氬抚 boss 鐢?sprite 鑷韩鍔ㄧ敾
export function drawBoss(targetMap, slug, animTimeSec, bgPainter, userPos) {
  if (!slug) return;
  const dec = decodeBoss(slug);
  if (!dec) return;

  const tick = (animTimeSec || 0) * 60;
  const frameCount = Math.max(1, dec.frameCount);
  const frameIdx = Math.floor(tick / 9) % frameCount;

  // 鍚庡鐞?fx 閫傜敤鑼冨洿:
  //   闈欐€?boss: 鍏ㄩ儴渚濊禆 fx 鍔犲姩鏁?(鏌卞瓙/涓栫晫鍚炲櫖鑰呯瓑)
  //   澶氬抚 boss: queen_slime 绛夊皯鏁颁篃鍙犲姞 fx (鏅朵綋鑴夊啿), 涓嶅奖鍝?sprite 鑷韩鍔ㄧ敾
  const fx = getBossDynamicFx(slug, animTimeSec || 0);
  const hasFx = (fx.brightness !== 1.0 || fx.eyePulse > 0 || fx.dx !== 0 || fx.dy !== 0 || fx.injectGlow);

  // 鐢ㄦ埛浣嶇疆鍋忕Щ (UI 璋?bossX/Y 璺?sprite 鐑樼剻鍧愭爣鐨勫樊)
  let userDx = 0, userDy = 0;
  if (userPos && typeof userPos.bossX === 'number' && typeof userPos.bossY === 'number') {
    userDx = userPos.bossX - dec.x;
    userDy = userPos.bossY - dec.y;
  }
  const totalDx = fx.dx + userDx;
  const totalDy = fx.dy + userDy;

  const writePixel = (x, y, r, g, b) => {
    if (shouldDropPixel(slug, r, g, b)) return;
    let cr = r, cg = g, cb = b;
    if (hasFx) [cr, cg, cb] = applyFx(r, g, b, fx, x, y);
    const px = x + totalDx, py = y + totalDy;
    if (px < 0 || px >= 64 || py < 0 || py >= 64) return;
    const hex = '#' + ((cr << 16) | (cg << 8) | cb).toString(16).padStart(6, '0');
    targetMap.set(`${px},${py}`, hex);
  };

  // 1) 鐢?base
  for (const px of dec.base.set) {
    writePixel(px.x, px.y, px.r, px.g, px.b);
  }

  // 2) 鐢?delta (frame > 0)
  if (frameIdx > 0 && frameIdx - 1 < dec.deltas.length) {
    const delta = dec.deltas[frameIdx - 1];
    if (typeof bgPainter === 'function') {
      for (const px of delta.clear) {
        const cx = px.x + totalDx, cy = px.y + totalDy;
        if (cx < 0 || cx >= 64 || cy < 0 || cy >= 64) continue;
        const hex = bgPainter(cx, cy);
        if (hex) targetMap.set(`${cx},${cy}`, hex);
        else targetMap.delete(`${cx},${cy}`);
      }
    } else {
      for (const px of delta.clear) {
        const cx = px.x + totalDx, cy = px.y + totalDy;
        targetMap.delete(`${cx},${cy}`);
      }
    }
    for (const px of delta.set) {
      writePixel(px.x, px.y, px.r, px.g, px.b);
    }
  }
}
