import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gamePageUrl =
  "https://www.spriters-resource.com/game_boy_advance/spongebobsquarepantsatlantissquarepantis/";
const downloadDir = path.join(__dirname, "downloads");
const manifestPath = path.join(__dirname, "downloads", "manifest.json");

const targets = [
  { label: "Mr. Krabs", slug: "mr-krabs", group: "characters" },
  { label: "Patrick", slug: "patrick", group: "characters" },
  { label: "Sandy", slug: "sandy", group: "characters" },
  { label: "SpongeBob", slug: "spongebob", group: "characters" },
  { label: "Squidward", slug: "squidward", group: "characters" },
  { label: "Plankton", slug: "plankton", group: "characters" },
  { label: "Jellyfish", slug: "jellyfish", group: "companions" },
  { label: "HUD", slug: "hud", group: "ui" },
  { label: "Difficulty Select", slug: "difficulty-select", group: "ui" },
  { label: "Minigame Select", slug: "minigame-select", group: "ui" },
  { label: "Cutscenes", slug: "cutscenes", group: "backgrounds" },
  { label: "Splash Screens", slug: "splash-screens", group: "backgrounds" },
];

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(text) {
  return decodeHtml(text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function resolveUrl(baseUrl, href) {
  return new URL(href, baseUrl).toString();
}

function collectAnchors(html, baseUrl) {
  const anchors = [];
  const anchorRegex = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match = anchorRegex.exec(html);
  while (match !== null) {
    anchors.push({
      href: resolveUrl(baseUrl, match[1]),
      text: stripTags(match[2]),
    });
    match = anchorRegex.exec(html);
  }
  return anchors;
}

function findAssetPageUrl(anchors, label) {
  const exact = anchors.find(
    (anchor) =>
      anchor.text === label &&
      anchor.href.includes("/spongebobsquarepantsatlantissquarepantis/asset/")
  );
  if (exact) {
    return exact.href;
  }

  const partial = anchors.find(
    (anchor) =>
      anchor.text.includes(label) &&
      anchor.href.includes("/spongebobsquarepantsatlantissquarepantis/asset/")
  );
  if (partial) {
    return partial.href;
  }

  return null;
}

function findImageUrl(html, assetPageUrl) {
  const absolute = html.match(
    /https:\/\/www\.spriters-resource\.com\/media\/assets\/[^"'?\s>]+\.png(?:\?updated=\d+)?/i
  );
  if (absolute) {
    return absolute[0];
  }

  const relative = html.match(/\/media\/assets\/[^"'?\s>]+\.png(?:\?updated=\d+)?/i);
  if (relative) {
    return resolveUrl(assetPageUrl, relative[0]);
  }

  return null;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 GlowxelAssetFetcher/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`fetch failed ${response.status} for ${url}`);
  }
  return await response.text();
}

async function fetchBinary(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 GlowxelAssetFetcher/1.0",
      referer: gamePageUrl,
    },
  });
  if (!response.ok) {
    throw new Error(`download failed ${response.status} for ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  await ensureDir(downloadDir);

  const gameHtml = await fetchText(gamePageUrl);
  const gameAnchors = collectAnchors(gameHtml, gamePageUrl);

  const manifest = [];

  for (const target of targets) {
    const assetPageUrl = findAssetPageUrl(gameAnchors, target.label);
    if (!assetPageUrl) {
      manifest.push({
        label: target.label,
        slug: target.slug,
        group: target.group,
        status: "asset_page_missing",
      });
      console.log(`missing asset page: ${target.label}`);
      continue;
    }

    const assetHtml = await fetchText(assetPageUrl);
    const imageUrl = findImageUrl(assetHtml, assetPageUrl);
    if (!imageUrl) {
      manifest.push({
        label: target.label,
        slug: target.slug,
        group: target.group,
        assetPageUrl,
        status: "image_missing",
      });
      console.log(`missing image: ${target.label}`);
      continue;
    }

    const outDir = path.join(downloadDir, target.group);
    await ensureDir(outDir);
    const outPath = path.join(outDir, `${target.slug}.png`);
    const imageBytes = await fetchBinary(imageUrl);
    await fs.writeFile(outPath, imageBytes);

    manifest.push({
      label: target.label,
      slug: target.slug,
      group: target.group,
      assetPageUrl,
      imageUrl,
      output: path.relative(__dirname, outPath).replace(/\\/g, "/"),
      status: "downloaded",
      size: imageBytes.length,
    });
    console.log(`downloaded: ${target.label}`);
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`manifest: ${manifestPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
