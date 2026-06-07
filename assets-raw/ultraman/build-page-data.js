const fs = require("fs");
const path = require("path");

const manifestPath = path.join(__dirname, "ultraman-manifest.json");
const outputPath = path.join(__dirname, "ultraman-manifest-page.js");

function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const pageManifest = manifest.map((entry) => ({
    id: entry.id,
    era: entry.era,
    series: entry.series,
    name: entry.name,
    slug: entry.slug,
    imageUrl: entry.imageUrl,
    sourcePath: `source/${entry.slug}${entry.sourceExt || ".jpg"}`,
    previewPath: `preview-64/${entry.era}/${entry.slug}.png`,
  }));

  fs.writeFileSync(
    outputPath,
    "window.ULTRAMAN_MANIFEST = " + JSON.stringify(pageManifest, null, 2) + ";\n",
    "utf8"
  );
}

main();
