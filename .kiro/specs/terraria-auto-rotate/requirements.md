# Requirements Document

## Introduction

为泰拉瑞亚时钟模式添加"自动轮播/随机切换"功能。用户可在 uniapp 小程序中配置轮播策略（随机/顺序/固定），选择参与轮播的元素类别（盔甲、武器、翅膀、地形、Boss），设置切换时间间隔，并将配置下发到 ESP32 板载。板载程序在断开连接后独立执行轮播逻辑，按照配置定时切换显示内容。

## Glossary

- **Auto_Rotate_Engine**: ESP32 板载的自动轮播引擎模块，负责根据配置独立执行定时切换逻辑
- **Rotate_Config_Page**: uniapp 小程序中的轮播配置页面，用户在此设置轮播策略和参数
- **Rotate_Strategy**: 轮播策略枚举，包含 sequential（顺序轮播）、random（随机切换）、fixed（固定不变）三种模式
- **Element_Category**: 可独立控制轮播的元素类别，包括 armor（盔甲）、weapon（武器）、wing（翅膀）、biome（地形）、boss（Boss）
- **Rotate_Interval**: 轮播时间间隔，单位为秒，控制每次切换之间的等待时间
- **Preset_Combo**: 用户自定义的收藏组合，包含一套完整的角色配置（盔甲+武器+翅膀+地形+Boss）
- **Recommended_Match**: CHARACTERS 表中定义的套装推荐搭配关系（套装→推荐武器+推荐翅膀）
- **WS_Protocol**: uniapp 与 ESP32 之间的 WebSocket 通信协议

## Requirements

### Requirement 1: 轮播策略独立控制

**User Story:** As a 用户, I want 为每个元素类别（盔甲、武器、翅膀、地形、Boss）分别设置轮播策略, so that 我可以让某些元素随机变化而其他元素保持固定。

#### Acceptance Criteria

1. THE Rotate_Config_Page SHALL 为每个 Element_Category 提供独立的 Rotate_Strategy 选择控件（sequential / random / fixed）
2. WHEN 用户将某个 Element_Category 的策略设为 fixed, THE Rotate_Config_Page SHALL 保持该类别使用当前已选定的具体值不变
3. WHEN 用户将某个 Element_Category 的策略设为 random, THE Auto_Rotate_Engine SHALL 在该类别的全部可用项中随机选取
4. WHEN 用户将某个 Element_Category 的策略设为 sequential, THE Auto_Rotate_Engine SHALL 按索引顺序依次切换该类别的可用项
5. THE Rotate_Config_Page SHALL 默认所有 Element_Category 的策略为 fixed

### Requirement 2: 轮播时间间隔设置

**User Story:** As a 用户, I want 设置自动切换的时间间隔, so that 我可以控制画面变化的节奏。

#### Acceptance Criteria

1. THE Rotate_Config_Page SHALL 提供 Rotate_Interval 设置控件，允许用户选择切换间隔
2. THE Rotate_Config_Page SHALL 提供的间隔选项范围为 10 秒至 3600 秒（1 小时）
3. THE Rotate_Config_Page SHALL 默认 Rotate_Interval 为 30 秒
4. WHEN Rotate_Interval 到达时, THE Auto_Rotate_Engine SHALL 同时切换所有非 fixed 策略的 Element_Category
5. THE Auto_Rotate_Engine SHALL 使用统一的 Rotate_Interval 控制所有 Element_Category 的切换节奏

### Requirement 3: 推荐搭配关联

**User Story:** As a 用户, I want 随机切换时优先使用好看的推荐搭配, so that 画面组合始终协调美观。

#### Acceptance Criteria

1. WHEN armor 策略为 random 或 sequential 且 weapon 策略为 random, THE Auto_Rotate_Engine SHALL 优先从当前盔甲对应的 Recommended_Match 武器列表中选取武器
2. WHEN armor 策略为 random 或 sequential 且 wing 策略为 random, THE Auto_Rotate_Engine SHALL 优先使用当前盔甲对应的 Recommended_Match 翅膀
3. WHEN weapon 策略为 random 且 armor 策略为 fixed, THE Auto_Rotate_Engine SHALL 从全部 20 把武器中随机选取，不受推荐搭配限制
4. WHEN wing 策略为 random 且 armor 策略为 fixed, THE Auto_Rotate_Engine SHALL 从全部 18 个翅膀中随机选取，不受推荐搭配限制

### Requirement 4: 自定义收藏组合

**User Story:** As a 用户, I want 保存自己喜欢的角色配置组合, so that 轮播时可以在我收藏的组合之间切换。

#### Acceptance Criteria

1. THE Rotate_Config_Page SHALL 提供"添加当前配置为收藏组合"的操作入口
2. WHEN 用户添加收藏组合时, THE Rotate_Config_Page SHALL 保存当前完整配置（盔甲、武器、翅膀、地形、Boss）为一个 Preset_Combo
3. THE Rotate_Config_Page SHALL 展示已保存的 Preset_Combo 列表，支持删除操作
4. THE Rotate_Config_Page SHALL 支持最多保存 20 个 Preset_Combo
5. WHEN 用户启用"组合轮播"模式时, THE Auto_Rotate_Engine SHALL 在用户保存的 Preset_Combo 列表中按顺序或随机切换整套配置
6. WHEN "组合轮播"模式启用时, THE Auto_Rotate_Engine SHALL 忽略单个 Element_Category 的独立策略设置

### Requirement 5: 板载独立运行

**User Story:** As a 用户, I want ESP32 在手机断开连接后继续执行轮播, so that 时钟可以持续自动变化而不依赖手机。

#### Acceptance Criteria

1. WHEN uniapp 发送轮播配置后断开 WebSocket 连接, THE Auto_Rotate_Engine SHALL 继续按配置独立执行轮播逻辑
2. THE Auto_Rotate_Engine SHALL 将轮播配置持久化存储到 Flash，设备重启后恢复轮播状态
3. THE Auto_Rotate_Engine SHALL 使用板载伪随机数生成器（以 millis 为种子）执行随机选取
4. IF ESP32 可用 RAM 不足以存储完整轮播配置, THEN THE Auto_Rotate_Engine SHALL 拒绝接受配置并通过 WS_Protocol 返回错误信息

### Requirement 6: WebSocket 协议扩展

**User Story:** As a 开发者, I want 扩展现有 startTerrariaClock 命令以支持轮播参数, so that uniapp 可以将轮播配置下发到板载。

#### Acceptance Criteria

1. THE WS_Protocol SHALL 在 startTerrariaClock 命令的 params 中新增 autoRotate 对象字段
2. THE WS_Protocol 的 autoRotate 字段 SHALL 包含：enabled（布尔）、interval（秒数）、mode（"element" 或 "combo"）、strategies（各 Element_Category 的策略）、combos（Preset_Combo 数组）
3. WHEN autoRotate.enabled 为 false 或 autoRotate 字段缺失时, THE Auto_Rotate_Engine SHALL 不执行任何轮播逻辑，保持静态显示
4. THE WS_Protocol SHALL 保持向后兼容：不含 autoRotate 字段的旧版命令等同于 autoRotate.enabled = false

### Requirement 7: 轮播配置页面交互

**User Story:** As a 用户, I want 轮播配置页面操作流畅直观, so that 我可以快速完成设置。

#### Acceptance Criteria

1. THE Rotate_Config_Page SHALL 作为泰拉瑞亚时钟编辑器的一个新 Tab 页呈现
2. THE Rotate_Config_Page SHALL 在用户修改任何轮播设置后实时更新预览画面
3. WHEN 用户切换 Rotate_Strategy 时, THE Rotate_Config_Page SHALL 在 200ms 内完成 UI 状态更新
4. THE Rotate_Config_Page SHALL 在每个 Element_Category 旁显示当前策略的图标或文字标识
5. WHEN 用户启用轮播功能后点击"发送"按钮, THE Rotate_Config_Page SHALL 将完整轮播配置通过 WS_Protocol 一次性下发到 ESP32

### Requirement 8: 板载内存约束

**User Story:** As a 开发者, I want 轮播功能的内存占用可控, so that 不会导致 ESP32 内存溢出。

#### Acceptance Criteria

1. THE Auto_Rotate_Engine SHALL 使用的额外 RAM 不超过 2KB（不含已有的 TerrariaModeConfig 结构）
2. THE Auto_Rotate_Engine SHALL 将 Preset_Combo 以紧凑二进制格式存储，每个 Combo 不超过 32 字节
3. THE Auto_Rotate_Engine SHALL 支持存储最多 20 个 Preset_Combo（总计不超过 640 字节）
4. IF 收到的 combos 数组超过 20 个, THEN THE Auto_Rotate_Engine SHALL 截断为前 20 个并通过 WS_Protocol 返回警告信息
