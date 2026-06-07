const fs = require("fs");
const path = require("path");

const pagesDir = path.join(__dirname, "..", "..", ".tmp", "kamen-rider-pages");
const manifestPath = path.join(__dirname, "rider-manifest.json");
const baseUrl = "https://www.kamen-rider-official.com";

const targets = [
  {
    id: "kr-01",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc1\u53f7",
    slug: "kamen-rider-1",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc1\u53f7",
  },
  {
    id: "kr-02",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc2\u53f7",
    slug: "kamen-rider-2",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc2\u53f7",
  },
  {
    id: "kr-03",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcV3",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcV3",
    slug: "kamen-rider-v3",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcV3",
  },
  {
    id: "kr-04",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcX",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcX",
    slug: "kamen-rider-x",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcX",
  },
  {
    id: "kr-05",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a2\u30de\u30be\u30f3",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a2\u30de\u30be\u30f3",
    slug: "kamen-rider-amazon",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a2\u30de\u30be\u30f3",
  },
  {
    id: "kr-06",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b9\u30c8\u30ed\u30f3\u30ac\u30fc",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b9\u30c8\u30ed\u30f3\u30ac\u30fc",
    slug: "kamen-rider-stronger",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b9\u30c8\u30ed\u30f3\u30ac\u30fc",
  },
  {
    id: "kr-07",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\uff08\u30b9\u30ab\u30a4\u30e9\u30a4\u30c0\u30fc\uff09",
    name: "\u30b9\u30ab\u30a4\u30e9\u30a4\u30c0\u30fc",
    slug: "skyrider",
    matchName: "\u30b9\u30ab\u30a4\u30e9\u30a4\u30c0\u30fc",
  },
  {
    id: "kr-08",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b9\u30fc\u30d1\u30fc1",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b9\u30fc\u30d1\u30fc1",
    slug: "kamen-rider-super-1",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b9\u30fc\u30d1\u30fc1",
  },
  {
    id: "kr-09",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcZX",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcZX",
    slug: "kamen-rider-zx",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcZX",
  },
  {
    id: "kr-10",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcBLACK",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcBLACK",
    slug: "kamen-rider-black",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcBLACK",
  },
  {
    id: "kr-11",
    era: "showa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcBLACK RX",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcBLACK RX",
    slug: "kamen-rider-black-rx",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcBLACK RX",
  },
  {
    id: "kr-12",
    era: "heisei-early",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30af\u30a6\u30ac",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30af\u30a6\u30ac",
    slug: "kamen-rider-kuuga",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30af\u30a6\u30ac",
  },
  {
    id: "kr-13",
    era: "heisei-early",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a2\u30ae\u30c8",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a2\u30ae\u30c8",
    slug: "kamen-rider-agito",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a2\u30ae\u30c8",
  },
  {
    id: "kr-14",
    era: "heisei-early",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u9f8d\u9a0e",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u9f8d\u9a0e",
    slug: "kamen-rider-ryuki",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u9f8d\u9a0e",
  },
  {
    id: "kr-15",
    era: "heisei-early",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc555",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30d5\u30a1\u30a4\u30ba",
    slug: "kamen-rider-faiz",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30d5\u30a1\u30a4\u30ba",
  },
  {
    id: "kr-16",
    era: "heisei-early",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u5263",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30d6\u30ec\u30a4\u30c9",
    slug: "kamen-rider-blade",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30d6\u30ec\u30a4\u30c9",
  },
  {
    id: "kr-17",
    era: "heisei-early",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u97ff\u9b3c",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u97ff\u9b3c",
    slug: "kamen-rider-hibiki",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u97ff\u9b3c",
  },
  {
    id: "kr-18",
    era: "heisei-early",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ab\u30d6\u30c8",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ab\u30d6\u30c8",
    slug: "kamen-rider-kabuto",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ab\u30d6\u30c8",
  },
  {
    id: "kr-19",
    era: "heisei-early",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u96fb\u738b",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u96fb\u738b",
    slug: "kamen-rider-den-o",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u96fb\u738b",
  },
  {
    id: "kr-20",
    era: "heisei-early",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ad\u30d0",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ad\u30d0",
    slug: "kamen-rider-kiva",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ad\u30d0",
  },
  {
    id: "kr-21",
    era: "heisei-early",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30c7\u30a3\u30b1\u30a4\u30c9",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30c7\u30a3\u30b1\u30a4\u30c9",
    slug: "kamen-rider-decade",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30c7\u30a3\u30b1\u30a4\u30c9",
  },
  {
    id: "kr-22",
    era: "heisei-late",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcW",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcW",
    slug: "kamen-rider-w",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fcW",
  },
  {
    id: "kr-23",
    era: "heisei-late",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30aa\u30fc\u30ba/OOO",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30aa\u30fc\u30ba",
    slug: "kamen-rider-ooo",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30aa\u30fc\u30ba",
  },
  {
    id: "kr-24",
    era: "heisei-late",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30d5\u30a9\u30fc\u30bc",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30d5\u30a9\u30fc\u30bc",
    slug: "kamen-rider-fourze",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30d5\u30a9\u30fc\u30bc",
  },
  {
    id: "kr-25",
    era: "heisei-late",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a6\u30a3\u30b6\u30fc\u30c9",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a6\u30a3\u30b6\u30fc\u30c9",
    slug: "kamen-rider-wizard",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a6\u30a3\u30b6\u30fc\u30c9",
  },
  {
    id: "kr-26",
    era: "heisei-late",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u93a7\u6b66/\u30ac\u30a4\u30e0",
    name: "\u30a2\u30fc\u30de\u30fc\u30c9\u30e9\u30a4\u30c0\u30fc\u93a7\u6b66",
    slug: "kamen-rider-gaim",
    matchName: "\u30a2\u30fc\u30de\u30fc\u30c9\u30e9\u30a4\u30c0\u30fc\u93a7\u6b66",
  },
  {
    id: "kr-27",
    era: "heisei-late",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30c9\u30e9\u30a4\u30d6",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30c9\u30e9\u30a4\u30d6",
    slug: "kamen-rider-drive",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30c9\u30e9\u30a4\u30d6",
  },
  {
    id: "kr-28",
    era: "heisei-late",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b4\u30fc\u30b9\u30c8",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b4\u30fc\u30b9\u30c8",
    slug: "kamen-rider-ghost",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b4\u30fc\u30b9\u30c8",
  },
  {
    id: "kr-29",
    era: "heisei-late",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a8\u30b0\u30bc\u30a4\u30c9",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a8\u30b0\u30bc\u30a4\u30c9",
    slug: "kamen-rider-ex-aid",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30a8\u30b0\u30bc\u30a4\u30c9",
  },
  {
    id: "kr-30",
    era: "heisei-late",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30d3\u30eb\u30c9",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30d3\u30eb\u30c9",
    slug: "kamen-rider-build",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30d3\u30eb\u30c9",
  },
  {
    id: "kr-31",
    era: "heisei-late",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b8\u30aa\u30a6",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b8\u30aa\u30a6",
    slug: "kamen-rider-zi-o",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30b8\u30aa\u30a6",
  },
  {
    id: "kr-32",
    era: "reiwa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30bc\u30ed\u30ef\u30f3",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30bc\u30ed\u30ef\u30f3",
    slug: "kamen-rider-zero-one",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30bc\u30ed\u30ef\u30f3",
  },
  {
    id: "kr-33",
    era: "reiwa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30bb\u30a4\u30d0\u30fc",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30bb\u30a4\u30d0\u30fc",
    slug: "kamen-rider-saber",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30bb\u30a4\u30d0\u30fc",
  },
  {
    id: "kr-34",
    era: "reiwa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ea\u30d0\u30a4\u30b9",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ea\u30d0\u30a4",
    slug: "kamen-rider-revi",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ea\u30d0\u30a4",
  },
  {
    id: "kr-35",
    era: "reiwa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ae\u30fc\u30c4",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ae\u30fc\u30c4",
    slug: "kamen-rider-geats",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ae\u30fc\u30c4",
  },
  {
    id: "kr-36",
    era: "reiwa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ac\u30c3\u30c1\u30e3\u30fc\u30c9",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ac\u30c3\u30c1\u30e3\u30fc\u30c9",
    slug: "kamen-rider-gotchard",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ac\u30c3\u30c1\u30e3\u30fc\u30c9",
  },
  {
    id: "kr-37",
    era: "reiwa",
    series: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ac\u30f4",
    name: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ac\u30f4",
    slug: "kamen-rider-gavv",
    matchName: "\u4eee\u9762\u30e9\u30a4\u30c0\u30fc\u30ac\u30f4",
  },
];

function readCards() {
  const pageFiles = fs
    .readdirSync(pagesDir)
    .filter((fileName) => fileName.endsWith(".html"))
    .sort((left, right) => left.localeCompare(right, "en"));

  const regex =
    /<li class="l-Card__item">[\s\S]*?<img width="300" height="540" src="([^"]+)" \/>[\s\S]*?<p class="p-Card__textbox[^>]*">([^<]+)<\/p>[\s\S]*?<a class="p-Card__anchor" href="([^"]+)"><\/a>[\s\S]*?<\/li>/g;

  const cardMap = new Map();
  for (const pageFile of pageFiles) {
    const html = fs.readFileSync(path.join(pagesDir, pageFile), "utf8");
    let match = null;
    while ((match = regex.exec(html))) {
      const name = match[2].trim();
      if (!cardMap.has(name)) {
        cardMap.set(name, {
          imageUrl: `${baseUrl}${match[1]}`,
          memberPath: match[3],
        });
      }
    }
  }
  return cardMap;
}

function buildManifest(cardMap) {
  return targets.map((target) => {
    const card = cardMap.get(target.matchName);
    if (!card) {
      throw new Error(`Missing list image for ${target.matchName}`);
    }

    return {
      id: target.id,
      era: target.era,
      series: target.series,
      name: target.name,
      slug: target.slug,
      imageUrl: card.imageUrl,
      memberPath: card.memberPath,
    };
  });
}

function main() {
  const cardMap = readCards();
  const manifest = buildManifest(cardMap);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`manifest rebuilt: ${manifest.length} riders`);
}

main();
