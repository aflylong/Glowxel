// 把 components/uni/**/*.vue 里的 <view> <text> <scroll-view> <image> 转成 web 标准标签
// (跟 convert-uniapp-page.mjs 同样规则, 但只在 <template> 内做)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/components/uni');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.vue')) out.push(p);
  }
  return out;
}

function convert(src) {
  return src.replace(/(<template[\s\S]*?<\/template>)/g, (tpl) => {
    return tpl
      .replace(/<view\b/g, '<div')
      .replace(/<\/view\s*>/g, '</div>')
      .replace(/<text\b/g, '<span')
      .replace(/<\/text\s*>/g, '</span>')
      .replace(/<scroll-view\b/g, '<div data-scroll-view')
      .replace(/<\/scroll-view\s*>/g, '</div>')
      .replace(/<image\b/g, '<img')
      .replace(/<\/image\s*>/g, '');
  });
}

let touched = 0;
for (const f of walk(ROOT)) {
  const src = fs.readFileSync(f, 'utf8');
  const out = convert(src);
  if (src !== out) {
    fs.writeFileSync(f, out, 'utf8');
    console.log('converted:', path.relative(ROOT, f));
    touched++;
  }
}
console.log(`\ntotal: ${touched} files`);
