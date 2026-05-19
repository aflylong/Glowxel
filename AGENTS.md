# Project Hard Constraints (No Speculative Fallbacks)
<!-- 项目硬约束（禁止臆想兜底） -->

The following rules are mandatory for this repository and take precedence over default implementation habits.
<!-- 以下规则为本仓库强制规则，优先级高于默认实现习惯。 -->

1. Only use field names and value sources explicitly provided in the requirement; do not invent fields, alias fields, or compatibility fields.
   <!-- 仅允许使用需求中明确给出的字段名与取值来源，禁止自行发明字段、别名字段或兼容字段。 -->
2. Do not use any fallback logic, including but not limited to `a || b`, multi-key fallback, default-value inference, or implicit compatibility mapping.
   <!-- 禁止任何"兜底"写法：包括但不限于 a || b、多键回退、默认值推断、隐式容错映射。 -->
3. If a field is missing or its source is unclear, stop and ask the user first; do not continue implementation without confirmation.
   <!-- 字段缺失或来源不明确时，必须先停下并向用户确认；未确认不得继续编码。 -->
4. For API parameter changes, provide a parameter mapping table first (`field -> source`) before making code changes.
   <!-- 涉及接口参数变更时，必须先给出"参数映射表（字段名 -> 来源）"，再实施代码修改。 -->
5. If a diff introduces any unagreed field name, treat it as non-compliant and redo the change according to the agreed contract.
   <!-- 若代码 diff 出现未约定字段名，视为不符合要求，必须回退并按约定重做。 -->

# Git Safety Rules (Git 操作硬约束)

6. **NEVER use `git checkout --` / `git reset --hard` / `git restore` to overwrite uncommitted local changes.** These commands destroy unsaved work permanently and cannot be undone.
   <!-- 绝对禁止使用 git checkout --、git reset --hard、git restore 来覆盖未提交的本地修改。这类命令会永久销毁未保存的工作，无法挽回。 -->
7. Before any git operation that could touch the working tree, check `git status` first. If there are uncommitted changes, NEVER use destructive git commands without explicit user approval.
    <!-- 任何会动到工作区的 git 操作前，先 git status 检查。有未提交修改时，绝对禁止未经用户明确同意就用破坏性 git 命令。 -->
8. To "undo" code changes, prefer: (a) re-edit the file directly, (b) use the editor's undo, (c) use the IDE's local history. Do NOT use git as an undo tool when changes are not yet committed.
    <!-- "撤销代码改动" 的优先方式：直接重新编辑文件 / 编辑器 undo / IDE 本地历史。改动未提交时绝对不要用 git 当 undo 工具。 -->
9. `git stash` is also destructive when unintended — only use it when the user explicitly requests stashing.
    <!-- git stash 在非预期场景下也是破坏性的——只在用户明确要求时使用。 -->

# Communication Rules (沟通硬约束)

10. After reading this AGENTS.md, ALWAYS reply in Simplified Chinese (简体中文) for the rest of the session, and at the start of any non-trivial task report:
    - 我准备做什么 (what I'm about to do)
    - 为了解决什么问题 (what problem it solves)
    - 影响哪些文件 (which files will be touched)
    Then proceed without asking confirmation for clearly-scoped local edits.
    <!-- 读过 AGENTS.md 之后, 整个会话都用简体中文回复, 每个非琐碎任务开始前必须先报告"准备做什么 / 为了解决什么问题 / 影响哪些文件", 然后对范围明确的本地改动直接动手, 不要再问确认。 -->

11. Test scripts, build scripts, asset conversion scripts, and other local read-only or self-contained commands do NOT require user confirmation. Only ask the user for confirmation on destructive ops, production deploys, infra changes, or anything outside the project working tree.
    <!-- 测试脚本/构建脚本/资源转换脚本/纯本地只读或自包含命令不需要用户确认, 只有破坏性操作/生产部署/基础设施改动/工作区外的事才问用户。 -->


# Data Safety Rules (数据安全硬约束)

12. **NEVER overwrite generated data files** (e.g. `static/terraria/*.js`, `theme_assets/terraria/sprites_*.h`) without first verifying the new content has equal-or-greater coverage than the existing one. **If unsure, ASK before writing.**
    <!-- 绝对不许在没确认"新内容覆盖度 >= 旧内容"的情况下覆盖已生成的数据文件 (uniapp/static/terraria/*.js, esp32-firmware/.../sprites_*.h)。不确定就先问。 -->

13. **NEVER use git to "find" or "restore" lost data** unless the user explicitly says "用 git 恢复" or "用 git 找". When the user says "不要动 git" or any equivalent, treat it as an absolute prohibition for the rest of the session — including read-only `git checkout HEAD --`, `git stash`, `git reset`, etc.
    <!-- 绝对不许用 git 找回或恢复丢失的数据, 除非用户明确说"用 git 恢复"。用户说过"不要动 git"之后, 整个会话内任何 git 写命令都禁止 (包括 git checkout HEAD --、git stash、git reset 等)。 -->

14. Build scripts that produce `static/terraria/*.js` MUST validate output before writing — if the output is empty or smaller than 50% of the existing file, refuse to overwrite and exit with a clear warning. Don't trust "PNG missing → empty output → write" as acceptable behavior.
    <!-- 凡是产出 static/terraria/*.js 的 build 脚本, 写文件前必须校验: 输出为空 / 输出小于现有文件 50%, 都要拒绝写入并报警。绝对不许"PNG 缺失 → 空输出 → 写入"成为正常行为。 -->

