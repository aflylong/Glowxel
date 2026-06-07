const fs = require("fs");
const path = require("path");
const https = require("https");

const manifestPath = path.join(__dirname, "rider-manifest.json");
const outputDir = path.join(__dirname, "source");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode} ${url}`));
        response.resume();
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on("finish", () => {
        fileStream.close(resolve);
      });

      fileStream.on("error", (error) => {
        fileStream.close(() => {
          reject(error);
        });
      });
    });

    request.on("error", reject);
  });
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  ensureDir(outputDir);

  for (const rider of manifest) {
    const eraDir = path.join(outputDir, rider.era);
    ensureDir(eraDir);
    const filePath = path.join(eraDir, `${rider.slug}.png`);

    console.log(`download ${rider.slug}`);
    await downloadFile(rider.imageUrl, filePath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
