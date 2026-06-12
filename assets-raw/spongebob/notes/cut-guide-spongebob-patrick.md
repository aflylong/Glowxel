# 海绵宝宝与派大星裁图说明

目标：先把 `SpongeBob` 和 `Patrick` 两张大图按动作块裁开，方便后续继续拆帧、筛桌宠动作和做 64x64 预览。

## 原图位置

- 海绵宝宝原图：`assets-raw/spongebob/downloads/characters/spongebob.png`
- 派大星原图：`assets-raw/spongebob/downloads/characters/patrick.png`

## 裁图输出位置

- 海绵宝宝输出目录：`assets-raw/spongebob/cuts/spongebob/`
- 派大星输出目录：`assets-raw/spongebob/cuts/patrick/`

## 通用裁图规则

- 原始大图不要覆盖，始终保留在 `downloads/characters/`
- 每个文件只保留一个动作组
- 文件名直接使用图上的英文备注，统一转成小写并用连字符连接
- 可以删掉与当前动作组无关的角色、示例、说明区
- 可以把无关区域涂回纯蓝底，但不要缩放角色本体
- 不要改变同一动作组内部的帧顺序
- 每个动作块四周建议保留 2 到 4 像素蓝底边距
- 输出格式继续用 PNG

## 海绵宝宝建议先裁这些

建议先做这些主动作：

- `idle.png`
- `walk.png`
- `jump.png`
- `attack.png`
- `attack-walking.png`
- `attack-jumping.png`
- `butt-stomp.png`
- `cheering.png`
- `sleeping.png`

如果你愿意多裁一点，再补这些：

- `dance.png`
- `dance-3.png`
- `dance-4.png`
- `dance-5.png`
- `being-dumb.png`
- `miss.png`
- `fail.png`
- `putting-on-hat.png`
- `holding-on-to-drill.png`

海绵宝宝这张图里当前可直接删掉或暂时不保留的内容：

- `Mr. Krabs Drill` 说明区
- `Example` 说明区
- 与当前动作块无关的头像、镜框展示区
- `Extra` 单独小块，如果暂时不确定用途可以先不裁

## 派大星建议先裁这些

建议先做这些主动作：

- `idle.png`
- `walk.png`
- `sleeping.png`
- `drink.png`
- `jump.png`
- `attack.png`
- `butt-stomp.png`
- `cheering.png`

如果你愿意多裁一点，再补这些：

- `dance.png`
- `dance-2.png`
- `dance-3.png`
- `dance-4.png`
- `dance-5-a.png`
- `dance-5-b.png`
- `being-dumb.png`
- `miss.png`
- `fail.png`
- `hurt-dead-scared.png`
- `in-bubble.png`

说明：

- 派大星图里 `Dance 5` 出现了两组，先用两个文件区分：
- 第一组命名：`dance-5-a.png`
- 第二组命名：`dance-5-b.png`

## 命名示例

- `assets-raw/spongebob/cuts/spongebob/idle.png`
- `assets-raw/spongebob/cuts/spongebob/attack-walking.png`
- `assets-raw/spongebob/cuts/patrick/walk.png`
- `assets-raw/spongebob/cuts/patrick/dance-5-a.png`

## 当前最推荐的第一批

如果你想先最小成本开工，只先裁这 10 个：

- 海绵宝宝：`idle` / `walk` / `jump` / `attack` / `sleeping`
- 派大星：`idle` / `walk` / `drink` / `jump` / `sleeping`

这批做完以后，我就可以先把两个角色的核心桌宠动作往下拆。
