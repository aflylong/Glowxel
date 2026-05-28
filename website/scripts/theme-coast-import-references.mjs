// 把 reference_assets/ocean-and-clouds 下 8 张合成图(各文件夹里最大那张)
// 缩到 64×64 输出到 src/assets/theme-coast/ref/Ocean_N.png
// 用 nearest-neighbor 缩放, 不抖动 -- 跟 LED 屏点对点显示一致
//
// 注意:
//   - 这一步只是把素材"导入到我们要的 64×64 画布"
//   - 不裁切, 不补边, 不调色, 直接最近邻硬缩
//   - 保留宽高比: 选 fit 模式 (按短边对齐, 长边裁中间) 让画面填满 64×64

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_ROOT = path.resolve(ROOT, '../reference_assets/ocean-and-clouds')
const OUT_DIR = path.resolve(ROOT, 'src/assets/theme-coast/ref')

if (!fs.existsSync(SRC_ROOT)) {
  console.error('source not found:', SRC_ROOT)
  process.exit(1)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

// 在每个 Ocean_N 文件夹里挑"最大体积的 png"作为合成图
function pickComposite(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png'))
  if (files.length === 0) return null
  let best = null
  let bestSize = -1
  for (const f of files) {
    const fp = path.join(dir, f)
    const s = fs.statSync(fp).size
    if (s > bestSize) {
      bestSize = s
      best = fp
    }
  }
  return best
}

// 读 PNG → { w, h, rgba: Uint8Array(w*h*4) }
function readPng(filePath) {
  const buf = fs.readFileSync(filePath)
  const png = PNG.sync.read(buf)
  return { w: png.width, h: png.height, rgba: png.data }
}

// 中心裁剪到目标宽高比, 然后 nearest-neighbor 缩到 size×size
function fitCrop(src, size) {
  const { w: sw, h: sh, rgba } = src
  // 选最长正方形居中裁
  const cropSide = Math.min(sw, sh)
  const cropX = Math.floor((sw - cropSide) / 2)
  const cropY = Math.floor((sh - cropSide) / 2)

  const out = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    const sy = cropY + Math.floor((y * cropSide) / size)
    for (let x = 0; x < size; x += 1) {
      const sx = cropX + Math.floor((x * cropSide) / size)
      const sIdx = (sy * sw + sx) * 4
      const dIdx = (y * size + x) * 4
      out[dIdx] = rgba[sIdx]
      out[dIdx + 1] = rgba[sIdx + 1]
      out[dIdx + 2] = rgba[sIdx + 2]
      out[dIdx + 3] = rgba[sIdx + 3]
    }
  }
  return { w: size, h: size, rgba: out }
}

function writePng(filePath, img) {
  const png = new PNG({ width: img.w, height: img.h })
  png.data = Buffer.from(img.rgba)
  fs.writeFileSync(filePath, PNG.sync.write(png))
}

const folders = fs
  .readdirSync(SRC_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.toLowerCase().startsWith('ocean_'))
  .map((d) => d.name)
  .sort((a, b) => {
    const na = parseInt(a.split('_')[1], 10)
    const nb = parseInt(b.split('_')[1], 10)
    return na - nb
  })

console.log(`processing ${folders.length} folders → 64×64 PNG`)
const results = []
for (const name of folders) {
  const src = pickComposite(path.join(SRC_ROOT, name))
  if (!src) {
    console.warn(`  ${name}: skip (no png)`)
    continue
  }
  const img = readPng(src)
  const small = fitCrop(img, 64)
  const outFile = path.join(OUT_DIR, `${name}.png`)
  writePng(outFile, small)
  console.log(`  ${name}: ${img.w}×${img.h} → 64×64 (from ${path.basename(src)})`)
  results.push({ name, source: path.basename(src), originW: img.w, originH: img.h })
}

// 顺便写一份 index.json 给前端用
const indexPath = path.join(OUT_DIR, 'index.json')
fs.writeFileSync(
  indexPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), items: results }, null, 2),
  'utf8',
)
console.log(`wrote ${OUT_DIR} (${results.length} pngs + index.json)`)
