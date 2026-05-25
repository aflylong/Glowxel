// 用 git show 直接 buffer 写, 避免 PowerShell UTF-16 BOM 污染
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const COMMIT = '8e5a6de';
const FILES = [
  // store
  ['stores/deviceLegacy.js', 'website/src/stores/device.js'],
  // utils
  ...[
    'device-clock-core', 'device-clock-presets', 'device-mode-clock', 'device-mode-core',
    'device-mode-gif-player', 'device-mode-planet', 'device-mode-spirit',
    'device-mode-tetris-clock', 'device-mode-transport', 'device-mode-water-world',
  ].map(n => [`utils/${n}.js`, `website/src/utils/${n}.js`]),
  ['utils/deviceWebSocket.js', 'website/src/utils/deviceWebSocket.js'],
  // components/device/**
  ...[
    'device/DeviceConnectModal.vue',
    'device/DeviceControlConsole.vue',
    'device/DeviceIcon.vue',
    'device/DeviceSendingOverlay.vue',
    'device/clock/ClockFontSelector.vue',
    'device/clock/ClockImageSettingsSection.vue',
    'device/clock/ClockPixelCanvas.vue',
    'device/clock/ClockStandardEditor.vue',
    'device/clock/ClockTextSettingsSection.vue',
    'device/clock/ClockThemeEditor.vue',
    'device/clock/ClockThemePresetGrid.vue',
    'device/modes/DeviceClockSettingsSection.vue',
    'device/modes/DeviceColorSwatches.vue',
    'device/modes/DeviceModeStepper.vue',
    'device/modes/DeviceModeTabs.vue',
    'device/modes/DevicePixelBoard.vue',
    'device/modes/GameModeColorField.vue',
    'device/modes/GameModeFontSelector.vue',
    'device/params/DeviceActionCard.vue',
    'device/params/DeviceBrightnessField.vue',
    'device/params/DeviceParamsField.vue',
    'device/params/DeviceParamsSection.vue',
    'device/params/DeviceSetupStep.vue',
  ].map(rel => [`components/${rel}`, `website/src/components/${rel}`]),
];

for (const [dstSubpath, srcGitPath] of FILES) {
  const dst = path.resolve('src', dstSubpath);
  try {
    const buf = execSync(`git show ${COMMIT}:${srcGitPath}`, {
      cwd: path.resolve('..'),
      encoding: 'buffer',
      maxBuffer: 50 * 1024 * 1024,
    });
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, buf);
    console.log(`restored: ${dstSubpath} (${buf.length}B)`);
  } catch (e) {
    console.warn(`SKIP ${srcGitPath}: ${e.message.split('\n')[0]}`);
  }
}
