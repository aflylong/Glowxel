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

// 顺序模式索引 (只角色和 Boss 两个轴)
uint8_t s_armorSeqIdx = 0;
uint8_t s_bossSeqIdx = 0;
uint8_t s_comboSeqIdx = 0;

// 上次随机值 (避免连续重复)
uint8_t s_lastArmorIdx = 0xFF;
uint8_t s_lastBossIdx = 0xFF;

// 套装数量
constexpr uint8_t NUM_CHARS = 15;
constexpr uint8_t NUM_BOSSES = 33;

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

// Boss 索引 -> Biome 索引 (跟 uniapp build-boss-firmware.js 的 BOSS_BIOME 一致)
//   Biome 编码: forest=0, corruption=1, crimson=2, jungle=3, snow=4,
//               dungeon=5, underworld=6, hallow=7, ocean=8, temple=9
//   Boss 顺序跟 uniapp 端 _bossSlugToIndex 列表一致 (33 项)
constexpr uint8_t kBossBiomes[33] = {
  /*  0 king_slime        */ 0, // forest
  /*  1 eye_of_cthulhu    */ 1, // corruption
  /*  2 eater_of_worlds   */ 1, // corruption
  /*  3 brain_of_cthulhu  */ 2, // crimson
  /*  4 queen_bee         */ 3, // jungle
  /*  5 skeletron         */ 5, // dungeon
  /*  6 deerclops         */ 4, // snow
  /*  7 wall_of_flesh     */ 6, // underworld
  /*  8 queen_slime       */ 7, // hallow
  /*  9 the_twins         */ 0, // forest
  /* 10 destroyer         */ 0, // forest
  /* 11 skeletron_prime   */ 0, // forest
  /* 12 plantera          */ 3, // jungle
  /* 13 golem             */ 9, // temple
  /* 14 duke_fishron      */ 8, // ocean
  /* 15 empress_of_light  */ 7, // hallow
  /* 16 lunatic_cultist   */ 5, // dungeon
  /* 17 martian_saucer    */ 0, // forest
  /* 18 moon_lord         */ 0, // forest
  /* 19 pumpking          */ 0, // forest
  /* 20 mourning_wood     */ 0, // forest
  /* 21 ice_queen         */ 4, // snow
  /* 22 santa_nk1         */ 4, // snow
  /* 23 everscream        */ 4, // snow
  /* 24 solar_pillar      */ 0, // forest
  /* 25 nebula_pillar     */ 0, // forest
  /* 26 stardust_pillar   */ 0, // forest
  /* 27 vortex_pillar     */ 0, // forest
  /* 28 flying_dutchman   */ 0, // forest
  /* 29 mothron           */ 0, // forest
  /* 30 betsy             */ 0, // forest
  /* 31 dark_mage         */ 5, // dungeon
  /* 32 ogre              */ 0, // forest
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

// 元素轮播: 2 个轴 (角色轴 + Boss 轴), 武器/翅膀跟随角色, 地形跟随 Boss。
void applyElementRotation() {
  TerrariaModeConfig& cfg = ConfigManager::terrariaConfig;

  // ===== 角色轴 =====
  uint8_t newChar = cfg.character;
  if (s_cfg.characterStrategy == ROTATE_RANDOM) {
    newChar = randExclude(NUM_CHARS, s_lastArmorIdx);
  } else {  // ROTATE_SEQUENTIAL
    s_armorSeqIdx = (s_armorSeqIdx + 1) % NUM_CHARS;
    newChar = s_armorSeqIdx;
  }
  s_lastArmorIdx = newChar;
  cfg.character = newChar;

  // 武器: 永远从该角色推荐的 2 把里随机抽一个 (固定搭配)
  cfg.weaponId = kCharWeapons[newChar][esp_random() % 2];
  // 翅膀: 永远用该角色固定搭配
  cfg.wingId = kCharWings[newChar];

  // ===== Boss 轴 =====
  uint8_t newBoss = cfg.bossId;
  if (s_cfg.bossStrategy == ROTATE_RANDOM) {
    newBoss = randExclude(NUM_BOSSES, s_lastBossIdx);
  } else {  // ROTATE_SEQUENTIAL
    s_bossSeqIdx = (s_bossSeqIdx + 1) % NUM_BOSSES;
    newBoss = s_bossSeqIdx;
  }
  s_lastBossIdx = newBoss;
  cfg.bossId = newBoss;
  // 地形: 永远跟随 Boss 自带的 biome (固定关联)
  cfg.biome = kBossBiomes[newBoss];
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
  // 重置顺序索引: 从当前已发送的 character/bossId 接续, 避免轮播一开就跳变
  s_armorSeqIdx = ConfigManager::terrariaConfig.character;
  s_bossSeqIdx = ConfigManager::terrariaConfig.bossId;
  s_comboSeqIdx = 0;
  s_lastArmorIdx = 0xFF;
  s_lastBossIdx = 0xFF;
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
  prefs.begin("tr_rotate", false);  // 写模式, 方便旧数据 size 不匹配时直接清掉
  size_t len = prefs.getBytes("cfg", &s_cfg, sizeof(s_cfg));
  if (len == sizeof(s_cfg)) {
    s_active = s_cfg.enabled;
  } else {
    // 旧 RotateConfig 字段已重构, 旧数据一律清空,不再做兼容
    memset(&s_cfg, 0, sizeof(s_cfg));
    s_active = false;
    prefs.remove("cfg");
  }
  prefs.end();
}

bool isEnabled() { return s_active; }

}  // namespace TerrariaAutoRotate
