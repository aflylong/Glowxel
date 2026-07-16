const CLOCK_THEME_PRESETS = [
  {
    id: "glowxel_minimal_digital",
    name: "鏋佺畝鏁板瓧",
    description: "淇濈暀澶ф椂闂翠富浣擄紝寮卞寲瑁呴グ淇℃伅锛岄€傚悎甯镐寒妗岄潰鍜屼綆骞叉壈灞曠ず銆?,"
    accentColor: "#7bf2d0",
    styleTag: "鏋佺畝鏁板瓧",
    previewImage: "",
    requiresImage: false,
    config: {
      font: "lcd_6x8",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 18,
        color: "#7bf2d0",
        align: "center",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 36,
        color: "#d2fff3",
        align: "center",
      },
      week: {
        show: true,
        x: 32,
        y: 46,
        color: "#4cc7a5",
        align: "center",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "glowxel_frame_clock",
    name: "杈规鏃堕挓",
    description: "鐢ㄦ暣灞忓儚绱犺竟妗嗗寘浣忔椂闂村尯鍩燂紝鐢婚潰鏇村畬鏁达紝閫傚悎鍋氬父椹讳富棰樸€?,"
    accentColor: "#ffcf5a",
    styleTag: "杈规鏃堕挓",
    previewImage: "",
    requiresImage: false,
    config: {
      font: "classic_5x7",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 20,
        color: "#ffcf5a",
        align: "center",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 36,
        color: "#fff5cb",
        align: "center",
      },
      week: {
        show: true,
        x: 32,
        y: 46,
        color: "#ff9f43",
        align: "center",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "glowxel_centerpiece_badge",
    name: "涓ぎ涓昏瑙?,"
    description: "涓棿淇濈暀涓€鍧椾富瑙嗚寰界珷锛屾椂闂存敹鍦ㄨ鏍囦綅锛岄€傚悎涓婚鍖栧睍绀恒€?,"
    accentColor: "#ff7f96",
    styleTag: "涓昏瑙夎鏍?,"
    previewImage: "",
    requiresImage: false,
    config: {
      font: "rounded_4x6",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 58,
        y: 6,
        color: "#ffe0e7",
        align: "right",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 58,
        y: 16,
        color: "#ff9daf",
        align: "right",
      },
      week: {
        show: true,
        x: 58,
        y: 24,
        color: "#ffd15f",
        align: "right",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "glowxel_topbar_motion",
    name: "椤舵爮娉㈠舰",
    description: "鎶婃椂闂村帇鍒伴《閮ㄦí鏍忥紝搴曢儴鐢ㄦ尝褰㈠拰鐘舵€佺偣琛ユ皼鍥达紝閫傚悎绉戞妧鎰熶富棰樸€?,"
    accentColor: "#5ecbff",
    styleTag: "椤舵爮鍔ㄦ劅",
    previewImage: "",
    requiresImage: false,
    config: {
      font: "minimal_3x5",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 2,
        x: 4,
        y: 5,
        color: "#5ecbff",
        align: "left",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 4,
        y: 46,
        color: "#d8f5ff",
        align: "left",
      },
      week: {
        show: true,
        x: 60,
        y: 46,
        color: "#7ff0ff",
        align: "right",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "glowxel_festival_poster",
    name: "鑺傛棩娴锋姤",
    description: "鍋忚妭搴嗘捣鎶ュ紡鐨勬暣灞忔帓鐗堬紝寮鸿皟姘涘洿鍥惧舰鍜屾殩鑹插潡缁勫悎銆?,"
    accentColor: "#ff6c4d",
    styleTag: "鑺傛棩娴锋姤",
    previewImage: "",
    requiresImage: false,
    config: {
      font: "retro_5x7",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 18,
        color: "#fff0d6",
        align: "center",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 36,
        color: "#ffd059",
        align: "center",
      },
      week: {
        show: true,
        x: 32,
        y: 46,
        color: "#ff9e63",
        align: "center",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "glowxel_pixel_arcade",
    name: "鍍忕礌娓告垙",
    description: "鍊熸父鎴?HUD 鐨勪俊鎭帓甯冨仛鎴愭暣灞忎富棰橈紝閫傚悎鍋忔椿璺冪殑鍍忕礌灞曠ず銆?,"
    accentColor: "#8dff6a",
    styleTag: "鍍忕礌娓告垙",
    previewImage: "",
    requiresImage: false,
    config: {
      font: "seven_seg_5x7",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 18,
        color: "#f3fff0",
        align: "center",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 6,
        y: 40,
        color: "#8dff6a",
        align: "left",
      },
      week: {
        show: true,
        x: 58,
        y: 40,
        color: "#5ed2ff",
        align: "right",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "glowxel_fireworks_bloom",
    name: "鐑熻姳缁芥斁",
    description: "寮曠敤宸插叆搴撶儫鑺辩礌鏉愬仛鎴愯妭搴嗕富棰橈紝閫傚悎鍋氭皵姘涙洿寮虹殑灞曠ず椤甸潰銆?,"
    accentColor: "#ffb347",
    styleTag: "绱犳潗鐑熻姳",
    previewImage: "",
    requiresImage: false,
    config: {
      font: "retro_5x7",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 12,
        color: "#fff6d2",
        align: "center",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 49,
        color: "#ffcf6a",
        align: "center",
      },
      week: {
        show: true,
        x: 32,
        y: 57,
        color: "#ff8f66",
        align: "center",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "glowxel_fireworks_rise",
    name: "鐑熻姳鍗囩┖",
    description: "寮曠敤宸插叆搴撶儫鑺卞崌绌虹礌鏉愶紝閫傚悎鎼厤澶滅┖搴曡壊鍜岃鏍囧紡鏃堕棿甯冨眬銆?,"
    accentColor: "#7ec8ff",
    styleTag: "绱犳潗澶滅┖",
    previewImage: "",
    requiresImage: false,
    config: {
      font: "rounded_4x6",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 58,
        y: 6,
        color: "#f2fbff",
        align: "right",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 58,
        y: 15,
        color: "#9cd7ff",
        align: "right",
      },
      week: {
        show: true,
        x: 58,
        y: 23,
        color: "#6bc0ff",
        align: "right",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "clockwise_mario",
    name: "椹噷濂ユ椂閽?,"
    description: "瀹屾暣鐨勯┈閲屽ゥ鍍忕礌鍦烘櫙锛屾椂闂村祵鍦ㄥ湴闈㈢爾鍧楀拰瑙掕壊鍦烘櫙閲屻€?,"
    accentColor: "#ff4e45",
    styleTag: "鍦烘櫙鏃堕挓",
    previewImage: "/static/clockwise-themes/cw-cf-0x01-thumb.jpg",
    requiresImage: false,
    config: {
      font: "classic_5x7",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 14,
        color: "#ff4e45",
        align: "center",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 28,
        color: "#ffd54a",
        align: "center",
      },
      week: {
        show: true,
        x: 32,
        y: 40,
        color: "#4fc3ff",
        align: "center",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "clockwise_words",
    name: "鏂囧瓧鏃堕棿涓婚",
    description: "鐢ㄦ暣鍙ヨ嫳鏂囪〃杈惧綋鍓嶆椂闂达紝鏃ユ湡鍜岀姸鎬佷俊鎭斁鍦ㄥ簳閮ㄤ俊鎭甫涓€?,"
    accentColor: "#f3f3f3",
    styleTag: "鏂囧瓧鏃堕棿",
    previewImage: "/static/clockwise-themes/cw-cf-0x02-thumb.jpg",
    requiresImage: false,
    config: {
      font: "minimal_3x5",
      showSeconds: false,
      hourFormat: 12,
      time: {
        show: true,
        fontSize: 2,
        x: 32,
        y: 10,
        color: "#f3f3f3",
        align: "center",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 28,
        color: "#c8c8c8",
        align: "center",
      },
      week: {
        show: true,
        x: 32,
        y: 37,
        color: "#8a8a8a",
        align: "center",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "clockwise_worldmap",
    name: "鍦板浘鏃堕挓",
    description: "浠ヤ笘鐣屽湴鍥句负涓昏瑙夛紝鏃堕棿淇℃伅璐村湪鍦板浘灞備笂锛屾暣浣撳亸鑸浘浠〃鐩橀鏍笺€?,"
    accentColor: "#4fd2a3",
    styleTag: "鍦板浘鏃堕挓",
    previewImage: "/static/clockwise-themes/cw-cf-0x03-thumb.jpg",
    requiresImage: false,
    config: {
      font: "minimal_3x5",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 2,
        x: 60,
        y: 45,
        color: "#4fd2a3",
        align: "right",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 4,
        y: 6,
        color: "#dffcf2",
        align: "left",
      },
      week: {
        show: true,
        x: 4,
        y: 14,
        color: "#8fd8bf",
        align: "left",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "clockwise_castlevania",
    name: "閽堝鏃堕挓涓婚",
    description: "閽熷鍦烘櫙閰嶅悎涓績琛ㄩ拡锛屾暣浣撴槸鏆楀鍝ョ壒姘涘洿銆?,"
    accentColor: "#d94fff",
    styleTag: "閽熷鎸囬拡",
    previewImage: "/static/clockwise-themes/cw-cf-0x04-thumb.jpg",
    requiresImage: false,
    config: {
      font: "hollow_5x7",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 13,
        color: "#d94fff",
        align: "center",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 32,
        y: 27,
        color: "#ff6b7c",
        align: "center",
      },
      week: {
        show: true,
        x: 32,
        y: 39,
        color: "#7a5cff",
        align: "center",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "clockwise_pacman",
    name: "鍚冭眴浜轰富棰?,"
    description: "鍙姩鐨勮糠瀹満鏅紝鏃堕棿淇℃伅鍜屽悆璞嗕汉鍔ㄦ晥铻嶅悎鍦ㄥ悓涓€涓敾闈㈤噷銆?,"
    accentColor: "#ffd400",
    styleTag: "琛楁満杩峰",
    previewImage: "/static/clockwise-themes/cw-cf-0x05-thumb.jpg",
    requiresImage: false,
    config: {
      font: "seven_seg_5x7",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 58,
        y: 8,
        color: "#ffd400",
        align: "right",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 58,
        y: 22,
        color: "#ff6464",
        align: "right",
      },
      week: {
        show: true,
        x: 58,
        y: 34,
        color: "#64c8ff",
        align: "right",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
  {
    id: "clockwise_pokedex",
    name: "鍥鹃壌涓婚",
    description: "鍥鹃壌鏈鸿韩鐣岄潰锛屽寘鍚簿鐏电獥鍙ｃ€佹椂闂村尯銆佹槦鏈熸牸鍜屽姞杞芥潯銆?,"
    accentColor: "#ff5c5c",
    styleTag: "鍥鹃壌闈㈡澘",
    previewImage: "/static/clockwise-themes/cw-cf-0x06-thumb.jpg",
    requiresImage: false,
    config: {
      font: "lcd_6x8",
      showSeconds: false,
      hourFormat: 24,
      time: {
        show: true,
        fontSize: 1,
        x: 6,
        y: 8,
        color: "#ff5c5c",
        align: "left",
      },
      date: {
        show: true,
        fontSize: 1,
        x: 6,
        y: 23,
        color: "#ffffff",
        align: "left",
      },
      week: {
        show: true,
        x: 6,
        y: 34,
        color: "#9a9a9a",
        align: "left",
      },
      image: {
        show: false,
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        data: null,
      },
    },
  },
];

function isSameSection(currentSection, presetSection) {
  const keys = Object.keys(presetSection);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (currentSection[key] !== presetSection[key]) {
      return false;
    }
  }
  return true;
}

export function getClockThemePresets() {
  return CLOCK_THEME_PRESETS.filter((preset) => preset.id.startsWith("clockwise_"));
}

export function findClockThemePreset(themeId) {
  return CLOCK_THEME_PRESETS.find((preset) => preset.id === themeId) || null;
}

export function applyClockThemePreset(currentConfig, themeId) {
  const preset = findClockThemePreset(themeId);
  if (!preset) {
    return currentConfig;
  }

  return {
    ...currentConfig,
    font: preset.config.font,
    showSeconds: preset.config.showSeconds,
    hourFormat: preset.config.hourFormat,
    time: {
      ...currentConfig.time,
      ...preset.config.time,
    },
    date: {
      ...currentConfig.date,
      ...preset.config.date,
    },
    week: {
      ...currentConfig.week,
      ...preset.config.week,
    },
    image: {
      ...currentConfig.image,
      ...(preset.config.image || {}),
    },
  };
}

export function getMatchingClockThemeId(currentConfig) {
  for (let i = 0; i < CLOCK_THEME_PRESETS.length; i++) {
    const preset = CLOCK_THEME_PRESETS[i];
    if (currentConfig.font !== preset.config.font) {
      continue;
    }
    if (currentConfig.showSeconds !== preset.config.showSeconds) {
      continue;
    }
    if (currentConfig.hourFormat !== preset.config.hourFormat) {
      continue;
    }
    if (!isSameSection(currentConfig.time, preset.config.time)) {
      continue;
    }
    if (!isSameSection(currentConfig.date, preset.config.date)) {
      continue;
    }
    if (!isSameSection(currentConfig.week, preset.config.week)) {
      continue;
    }
    return preset.id;
  }

  return "";
}
