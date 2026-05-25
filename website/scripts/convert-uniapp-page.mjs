#!/usr/bin/env node
// uniapp page → website view 转换器
// 用法: node scripts/convert-uniapp-page.mjs <uniapp-page-file> <website-view-file>
// 例:  node scripts/convert-uniapp-page.mjs ../uniapp/pages/maze-mode/maze-mode.vue src/views/MazeMode.vue
//
// 转换规则:
// 1. uniapp 编译指令注释 <!-- #ifdef ... --> ... <!-- #endif --> 整段删除 (web 没条件编译)
// 2. <view> → <div>, <text> → <span>, <scroll-view> → <div class="scroll-view">
// 3. <image> → <img>
// 4. import 路径调整: ../../components/X.vue → @/components/uni/X.vue 等
// 5. uni.navigateBack/navigateTo 保持不变 (走 uni-shim)
// 6. rpx → calc((100vw / 750) * Nrpx) — 实际用 CSS 全局 var

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('用法: node convert-uniapp-page.mjs <input.vue> <output.vue>');
  process.exit(1);
}

const [inputPath, outputPath] = args;
let src = fs.readFileSync(inputPath, 'utf8');

// ===== 1. 删除 uniapp 编译指令注释段 =====
//   <!-- #ifdef MP-WEIXIN -->...<!-- #endif --> 整段去掉
//   <!-- #ifndef H5 -->...<!-- #endif --> 整段去掉  (web 端不用)
//   保留 <!-- #ifdef H5 --> 内的 (改成普通注释段)
src = src.replace(/<!--\s*#ifdef\s+MP-WEIXIN\s*-->[\s\S]*?<!--\s*#endif\s*-->/g, '');
src = src.replace(/<!--\s*#ifndef\s+H5\s*-->[\s\S]*?<!--\s*#endif\s*-->/g, '');
src = src.replace(/<!--\s*#ifdef\s+H5\s*-->/g, '');
src = src.replace(/<!--\s*#ifdef\s+APP-PLUS\s*-->[\s\S]*?<!--\s*#endif\s*-->/g, '');
src = src.replace(/<!--\s*#endif\s*-->/g, '');

// ===== 2. JS 端编译指令 (不太常见, 万一有) =====
src = src.replace(/\/\/\s*#ifdef\s+MP-WEIXIN[\s\S]*?\/\/\s*#endif/g, '');
src = src.replace(/\/\/\s*#ifndef\s+H5[\s\S]*?\/\/\s*#endif/g, '');
src = src.replace(/\/\/\s*#ifdef\s+H5\s*\n/g, '');
src = src.replace(/\/\/\s*#endif\s*\n/g, '');

// ===== 3. 标签替换 (template 区域) =====
//   注意: 只在 <template> 内做, 不动 <script> 和 <style>
function replaceTemplateOnly(text, replacer) {
  return text.replace(/(<template[\s\S]*?<\/template>)/g, (match) => replacer(match));
}

src = replaceTemplateOnly(src, (tpl) => {
  return tpl
    // 自闭合: <view ... /> → <div ... />
    .replace(/<view\b/g, '<div')
    .replace(/<\/view\s*>/g, '</div>')
    .replace(/<text\b/g, '<span')
    .replace(/<\/text\s*>/g, '</span>')
    .replace(/<scroll-view\b/g, '<div data-scroll-view')
    .replace(/<\/scroll-view\s*>/g, '</div>')
    .replace(/<image\b/g, '<img')
    .replace(/<\/image\s*>/g, '');
});

// ===== 4. import 路径调整 =====
const pathMap = [
  // components
  [/from\s+["']\.\.\/\.\.\/components\/(.+?)\.vue["']/g, 'from "@/components/uni/$1.vue"'],
  // utils
  [/from\s+["']\.\.\/\.\.\/utils\/(.+?)\.js["']/g, 'from "@/utils/$1.js"'],
  [/from\s+["']\.\.\/\.\.\/utils\/(.+?)["']/g, 'from "@/utils/$1"'],
  // store -> stores
  [/from\s+["']\.\.\/\.\.\/store\/(.+?)\.js["']/g, 'from "@/stores/$1.js"'],
  // mixins
  [/from\s+["']\.\.\/\.\.\/mixins\/(.+?)\.js["']/g, 'from "@/mixins/$1.js"'],
  // composables
  [/from\s+["']\.\.\/\.\.\/composables\/(.+?)\.js["']/g, 'from "@/composables/$1.js"'],
  // api
  [/from\s+["']\.\.\/\.\.\/api\/(.+?)["']/g, 'from "@/api/$1"'],
];

for (const [re, replacement] of pathMap) {
  src = src.replace(re, replacement);
}

// ===== 5. 头部加注释说明 =====
const banner = `<!-- AUTO-CONVERTED FROM uniapp/${inputPath.replace(/\\/g, '/').replace(/.*\/uniapp\//, '')} -->\n`;
src = banner + src;

// ===== 写出 =====
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, src);

console.log(`[converted] ${inputPath} → ${outputPath}`);
console.log(`  size: ${src.length} bytes`);
