const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const outputDir = path.join(__dirname, "..", "..", ".tmp", "kamen-rider-pages");
const PAGE_COUNT = 9;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function requestText(url) {
  const escapedUrl = url.replace(/'/g, "''");
  const command = [
    "$ProgressPreference='SilentlyContinue'",
    `$url='${escapedUrl}'`,
    "$tmp=[System.IO.Path]::GetTempFileName()",
    "Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing | Out-Null",
    "$text=[System.IO.File]::ReadAllText($tmp, [System.Text.Encoding]::UTF8)",
    "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8",
    "Write-Output $text",
    "Remove-Item $tmp -Force",
  ].join("; ");

  return execFileSync("powershell", ["-NoProfile", "-Command", command], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 32,
  });
}

function buildPageUrl(pageNumber) {
  if (pageNumber === 1) {
    return "https://www.kamen-rider-official.com/zukan/kamen_rider_members";
  }
  return `https://www.kamen-rider-official.com/zukan/kamen_rider_members?page=${pageNumber}`;
}

function main() {
  ensureDir(outputDir);

  for (let page = 1; page <= PAGE_COUNT; page += 1) {
    const url = buildPageUrl(page);
    const outputPath = path.join(outputDir, `page-${page}.html`);
    console.log(`fetch page ${page}`);
    const html = requestText(url);
    fs.writeFileSync(outputPath, html, "utf8");
  }
}

main();
