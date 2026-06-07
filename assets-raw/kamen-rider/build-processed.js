const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const manifestPath = path.join(__dirname, "rider-manifest.json");
const sourceRoot = path.join(__dirname, "source");
const processedRoot = path.join(__dirname, "processed");
const metaPath = path.join(__dirname, "processed-meta.json");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function buildProcessed(entry) {
  const sourcePath = path.join(sourceRoot, entry.era, `${entry.slug}.png`);
  const outputDir = path.join(processedRoot, entry.era);
  const outputPath = path.join(outputDir, `${entry.slug}.png`);
  ensureDir(outputDir);

  const image = sharp(sourcePath);
  const metadata = await image.metadata();
  const trimResult = await image.clone().trim().png().toBuffer({ resolveWithObject: true });
  const trimmedWidth = trimResult.info.width;
  const trimmedHeight = trimResult.info.height;
  const trimLeft = trimResult.info.trimOffsetLeft || 0;
  const trimTop = trimResult.info.trimOffsetTop || 0;
  const bustHeight = Math.max(1, Math.min(trimmedHeight, Math.round(trimmedHeight * 0.62)));

  await sharp(trimResult.data)
    .extract({
      left: 0,
      top: 0,
      width: trimmedWidth,
      height: bustHeight,
    })
    .png()
    .toFile(outputPath);

  return {
    slug: entry.slug,
    era: entry.era,
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    trimLeft,
    trimTop,
    trimmedWidth,
    trimmedHeight,
    processedWidth: trimmedWidth,
    processedHeight: bustHeight,
    processedPath: path.relative(__dirname, outputPath).replace(/\\/g, "/"),
  };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const processedMeta = [];

  for (const entry of manifest) {
    processedMeta.push(await buildProcessed(entry));
  }

  fs.writeFileSync(metaPath, JSON.stringify(processedMeta, null, 2), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
