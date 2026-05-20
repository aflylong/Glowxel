# Implementation Tasks

## Task 1: 板载数据结构定义
- [ ] 在 `terraria_mode_types.h` 中新增 `RotateStrategy` 枚举、`RotateMode` 枚举、`RotateCombo` 结构体、`RotateConfig` 结构体、`RotateState` 结构体
- [ ] `RotateCombo` 8 字节紧凑格式: character(1) + weaponId(2) + wingId(1) + biome(1) + bossId(1) + reserved(2)
- [ ] `RotateConfig` 包含: enabled, mode, interval, 5个策略字段, comboStrategy, comboCount, combos[20]

## Task 2: 板载轮播引擎模块
- [ ] 新建 `terraria_auto_rotate.h` 和 `terraria_auto_rotate.cpp`
- [ ] 实现 `init()`: 初始化状态
- [ ] 实现 `applyConfig(const RotateConfig&)`: 接收配置并启动
- [ ] 实现 `tick()`: 按真实时钟对齐检查切换时刻 (30s/1min/5min/10min/30min/1h)
- [ ] 实现 `nextElement()`: random 模式避免连续重复, sequential 模式循环递增
- [ ] 实现推荐搭配逻辑: armor 变化时 weapon/wing 跟随 kCharSets 推荐
- [ ] 实现 `saveToFlash()` / `loadFromFlash()`: 用 Preferences 持久化

## Task 3: 板载集成
- [ ] 在 `terraria_clock_effect.cpp` 的 `render()` 开头调用 `TerrariaAutoRotate::tick()`
- [ ] 在 `runtime_command_bus.cpp` 的 startTerrariaClock handler 中解析 `autoRotate` JSON 字段
- [ ] 解析后调用 `TerrariaAutoRotate::applyConfig()` + `saveToFlash()`
- [ ] 在 `config_manager.cpp` 的 terraria 初始化流程中调用 `loadFromFlash()` 恢复轮播状态
- [ ] 向后兼容: autoRotate 字段缺失时 enabled=false

## Task 4: uniapp 轮播配置 UI
- [ ] 底部 tabs 新增第 5 个 tab "轮播" (icon: `refresh`, index: 5)
- [ ] Tab 5 内容: 总开关 + 模式切换(元素随机/组合轮播)
- [ ] 元素随机模式 UI: 5 行(盔甲/武器/翅膀/地形/Boss), 每行 3 个策略按钮(固定/随机/顺序)
- [ ] 组合轮播模式 UI: 收藏列表 + "收藏当前"按钮 + 删除 + 切换方式(随机/顺序)
- [ ] 间隔选择 UI: 6 个预设按钮(30秒/1分/5分/10分/30分/1小时)
- [ ] data 中新增 `config.terraria.autoRotate` 对象

## Task 5: uniapp 发送逻辑
- [ ] `sendToDevice()` 中将 `autoRotate` 配置序列化到 WS 命令参数
- [ ] characterId → character index (0~14) 映射
- [ ] biome slug → index (0~9) 映射
- [ ] boss slug → index (0~32) 映射
- [ ] 本地存储: `_saveTerrariaConfig()` 包含 autoRotate 配置

## Task 6: 编译验证 + 内存检查
- [ ] 板载编译通过, Flash/RAM 增量在预算内
- [ ] 验证 autoRotate 字段缺失时向后兼容(不崩溃)
- [ ] 验证 combos 超过 20 个时截断处理
