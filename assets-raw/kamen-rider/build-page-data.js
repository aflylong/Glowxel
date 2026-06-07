const fs = require("fs");
const path = require("path");

const manifestPath = path.join(__dirname, "rider-manifest.json");
const outputPath = path.join(__dirname, "rider-manifest-page.js");
const processedMetaPath = path.join(__dirname, "processed-meta.json");

function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const processedMeta = JSON.parse(fs.readFileSync(processedMetaPath, "utf8"));
  const metaMap = new Map(processedMeta.map((entry) => [entry.slug, entry]));
  const pageManifest = manifest.map((entry) => {
    const meta = metaMap.get(entry.slug);
    if (!meta) {
      throw new Error(`processed meta missing for ${entry.slug}`);
    }

    return {
      slug: meta.slug,
      sourceWidth: meta.sourceWidth,
      sourceHeight: meta.sourceHeight,
      trimLeft: meta.trimLeft,
      trimTop: meta.trimTop,
      trimmedWidth: meta.trimmedWidth,
      trimmedHeight: meta.trimmedHeight,
      processedWidth: meta.processedWidth,
      processedHeight: meta.processedHeight,
      processedPath: meta.processedPath,
      id: entry.id,
      era: entry.era,
      series: entry.series,
      name: entry.name,
      imageUrl: entry.imageUrl,
      memberPath: entry.memberPath,
      rawSourcePath: `source/${entry.era}/${entry.slug}.png`,
      sourcePath: `processed/${entry.era}/${entry.slug}.png`,
      previewPath: `preview-64/${entry.era}/${entry.slug}.png`,
    };
  });

  const content =
    "window.KAMEN_RIDER_MANIFEST = " +
    JSON.stringify(pageManifest, null, 2) +
    ";\n";

  fs.writeFileSync(outputPath, content, "utf8");
}

main();
