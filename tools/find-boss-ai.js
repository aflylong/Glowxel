// 在 NPC.cs 的 SetDefaults 区里找各 boss 的 aiStyle 赋值
const fs = require('fs');
const path = require('path');

const NPC_CS = 'D:/project/Pokemon/terraria-clock-preview/terraria-glowxel-1456/_src_1456/Terraria/NPC.cs';
const ids = [
  { id: 13, name: 'EaterofWorldsHead' },
  { id: 14, name: 'EaterofWorldsBody' },
  { id: 15, name: 'EaterofWorldsTail' },
  { id: 35, name: 'SkeletronHead' },
  { id: 36, name: 'SkeletronHand' },
  { id: 127, name: 'SkeletronPrime' },
  { id: 134, name: 'TheDestroyer' },
  { id: 135, name: 'TheDestroyerBody' },
  { id: 136, name: 'TheDestroyerTail' },
  { id: 245, name: 'Golem' },
  { id: 246, name: 'GolemHead' },
  { id: 247, name: 'GolemFist' },
  { id: 422, name: 'LunarTowerVortex' },
  { id: 493, name: 'LunarTowerStardust' },
  { id: 507, name: 'LunarTowerNebula' },
  { id: 517, name: 'LunarTowerSolar' },
];

const lines = fs.readFileSync(NPC_CS, 'utf8').split(/\r?\n/);

const out = [];
for (const e of ids) {
  // 找 case ID:，在 8000-17500 行范围（SetDefaults 段）
  for (let i = 8000; i < 17500 && i < lines.length; i++) {
    const m = lines[i].match(/^\s*case\s+(\d+)\s*:\s*$/);
    if (m && parseInt(m[1], 10) === e.id) {
      // 找该 case 后面到下一个 break 之间的所有 aiStyle = N
      let aiStyle = null;
      for (let j = i + 1; j < Math.min(i + 100, lines.length); j++) {
        const m2 = lines[j].match(/aiStyle\s*=\s*(\d+)/);
        if (m2) { aiStyle = parseInt(m2[1], 10); break; }
        if (/^\s*break;/.test(lines[j])) break;
        if (/^\s*case\s+\d+/.test(lines[j]) && j !== i + 1) break;
      }
      // 也找 frame 数和 framecount
      let totalFrames = null;
      for (let j = i + 1; j < Math.min(i + 200, lines.length); j++) {
        const m3 = lines[j].match(/Main\.npcFrameCount\[type\]\s*=\s*(\d+)/);
        if (m3) { totalFrames = parseInt(m3[1], 10); break; }
        if (/^\s*break;/.test(lines[j])) break;
        if (/^\s*case\s+\d+/.test(lines[j]) && j !== i + 1) break;
      }
      out.push({ ...e, aiStyle, frameCount: totalFrames, caseLine: i + 1 });
      break;
    }
  }
}

console.log(JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(__dirname, 'find-boss-ai-result.json'), JSON.stringify(out, null, 2));
