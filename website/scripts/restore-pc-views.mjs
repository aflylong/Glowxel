// 用 child_process exec 让 git show 输出 UTF-8, 写到目标文件
// 避免 PowerShell `> file` 默认 UTF-16 BOM 编码污染
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const COMMIT = '8e5a6de';
const PC_FILES = [
  'AnimationClock', 'BleConfig', 'CanvasEditor', 'Clock', 'DeviceControl',
  'DeviceModePage', 'DeviceParams', 'GifPlayer', 'LedMatrix', 'MazeMode',
  'PlanetScreensaver', 'SnakeMode', 'SpiritScreen', 'TetrisClockSettings',
  'TetrisSettings', 'ThemeClock', 'WaterWorld',
];

for (const f of PC_FILES) {
  const dst = path.resolve('src/views', f + '.vue');
  try {
    const buf = execSync(`git show ${COMMIT}:website/src/views/${f}.vue`, {
      cwd: path.resolve('..'),  // glowxel root (because website/.. is glowxel)
      encoding: 'buffer',
      maxBuffer: 50 * 1024 * 1024,
    });
    // git show 输出是 UTF-8 buffer, 直接写出
    fs.writeFileSync(dst, buf);
    console.log(`restored: ${f}.vue (${buf.length} bytes)`);
  } catch (e) {
    console.warn(`SKIP ${f}: ${e.message}`);
  }
}
