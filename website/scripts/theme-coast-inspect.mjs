// 仔细分析 reference_assets/ocean-and-clouds 下每张 PNG
//
// 输出: scripts/_theme-coast-inspect/inspect.html
//   每个文件夹一行: 列出所有 PNG, 显示
//     - 原图 (用 <img> 直接展示, 浏览器自己处理)
//     - 宽高
//     - 是否有 alpha
//     - 不透明像素占比 (alpha > 0)
//     - 全不透明像素占比 (alpha = 255)
//     - 主色 (top 5)
//     - 缩到 64×64 后的硬缩预览 (nearest)
//
// 仅分析, 不改任何业务代码.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_ROOT = path.resolve(ROOT, '../reference_assets/ocean-and-clouds')
const OUT_DIR = path.resolve(__dirname, '_theme-coast-inspect')

if (!fs.existsSync(SRC_ROOT)) {
  console.error('source not found:', SRC_ROOT)
  process.exit(1)
}
fs.mkdirSync(OUT_DIR, { recursive: true })

function readPng(filePath) {
  const buf = fs.readFileSync(filePath)
  const png = PNG.sync.read(buf)
  return { w: png.width, h: png.height, rgba: png.data }
}

// 把图缩到 64×64, 保持比例 (按宽对齐, 高按比例缩, 上下居中, 透明填充)
// 跟最终我们要在 64×64 屏上"等比缩放"显示的方式一致
function scaleToFitWidth(src, targetSize) {
  const { w: sw, h: sh, rgba } = src
  // 按宽缩, 高度按比例
  const scale = targetSize / sw
  const newH = Math.round(sh * scale)
  const out = new Uint8Array(targetSize * targetSize * 4) // 默认全透明 (0)
  // 居中: y0 是新图在画布里的起始 y
  const y0 = Math.max(0, Math.floor((targetSize - newH) / 2))
  for (let y = 0; y < newH && y0 + y < targetSize; y += 1) {
    const sy = Math.min(sh - 1, Math.floor(y / scale))
    const dy = y0 + y
    for (let x = 0; x < targetSize; x += 1) {
      const sx = Math.min(sw - 1, Math.floor(x / scale))
      const sIdx = (sy * sw + sx) * 4
      const dIdx = (dy * targetSize + x) * 4
      out[dIdx] = rgba[sIdx]
      out[dIdx + 1] = rgba[sIdx + 1]
      out[dIdx + 2] = rgba[sIdx + 2]
      out[dIdx + 3] = rgba[sIdx + 3]
    }
  }
  return { w: targetSize, h: targetSize, rgba: out, contentH: newH, paddingY: y0 }
}

function pngToBase64(img) {
  const png = new PNG({ width: img.w, height: img.h })
  png.data = Buffer.from(img.rgba)
  const buf = PNG.sync.write(png)
  return 'data:image/png;base64,' + buf.toString('base64')
}

// 抽 top N 主色 (量化到 6bit/channel 后频次排序)
function topColors(rgba, topN = 5) {
  const map = new Map()
  let opaqueCount = 0
  let transparentCount = 0
  let semiCount = 0
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3]
    if (a === 0) { transparentCount += 1; continue }
    if (a < 255) { semiCount += 1 }
    else { opaqueCount += 1 }
    // 量化
    const r = (rgba[i] >> 2) << 2
    const g = (rgba[i + 1] >> 2) << 2
    const b = (rgba[i + 2] >> 2) << 2
    const key = (r << 16) | (g << 8) | b
    map.set(key, (map.get(key) || 0) + 1)
  }
  const total = opaqueCount + semiCount
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN)
  const colors = sorted.map(([k, count]) => {
    const r = (k >> 16) & 0xff
    const g = (k >> 8) & 0xff
    const b = k & 0xff
    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
    return { hex, ratio: total > 0 ? count / total : 0 }
  })
  return { colors, opaqueCount, semiCount, transparentCount }
}

const folders = fs
  .readdirSync(SRC_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.toLowerCase().startsWith('ocean_'))
  .map((d) => d.name)
  .sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))

const sections = []
for (const name of folders) {
  const dir = path.join(SRC_ROOT, name)
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort((a, b) => {
    // 数字优先排序
    const na = parseInt(a)
    const nb = parseInt(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })
  const items = []
  for (const f of files) {
    const fp = path.join(dir, f)
    const img = readPng(fp)
    const colors = topColors(img.rgba, 6)
    const total = img.w * img.h
    const opaqueRatio = colors.opaqueCount / total
    const transparentRatio = colors.transparentCount / total
    const semiRatio = colors.semiCount / total
    const scaled = scaleToFitWidth(img, 64)
    items.push({
      file: f,
      w: img.w,
      h: img.h,
      origDataUrl: pngToBase64(img),  // 原图
      scaledDataUrl: pngToBase64(scaled), // 64×64 等比缩放
      contentH: scaled.contentH,
      opaqueRatio,
      transparentRatio,
      semiRatio,
      colors: colors.colors,
    })
  }
  sections.push({ name, items })
}

// 渲染 HTML
function pct(x) { return (x * 100).toFixed(1) + '%' }

const css = `
body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: #1e1e1e; color: #e0e0e0; padding: 24px; }
h1 { color: #fff; }
h2 { color: #ffcb45; margin-top: 32px; padding-top: 16px; border-top: 1px solid #444; }
.row { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.card { background: #2a2a2a; padding: 12px; border: 1px solid #444; }
.card h3 { color: #fff; margin: 0 0 8px; font-size: 14px; }
.imgs { display: flex; gap: 12px; align-items: flex-start; margin: 8px 0; }
.imgs > div { display: flex; flex-direction: column; gap: 4px; align-items: center; font-size: 11px; color: #888; }
.thumb {
  background-image: linear-gradient(45deg, #404040 25%, transparent 25%),
                    linear-gradient(-45deg, #404040 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #404040 75%),
                    linear-gradient(-45deg, transparent 75%, #404040 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
  background-color: #303030;
}
.orig { width: 256px; height: auto; image-rendering: pixelated; }
.scaled64 { width: 256px; height: 256px; image-rendering: pixelated; }
.meta { font-size: 12px; line-height: 1.6; }
.meta b { color: #ffcb45; }
.colors { display: flex; gap: 2px; margin-top: 4px; flex-wrap: wrap; }
.swatch { width: 32px; height: 24px; border: 1px solid #555; font-size: 9px; color: #fff; text-shadow: 0 0 2px #000; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 1px; }
`

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ocean 素材分析</title><style>${css}</style></head>
<body>
<h1>Ocean 素材分层分析 (${folders.length} 个文件夹)</h1>
<p style="color: #aaa">每个 PNG 显示: 原图 + 64×64 等比硬缩 (按宽缩, 上下透明填充)。透明区是棋盘格背景。</p>

${sections.map((sec) => `
<h2>${sec.name}</h2>
<div class="row">
  ${sec.items.map((it) => `
  <div class="card">
    <h3>${it.file} <span style="color:#888;font-weight:normal;font-size:11px">${it.w}×${it.h}</span></h3>
    <div class="imgs">
      <div>
        <img class="orig thumb" src="${it.origDataUrl}" alt="orig">
        <span>原图</span>
      </div>
      <div>
        <img class="scaled64 thumb" src="${it.scaledDataUrl}" alt="64x64">
        <span>等比缩到 64×64</span>
      </div>
    </div>
    <div class="meta">
      <div><b>不透明像素</b> ${pct(it.opaqueRatio)} (a=255)</div>
      <div><b>半透明像素</b> ${pct(it.semiRatio)} (0&lt;a&lt;255)</div>
      <div><b>全透明像素</b> ${pct(it.transparentRatio)} (a=0)</div>
      <div><b>主色 (top 6):</b></div>
      <div class="colors">
        ${it.colors.map((c) => `<div class="swatch" style="background:${c.hex}">${pct(c.ratio).replace('.0','')}</div>`).join('')}
      </div>
    </div>
  </div>
  `).join('')}
</div>
`).join('')}

</body></html>`

const htmlPath = path.join(OUT_DIR, 'inspect.html')
fs.writeFileSync(htmlPath, html, 'utf8')
console.log('wrote', htmlPath)
console.log('total folders', sections.length)
console.log('total pngs', sections.reduce((s, x) => s + x.items.length, 0))
