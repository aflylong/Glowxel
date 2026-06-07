const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const manifestPath = path.join(__dirname, "ultraman-manifest.json");
const sourceDir = path.join(__dirname, "source");
const pageDir = path.join(__dirname, "pages");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function requestBuffer(url) {
  const escapedUrl = url.replace(/'/g, "''");
  const command = [
    "$ProgressPreference='SilentlyContinue'",
    `$url='${escapedUrl}'`,
    "$tmp=[System.IO.Path]::GetTempFileName()",
    "Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing | Out-Null",
    "$bytes=[System.IO.File]::ReadAllBytes($tmp)",
    "[Console]::OpenStandardOutput().Write($bytes, 0, $bytes.Length)",
    "Remove-Item $tmp -Force",
  ].join("; ");

  return execFileSync(
    "powershell",
    ["-NoProfile", "-Command", command],
    {
      encoding: "buffer",
      maxBuffer: 1024 * 1024 * 64,
    }
  );
}

function findHeroImageUrl(html) {
  const matches = [...html.matchAll(/data-src="([^"]+)"/g)].map((match) => match[1]);
  const preferred = matches.find((value) => /wp-content\/uploads\/.+\.(jpg|jpeg|png|webp)/i.test(value));
  return preferred || "";
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  ensureDir(sourceDir);
  ensureDir(pageDir);

  for (const entry of manifest) {
    console.log(`fetch page ${entry.slug}`);
    const htmlBuffer = requestBuffer(entry.pageUrl);
    const html = htmlBuffer.toString("utf8");
    fs.writeFileSync(path.join(pageDir, `${entry.slug}.html`), html, "utf8");

    const imageUrl = findHeroImageUrl(html);
    if (!imageUrl) {
      throw new Error(`hero image not found for ${entry.slug}`);
    }

    entry.imageUrl = imageUrl;
    const imageExt = path.extname(new URL(imageUrl).pathname) || ".jpg";
    entry.sourceExt = imageExt.toLowerCase();
    const imagePath = path.join(sourceDir, `${entry.slug}${entry.sourceExt}`);

    if (!fs.existsSync(imagePath)) {
      console.log(`download image ${entry.slug}`);
      const imageBuffer = requestBuffer(imageUrl);
      fs.writeFileSync(imagePath, imageBuffer);
    } else {
      console.log(`skip image ${entry.slug}`);
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
