const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const manifestPath = path.join(__dirname, "rider-manifest.json");
const sourceRoot = path.join(__dirname, "processed");
const previewRoot = path.join(__dirname, "preview-64");
const boardPath = path.join(__dirname, "preview-board.png");
const boardMetaPath = path.join(__dirname, "preview-board.json");

const CELL_SIZE = 64;
const PADDING = 8;
const LABEL_HEIGHT = 16;
const COLUMNS = 4;
const BACKGROUND = { r: 10, g: 13, b: 18, alpha: 1 };
const CELL_BACKGROUND = { r: 20, g: 24, b: 32, alpha: 1 };

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function buildSinglePreview(rider) {
  const sourcePath = path.join(sourceRoot, rider.era, `${rider.slug}.png`);
  const outputDir = path.join(previewRoot, rider.era);
  const outputPath = path.join(outputDir, `${rider.slug}.png`);
  ensureDir(outputDir);

  const image = sharp(sourcePath, { animated: false });
  const metadata = await image.metadata();
  const fitHeight = Math.max(1, CELL_SIZE - 8);
  const fitWidth = Math.max(1, CELL_SIZE - 8);

  const buffer = await image
    .resize(fitWidth, fitHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      channels: 4,
      background: CELL_BACKGROUND,
    },
  })
    .composite([
      {
        input: buffer,
        gravity: "center",
      },
    ])
    .png()
    .toFile(outputPath);

  return {
    ...rider,
    sourcePath,
    outputPath,
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
  };
}

async function buildBoard(entries) {
  const rows = Math.ceil(entries.length / COLUMNS);
  const boardWidth = PADDING + COLUMNS * (CELL_SIZE + PADDING);
  const boardHeight = PADDING + rows * (CELL_SIZE + LABEL_HEIGHT + PADDING);
  const composites = [];

  for (let index = 0; index < entries.length; index++) {
    const rider = entries[index];
    const row = Math.floor(index / COLUMNS);
    const col = index % COLUMNS;
    const left = PADDING + col * (CELL_SIZE + PADDING);
    const top = PADDING + row * (CELL_SIZE + LABEL_HEIGHT + PADDING);

    composites.push({
      input: fs.readFileSync(rider.outputPath),
      left,
      top,
    });
  }

  await sharp({
    create: {
      width: boardWidth,
      height: boardHeight,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite(composites)
    .png()
    .toFile(boardPath);

  fs.writeFileSync(
    boardMetaPath,
    JSON.stringify(
      entries.map((entry, index) => ({
        index,
        era: entry.era,
        name: entry.name,
        slug: entry.slug,
        previewPath: path.relative(__dirname, entry.outputPath).replace(/\\/g, "/"),
      })),
      null,
      2
    )
  );
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  ensureDir(previewRoot);

  const builtEntries = [];
  for (const rider of manifest) {
    builtEntries.push(await buildSinglePreview(rider));
  }

  await buildBoard(builtEntries);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
