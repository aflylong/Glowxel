import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const rootDir = path.resolve(import.meta.dirname, '../..');
const sourceDir = path.resolve(rootDir, 'assets-raw/spongebob');
const outputDir = path.resolve(rootDir, 'website/public/spongebob');

function readCharacterData() {
  const source = fs.readFileSync(path.join(sourceDir, 'character-frame-pixels.js'), 'utf8');
  const marker = 'window.SPONGEBOB_CHARACTER_FRAMES = ';
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error('SPONGEBOB_CHARACTER_FRAMES marker not found');
  }
  const jsonText = source.slice(start + marker.length).replace(/;\s*$/, '');
  return JSON.parse(jsonText);
}

function readTimefontData() {
  const source = fs.readFileSync(path.join(sourceDir, 'timefont-pixels.js'), 'utf8');
  const sandbox = { window: {}, module: { exports: undefined } };
  vm.runInNewContext(source, sandbox, { filename: 'timefont-pixels.js' });
  if (sandbox.window.SPONGEBOB_TIMEFONT) {
    return sandbox.window.SPONGEBOB_TIMEFONT;
  }
  if (sandbox.module.exports) {
    return sandbox.module.exports;
  }
  throw new Error('SPONGEBOB_TIMEFONT export not found');
}

function readCodexPetData() {
  const source = fs.readFileSync(path.join(sourceDir, 'codex-pet/codex-pet-frames.json'), 'utf8');
  return JSON.parse(source);
}

function assertCoverage(characterData, timefontData, codexPetData) {
  const characters = Object.keys(characterData.characters);
  if (characters.length !== 2) {
    throw new Error(`expected 2 characters, got ${characters.length}`);
  }
  for (const character of ['spongebob', 'patrick']) {
    const item = characterData.characters[character];
    if (!item) {
      throw new Error(`missing character: ${character}`);
    }
    if (!Array.isArray(item.actionOrder) || item.actionOrder.length === 0) {
      throw new Error(`missing action order: ${character}`);
    }
  }
  const forbiddenActions = [
    ['spongebob', 'jump'],
    ['patrick', 'jump'],
    ['patrick', 'dance5'],
  ];
  for (const [character, action] of forbiddenActions) {
    const item = characterData.characters[character];
    if (item.actions[action] || item.actionOrder.includes(action)) {
      throw new Error(`forbidden action exported: ${character}/${action}`);
    }
  }
  for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
    const glyph = timefontData.digits[digit];
    if (!glyph || !Array.isArray(glyph.rows) || glyph.rows.length === 0) {
      throw new Error(`missing timefont digit: ${digit}`);
    }
  }
  for (const state of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
    const item = codexPetData.states[state];
    if (!item || !Array.isArray(item.frames) || item.frames.length === 0) {
      throw new Error(`missing codex pet state: ${state}`);
    }
  }
}

const characterData = readCharacterData();
const timefontData = readTimefontData();
const codexPetData = readCodexPetData();
assertCoverage(characterData, timefontData, codexPetData);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'character-frame-pixels.json'),
  `${JSON.stringify(characterData)}\n`,
  'utf8'
);
fs.writeFileSync(
  path.join(outputDir, 'timefont-pixels.json'),
  `${JSON.stringify(timefontData)}\n`,
  'utf8'
);
fs.writeFileSync(
  path.join(outputDir, 'codex-pet-frames.json'),
  `${JSON.stringify(codexPetData)}\n`,
  'utf8'
);

console.log(`exported: ${path.join(outputDir, 'character-frame-pixels.json')}`);
console.log(`exported: ${path.join(outputDir, 'timefont-pixels.json')}`);
console.log(`exported: ${path.join(outputDir, 'codex-pet-frames.json')}`);
