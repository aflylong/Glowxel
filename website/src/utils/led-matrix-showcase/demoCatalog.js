const DEMO_ITEMS = [
  { id: "clock", label: "鍍忕礌鏃堕挓", category: "缁忓吀灞忎繚", type: "ambient", ambientPreset: "clock_scene", source: "AmbientScenes/Clock", hint: "涓婃父 AmbientScenes 鐨?Clock 鍦烘櫙" },
  { id: "starfield", label: "鏄熺┖", category: "缁忓吀灞忎繚", type: "ambient", ambientPreset: "starfield", source: "AmbientScenes/Starfield", hint: "涓婃父 AmbientScenes 鐨?Starfield 鍦烘櫙" },
  { id: "metablob", label: "娑蹭綋妯℃嫙", category: "缁忓吀灞忎繚", type: "ambient", ambientPreset: "metablob", source: "m0vi0/esp8266-liquid-sim", hint: "鍙傝€?m0vi0 鐨勭矑瀛愭恫浣撴ā鎷燂紝骞舵寜 64脳64 Glowxel PixelBoard 鏉胯浇鏁堟灉閲嶅啓" },
  { id: "digital_rain"", label: "鏁板瓧闆?", category: "缁忓吀灞忎繚"", type: "ambient"", ambientPreset: "digital_rain"", source: "AmbientScenes/DigitalRain"", hint: "涓婃父 AmbientScenes 鐨?DigitalRain 鍦烘櫙"" },"
  { id: "neon_tunnel", label: "闇撹櫣闅ч亾", category: "缁忓吀灞忎繚", type: "ambient", ambientPreset: "neon_tunnel", source: "AmbientScenes/NeonTunnel", hint: "涓婃父 AmbientScenes 鐨?NeonTunnel 鍦烘櫙" },
  { id: "boids", label: "缇ゆ父绮掑瓙", category: "缁忓吀灞忎繚", type: "ambient", ambientPreset: "boids", source: "AmbientScenes/Boids", hint: "涓婃父 AmbientScenes 鐨?Boids 鍦烘櫙" },
  { id: "falling_sand"", label: "娴佹矙鍦?", category: "缁忓吀灞忎繚"", type: "ambient"", ambientPreset: "falling_sand"", source: "AmbientScenes/FallingSand"", hint: "涓婃父 AmbientScenes 鐨?FallingSand 鍦烘櫙"" },"
  { id: "game_of_life", label: "鐢熷懡婕斿寲", category: "鍒嗗舰灞忎繚", type: "ambient", ambientPreset: "game_of_life", source: "FractalScenes/GameOfLife", hint: "涓婃父 FractalScenes 鐨?GameOfLife 鍦烘櫙" },
  { id: "julia_set", label: "Julia 鍒嗗舰", category: "鍒嗗舰灞忎繚", type: "ambient", ambientPreset: "julia_set", source: "FractalScenes/JuliaSet", hint: "涓婃父 FractalScenes 鐨?JuliaSet 鍦烘櫙" },
  { id: "wave_pattern", label: "娉㈢汗鍒嗗舰", category: "鍒嗗舰灞忎繚", type: "ambient", ambientPreset: "wave_pattern", source: "FractalScenes/WavePattern", hint: "涓婃父 FractalScenes 鐨?WavePattern 鍦烘櫙" },
  { id: "maze", label: "杩峰婕父", category: "鐙珛娓告垙", type: "animation", source: "GameScenes/Maze", hint: "涓婃父 GameScenes 鐨?Maze 鍦烘櫙" },
  { id: "snake"", label: "璐悆铔?", category: "鐙珛娓告垙"", type: "animation"", source: "GameScenes/Snake"", hint: "涓婃父 GameScenes 鐨?Snake 鍦烘櫙"" },"
  { id: "sorting_visualizer", label: "鎺掑簭鐭╅樀", category: "娓告垙灞忎繚", type: "animation", source: "AmbientScenes/SortingVisualizer", hint: "涓婃父 AmbientScenes 鐨?SortingVisualizer 鍦烘櫙" },
  { id: "bouncing_logo", label: "寮硅烦鍥炬爣", category: "娓告垙灞忎繚", type: "ambient", ambientPreset: "bouncing_logo", source: "AmbientScenes/BouncingLogo", hint: "涓婃父 AmbientScenes 鐨?BouncingLogo 鍦烘櫙" },
  { id: "watermelon_plasma"", label: "瑗跨摐绛夌瀛?", category: "绀惧尯鍦烘櫙"", type: "ambient"", ambientPreset: "watermelon_plasma"", source: "GithubScenes/WatermelonPlasma"", hint: "涓婃父 GithubScenes 鐨?WatermelonPlasma 鍦烘櫙"" },"
  { id: "github_wave", label: "绀惧尯娉㈠満", category: "绀惧尯鍦烘櫙", type: "ambient", ambientPreset: "reaction_diffusion", source: "GithubScenes/Wave", hint: "涓婃父 GithubScenes 鐨?Wave 鍦烘櫙" },
  { id: "rain", label: "闆ㄥ箷", category: "绮掑瓙鍦烘櫙", type: "ambient", ambientPreset: "rain_scene", source: "RGBMatrixAnimations/Rain", hint: "涓婃父 RGBMatrixAnimations 鐨?Rain 鍦烘櫙" },
  { id: "sparks", label: "鐏姳", category: "绮掑瓙鍦烘櫙", type: "ambient", ambientPreset: "sparks", source: "RGBMatrixAnimations/Sparks", hint: "涓婃父 RGBMatrixAnimations 鐨?Sparks 鍦烘櫙" },
];

const LED_SHOWCASE_DEMO_IDS = [
  "clock",
  "starfield",
  "metablob",
  "digital_rain",
  "neon_tunnel",
  "boids",
  "falling_sand",
  "game_of_life",
  "julia_set",
  "wave_pattern",
  "watermelon_plasma",
  "github_wave",
  "rain",
  "sparks",
];

function resolveDemoById(demoId) {
  return DEMO_ITEMS.find((item) => item.id === demoId) || null;
}

function getLedMatrixDemoItems() {
  return LED_SHOWCASE_DEMO_IDS.map((id) => resolveDemoById(id)).filter(Boolean);
}

export {
  DEMO_ITEMS,
  LED_SHOWCASE_DEMO_IDS,
  resolveDemoById,
  getLedMatrixDemoItems,
};
