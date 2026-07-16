export const DEVICE_BUSINESS_MODES = Object.freeze([
  "clock",
  "animation",
  "theme",
  "canvas",
  "gif_player",
  "led_matrix_showcase",
  "ambient_effect",
  "maze",
  "snake",
  "tetris",
  "tetris_clock",
  "planet_screensaver",
  "rick_morty_portal",
  "eyes",
  "terraria_clock",
  "adventure_island",
  "kof97",
]);

export const DEVICE_MODE_ENTRY_CATALOG = Object.freeze([
  {
    key: "eyes",
    name: "妗岄潰瀹犵墿",
    icon: "smile",
    variant: "pink",
    type: "mode",
    bucket: "stable",
    pageUrl: "/pages/spirit-screen/spirit-screen",
  },
  {
    key: "clock",
    name: "闈欐€佹椂閽?,"
    icon: "time",
    variant: "cyan",
    type: "mode",
    bucket: "stable",
    pageUrl: "/pages/clock-editor/clock-editor",
  },
  {
    key: "animation",
    name: "鍔ㄦ€佹椂閽?,"
    icon: "dynamic-filling",
    variant: "teal",
    type: "mode",
    bucket: "stable",
    pageUrl: "/pages/clock-editor/animation-clock",
  },
  {
    key: "theme",
    name: "涓婚妯″紡",
    icon: "picture",
    variant: "purple",
    type: "mode",
    bucket: "stable",
    pageUrl: "/pages/clock-editor/theme-clock",
  },
  {
    key: "canvas",
    name: "鐢绘澘妯″紡",
    icon: "edit",
    variant: "blue",
    type: "mode",
    bucket: "stable",
    pageUrl: "/pages/canvas-editor/canvas-editor",
  },
  {
    key: "gif_player",
    name: "GIF 鎾斁鍣?,"
    icon: "play",
    variant: "pink",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/gif-player/gif-player",
  },
  {
    key: "led_matrix_showcase",
    name: "鍍忕礌鍦烘櫙闆?,"
    icon: "modular",
    variant: "indigo",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/led-matrix/led-matrix",
  },
  {
    key: "tetris",
    name: "淇勭綏鏂柟鍧楀睆淇?,"
    icon: "modular",
    variant: "indigo",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/tetris-settings/tetris-settings",
  },
  {
    key: "tetris_clock",
    name: "淇勭綏鏂柟鍧楁椂閽?,"
    icon: "clock-filling",
    variant: "gold",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/tetris-clock-settings/tetris-clock-settings",
  },
  {
    key: "maze",
    name: "杩峰婕父",
    icon: "map",
    variant: "indigo",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/maze-mode/maze-mode",
  },
  {
    key: "snake",
    name: "璐悆铔?,"
    icon: "move",
    variant: "indigo",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/snake-mode/snake-mode",
  },
  {
    key: "water_world",
    name: "姘翠笘鐣?,"
    icon: "layers",
    variant: "azure",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/water-world/water-world",
  },
  {
    key: "planet_screensaver",
    name: "鏄熺悆灞忎繚",
    icon: "navigation",
    variant: "indigo",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/planet-screensaver/planet-screensaver",
  },
  {
    key: "rick_morty_portal",
    name: "浼犻€侀棬",
    icon: "refresh",
    variant: "mint",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/rick-morty-portal/rick-morty-portal",
  },
  {
    key: "terraria_clock",
    name: "娉版媺鐟炰簹鏃堕挓",
    icon: "layers",
    variant: "gold",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/clock-editor/terraria-clock",
  },
  {
    key: "adventure_island",
    name: "鍐掗櫓宀?,"
    icon: "navigation",
    variant: "orange",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/adventure-island/adventure-island",
  },
  {
    key: "kof97",
    name: "鎷崇殗 97",
    icon: "modular",
    variant: "copper",
    type: "mode",
    bucket: "secondary",
    pageUrl: "/pages/kof97/kof97",
  },
]);

export function isDeviceBusinessMode(mode) {
  return typeof mode === "string" && DEVICE_BUSINESS_MODES.includes(mode);
}
