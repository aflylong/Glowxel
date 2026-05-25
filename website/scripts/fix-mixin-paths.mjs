import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('src/mixins/clock-editor');
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.js')) continue;
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  const orig = c;
  // ../../../utils/X.js → @/utils/X.js
  c = c.replace(/from\s+(["'])\.\.\/\.\.\/\.\.\/utils\//g, 'from $1@/utils/');
  // ../../../store/X.js → @/stores/X.js
  c = c.replace(/from\s+(["'])\.\.\/\.\.\/\.\.\/store\//g, 'from $1@/stores/');
  if (c !== orig) {
    fs.writeFileSync(p, c, 'utf8');
    console.log('fixed:', f);
  }
}
