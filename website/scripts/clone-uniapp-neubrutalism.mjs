// 把 uniapp 的 styles/neubrutalism-global.css + styles/themes/light.css 转成 web 端 mobile-only 全局样式.
// 关键改动:
//   1. 顶层选择器 `page` → `body.is-mobile-device`
//   2. 所有规则都改成 `body.is-mobile-device <selector>`, 让 PC 版完全不受影响
//   3. rpx 保留, 我们已有 postcss-rpx-to-vw 插件统一转 vw

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_FILES = [
  path.resolve(ROOT, '../uniapp/styles/themes/light.css'),
  path.resolve(ROOT, '../uniapp/styles/theme.css'),
  path.resolve(ROOT, '../uniapp/styles/neubrutalism-global.css'),
  path.resolve(ROOT, '../uniapp/styles/glx-style-system.css'),
]
const OUT_CSS = path.resolve(ROOT, 'src/assets/styles/mobile-neubrutalism.css')

const out = []
out.push('/* AUTO-GENERATED from uniapp/styles/themes/light.css + uniapp/styles/neubrutalism-global.css */')
out.push('/* 移动端独占的 neubrutalism (黑边 + 偏移阴影) 全局样式 */')
out.push('/* 作用域: body.is-mobile-device, PC 版不受影响 */')
out.push('')

for (const SRC_CSS of SRC_FILES) {
  if (!fs.existsSync(SRC_CSS)) {
    console.error('source not found:', SRC_CSS)
    process.exit(1)
  }
  const css = fs.readFileSync(SRC_CSS, 'utf8')
  out.push(`/* ===== ${path.basename(SRC_CSS)} ===== */`)
  out.push(transformCss(css))
  out.push('')
}

function transformCss(css) {
  // 去掉 @import (我们把所有源文件已 inline 进 SRC_FILES 列表)
  css = css.replace(/@import\s+['"][^'"]+['"]\s*;/g, '')
  // 去掉 uniapp 条件编译指令 /* #ifndef MP-WEIXIN */ ... /* #endif */
  css = css.replace(/\/\*\s*#ifndef[^\*]*\*\/[\s\S]*?\/\*\s*#endif\s*\*\//g, '')
  css = css.replace(/\/\*\s*#ifdef[^\*]*\*\/[\s\S]*?\/\*\s*#endif\s*\*\//g, '')
  const result = []
  let i = 0
  const n = css.length
  function skipWs() { while (i < n && /\s/.test(css[i])) i++ }

  while (i < n) {
    skipWs()
    if (i >= n) break

    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      if (end < 0) break
      result.push(css.slice(i, end + 2))
      i = end + 2
      continue
    }

    // @keyframes 等 at-rule, 整块原样保留
    if (css[i] === '@') {
      const braceStart = css.indexOf('{', i)
      if (braceStart < 0) break
      let depth = 1
      let j = braceStart + 1
      while (j < n && depth > 0) {
        if (css[j] === '{') depth++
        else if (css[j] === '}') depth--
        if (depth > 0) j++
      }
      result.push(css.slice(i, j + 1))
      result.push('')
      i = j + 1
      continue
    }

    const braceStart = css.indexOf('{', i)
    if (braceStart < 0) break
    const selectorRaw = css.slice(i, braceStart).trim()
    let depth = 1
    let j = braceStart + 1
    while (j < n && depth > 0) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') depth--
      if (depth > 0) j++
    }
    const body = css.slice(braceStart + 1, j).trim()
    i = j + 1

    if (!selectorRaw) continue

    const selectors = selectorRaw.split(',').map((s) => s.trim()).filter(Boolean)
    const scoped = selectors.map((sel) => {
      if (sel === 'page' || sel === 'body') return 'body.is-mobile-device'
      // ::-webkit-scrollbar 等 pseudo 直接挂在 body 后
      if (sel.startsWith('::')) return `body.is-mobile-device ${sel}`
      return `body.is-mobile-device ${sel}`
    })
    const uniq = Array.from(new Set(scoped))
    result.push(`${uniq.join(',\n')} {\n${body}\n}`)
    result.push('')
  }
  return result.join('\n')
}

const finalText = out.join('\n')
fs.writeFileSync(OUT_CSS, finalText, 'utf8')
console.log('wrote', OUT_CSS, 'bytes', finalText.length)
