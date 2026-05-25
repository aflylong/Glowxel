import fs from 'node:fs'
const FILES = [
  'src/views/mobile/Clock.vue',
  'src/views/mobile/AnimationClock.vue',
  'src/views/mobile/ThemeClock.vue',
]
for (const f of FILES) {
  let c = fs.readFileSync(f, 'utf8')
  c = c.replaceAll('@/mixins/clock-editor/.js', '@/mixins/clock-editor/clockPreviewMixin.js')
  // 但是上面会把所有三个都替换成 clockPreviewMixin，所以分开按变量名做
  // 重新读
  c = fs.readFileSync(f, 'utf8')
  c = c.replace(/import clockPreviewMixin from "[^"]*";/, 'import clockPreviewMixin from "@/mixins/clock-editor/clockPreviewMixin.js";')
  c = c.replace(/import imageGifMixin from "[^"]*";/, 'import imageGifMixin from "@/mixins/clock-editor/imageGifMixin.js";')
  c = c.replace(/import deviceSyncMixin from "[^"]*";/, 'import deviceSyncMixin from "@/mixins/clock-editor/deviceSyncMixin.js";')
  fs.writeFileSync(f, c, 'utf8')
  console.log('fixed', f)
}
