const d = require('./uniapp/static/terraria/summon_guardian.js');
const g = d['projectile_623'];
console.log('w/h:', g.w, g.h);
console.log('frameCount:', g.frameCount);
console.log('fmt:', g.fmt);
console.log('base set count:', g.base.n);
console.log('deltas array length:', g.deltas.length);
for (let i = 0; i < g.deltas.length; i++) {
  const dd = g.deltas[i];
  console.log('  delta[' + i + '] set=' + dd.n + ' clear=' + (dd.cN || 0));
}
// 解码 delta3 set 像素,看坐标
function decode(b64, n, fmt) {
  const stride = fmt === 7 ? 7 : 5;
  const buf = Buffer.from(b64, 'base64');
  const result = [];
  for (let i = 0; i < n; i++) {
    if (fmt === 5) {
      result.push({
        x: buf[i * 5],
        y: buf[i * 5 + 1],
        r: buf[i * 5 + 2],
        g: buf[i * 5 + 3],
        b: buf[i * 5 + 4],
      });
    }
  }
  return result;
}
console.log('\ndelta[3] (set count = 9) pixels:');
const px = decode(g.deltas[3].b, g.deltas[3].n, g.fmt);
for (const p of px) console.log('  (' + p.x + ',' + p.y + ') rgb=' + p.r + ',' + p.g + ',' + p.b);
console.log('\nbase pixels y range (sprite is 29x25):');
const basePx = decode(g.base.b, g.base.n, g.fmt);
const ys = basePx.map(p => p.y);
console.log('  base y min/max:', Math.min(...ys), '/', Math.max(...ys));
const xs = basePx.map(p => p.x);
console.log('  base x min/max:', Math.min(...xs), '/', Math.max(...xs));
