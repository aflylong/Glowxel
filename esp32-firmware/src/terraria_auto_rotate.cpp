// ============================================================
// 泰拉瑞亚时钟自动轮播引擎
// 按真实时钟对齐切换时刻, 独立于 uniapp 连接运行
// ============================================================

#include "terraria_auto_rotate.h"
#include "terraria_clock_effect.h"
#include "config_manager.h"
#include <Preferences.h>
#include <time.h>
#include <esp_random.h>

namespace {

RotateConfig s_cfg = {};
bool s_active = false;
uint32_t s_lastRotateMinute = 0xFFFF;  // 上次切换的分钟标记 (防同一分钟重复)
uint32_t s_lastRotateSecond = 0xFFFF;

// 顺序模式索引
uint8_t s_armorSeqIdx = 0;
uint8_t s_weaponSeqIdx = 0;
uint8_t s_wingSeqIdx = 0;
uint8_t s_biomeSeqIdx = 0;
uint8_t s_bossSeqIdx = 0;
uint8_t s_comboSeqIdx = 0;

// 上次随机值 (避免连续重复)
uint8_t s_lastArmorIdx = 0xFF;
uint8_t s_lastBossIdx = 0xFF;

// 套装数量
constexpr uint8_t NUM_CHARS = 15;
constexpr uint8_t NUM_BIOMES = 10;
constexpr uint8_t NUM_BOSSES = 33;

// 武器 ID 表 (跟 kWeaponProps 一致)
constexpr uint16_t kAllWeapons[20] = {
  4956, 5005, 3531, 3475, 3540, 3541, 3542, 757, 1122, 1931,
  1947, 3827, 4923, 4952, 24, 3507, 2880, 1121, 121, 3852,
};
constexpr uint8_t NUM_WEAPONS = 20;

// 翅膀 ID 表
constexpr uint8_t kAllWings[18] = {
  29, 30, 31, 32, 24, 11, 21, 10, 26, 27, 49, 6, 14, 1, 37, 38, 23, 2,
};
constexpr uint8_t NUM_WINGS = 18;

// 套装推荐武器 (每套 2 把, 跟 CHARACTERS 表一致)
constexpr uint16_t kCharWeapons[15][2] = {
  {4956, 757},   // warrior
  {3475, 3540},  // ranger
  {3541, 3542},  // mage
  {3531, 5005},  // summoner
  {757, 1122},   // beetle
  {1931, 3541},  // spectre
  {3531, 1931},  // spooky
  {1947, 1931},  // frost
  {757, 3827},   // hallowed
  {4923, 4952},  // chlorophyte
  {2880, 757},   // crystal
  {1121, 121},   // bee
  {3852, 757},   // pirate
  {121, 757},    // molten
  {3507, 24},    // novice
};

// 套装推荐翅膀
constexpr uint8_t kCharWings[15] = {
  29, 30, 31, 32, 24, 11, 21, 10, 26, 27, 49, 6, 14, 1, 0,
};

// 随机数 (避免连续重复)
uint8_t randExclude(uint8_t count, uint8_t exclude) {
  if (count <= 1) return 0;
  uint8_t v = esp_random() % (count - 1);
  if (v >= exclude) v++;
  return v;
}

// 检查是否到达切换时刻 (按真实时钟对齐)
bool shouldRotateNow() {
  time_t now = time(nullptr);
  struct tm* t = localtime(&now);
  if (!t) return false;

  uint16_t interval = s_cfg.interval;
  uint32_t totalSec = t->tm_hour * 3600 + t->tm_min * 60 + t->tm_sec;

  // 按间隔对齐: totalSec 能整除 interval 时触发
  if (interval < 60) {
    // 30秒: 每分钟的 :00 和 :30
    uint32_t mark = totalSec / interval;
    if (mark == s_lastRotateSecond) return false;
    s_lastRotateSecond = mark;
    return true;
  } else {
    // >=60秒: 按分钟对齐
    uint32_t totalMin = t->tm_hour * 60 + t->tm_min;
    uint16_t intervalMin = interval / 60;
    if (intervalMin == 0) intervalMin = 1;
    uint32_t mark = totalMin / intervalMin;
    if (t->tm_sec != 0) return false;  // 只在整秒触发
    if (mark == s_lastRotateMinute) return false;
    s_lastRotateMinute = mark;
    return true;
  }
}

void applyElementRotation() {
  TerrariaModeConfig& cfg = ConfigManager::terrariaConfig;

  // 盔甲
  uint8_t newChar = cfg.character;
  if (s_cfg.armorStrategy == ROTATE_RANDOM) {
    newChar = randExclude(NUM_CHARS, s_lastArmorIdx);
    s_lastArmorIdx = newChar;
  } else if (s_cfg.armorStrategy == ROTATE_SEQUENTIAL) {
    s_armorSeqIdx = (s_armorSeqIdx + 1) % NUM_CHARS;
    newChar = s_armorSeqIdx;
  }
  cfg.character = newChar;

  // 武器 (跟随盔甲推荐 or 全局随机)
  if (s_cfg.weaponStrategy == ROTATE_RANDOM) {
    if (s_cfg.armorStrategy != ROTATE_FIXED) {
      // 盔甲在变 → 从推荐武器里选
      cfg.weaponId = kCharWeapons[newChar][esp_random() % 2];
    } else {
      // 盔甲固定 → 全局随机
      cfg.weaponId = kAllWeapons[esp_random() % NUM_WEAPONS];
    }
  } else if (s_cfg.weaponStrategy == ROTATE_SEQUENTIAL) {
    s_weaponSeqIdx = (s_weaponSeqIdx + 1) % NUM_WEAPONS;
    cfg.weaponId = kAllWeapons[s_weaponSeqIdx];
  }

  // 翅膀 (跟随盔甲推荐 or 全局随机)
  if (s_cfg.wingStrategy == ROTATE_RANDOM) {
    if (s_cfg.armorStrategy != ROTATE_FIXED) {
      cfg.wingId = kCharWings[newChar];
    } else {
      cfg.wingId = kAllWings[esp_random() % NUM_WINGS];
    }
  } else if (s_cfg.wingStrategy == ROTATE_SEQUENTIAL) {
    s_wingSeqIdx = (s_wingSeqIdx + 1) % NUM_WINGS;
    cfg.wingId = kAllWings[s_wingSeqIdx];
  }

  // 地形
  if (s_cfg.biomeStrategy == ROTATE_RANDOM) {
    cfg.biome = esp_random() % NUM_BIOMES;
  } else if (s_cfg.biomeStrategy == ROTATE_SEQUENTIAL) {
    s_biomeSeqIdx = (s_biomeSeqIdx + 1) % NUM_BIOMES;
    cfg.biome = s_biomeSeqIdx;
  }

  // Boss
  if (s_cfg.bossStrategy == ROTATE_RANDOM) {
    uint8_t newBoss = randExclude(NUM_BOSSES, s_lastBossIdx);
    s_lastBossIdx = newBoss;
    cfg.bossId = newBoss;
  } else if (s_cfg.bossStrategy == ROTATE_SEQUENTIAL) {
    s_bossSeqIdx = (s_bossSeqIdx + 1) % NUM_BOSSES;
    cfg.bossId = s_bossSeqIdx;
  }
}

void applyComboRotation() {
  if (s_cfg.comboCount == 0) return;
  TerrariaModeConfig& cfg = ConfigManager::terrariaConfig;

  uint8_t idx;
  if (s_cfg.comboStrategy == ROTATE_RANDOM) {
    idx = esp_random() % s_cfg.comboCount;
  } else {
    s_comboSeqIdx = (s_comboSeqIdx + 1) % s_cfg.comboCount;
    idx = s_comboSeqIdx;
  }

  const RotateCombo& combo = s_cfg.combos[idx];
  cfg.character = combo.character;
  cfg.weaponId = combo.weaponId;
  cfg.wingId = combo.wingId;
  cfg.biome = combo.biome;
  cfg.bossId = combo.bossId;
}

}  // anon namespace

namespace TerrariaAutoRotate {

void init() {
  memset(&s_cfg, 0, sizeof(s_cfg));
  s_active = false;
}

void applyConfig(const RotateConfig& cfg) {
  s_cfg = cfg;
  s_active = cfg.enabled;
  s_lastRotateMinute = 0xFFFF;
  s_lastRotateSecond = 0xFFFF;
  // 重置顺序索引
  s_armorSeqIdx = ConfigManager::terrariaConfig.character;
  s_biomeSeqIdx = ConfigManager::terrariaConfig.biome;
  s_bossSeqIdx = ConfigManager::terrariaConfig.bossId;
  s_comboSeqIdx = 0;
}

void tick() {
  if (!s_active || !s_cfg.enabled) return;
  if (!shouldRotateNow()) return;

  if (s_cfg.mode == ROTATE_MODE_ELEMENT) {
    applyElementRotation();
  } else {
    applyComboRotation();
  }

  // 触发重绘
  TerrariaClockEffect::applyConfig(ConfigManager::terrariaConfig);
}

void saveToFlash() {
  Preferences prefs;
  prefs.begin("tr_rotate", false);
  prefs.putBytes("cfg", &s_cfg, sizeof(s_cfg));
  prefs.end();
}

void loadFromFlash() {
  Preferences prefs;
  prefs.begin("tr_rotate", true);
  size_t len = prefs.getBytes("cfg", &s_cfg, sizeof(s_cfg));
  prefs.end();
  if (len == sizeof(s_cfg)) {
    s_active = s_cfg.enabled;
  } else {
    memset(&s_cfg, 0, sizeof(s_cfg));
    s_active = false;
  }
}

bool isEnabled() { return s_active; }

}  // namespace TerrariaAutoRotate
