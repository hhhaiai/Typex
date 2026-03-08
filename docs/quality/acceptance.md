# Typex Quality Acceptance

来源：根目录 `TYPEX质量验收体系.md`。

本文用于为 Typex 升级版建立统一的质量验收标准，覆盖：
- 验收标准
- 测试矩阵
- 单元测试 / 集成测试 / UI(E2E) 策略
- GitHub Pages Demo 验证
- 发布质量门禁

## 设计前置条件

进入实现与验收前，以下设计资产必须可用并完成交叉审查：
- `docs/architecture/target-architecture.md`
- `docs/architecture/package-contract-matrix.md`
- `docs/architecture/runtime-event-pipeline.md`
- `docs/specs/*`
- `docs/api/*`
- `docs/adapters/*`
- `docs/migration/current-to-target-cutover-plan.md`
- `docs/quality/traceability-matrix.md`

任何新增功能在进入实现前，都应通过 `docs/templates/spec-review-checklist.md` 评审，并在 traceability matrix 中建立需求到测试/验收的映射。

## 当前质量现状

已确认事实：
- 仓库已接入 Jest 测试命令：`package.json:4`
- 当前几乎没有实际测试资产，需要先补齐测试基线
- 高风险路径集中在：
  - 输入法与输入事件分发：`packages/@typex-core/initCore.js:97`
  - 选区同步与多光标：`packages/@typex-core/selection/index.js:62`
  - 鼠标选区拦截：`packages/@typex-platform/web/intercept/mouseIntercept.js:23`
  - iframe 输入承载与 IME 事件：`packages/@typex-platform/web/intercept/keyboardIntercept.js:47`
  - 撤销 / 重做历史：`packages/@typex-core/history/index.js`
- Markdown 当前仅发现工具栏入口，尚未看到完整解析/序列化能力

## 验收等级

### P0 阻塞级
必须全部通过：
- 编辑器可正常加载和挂载
- 单光标输入、删除、换行正常
- 选区同步正确，无明显错位
- 撤销 / 重做可用且不破坏文档结构
- Demo 页面可访问，首屏可交互

### P1 高优先级
- 多光标创建、更新、去重正常
- IME 中文输入稳定，无重复插入/丢字
- 鼠标拖选、Shift 扩选、Alt 多选区行为符合预期
- 基础格式化命令可用
- 跨节点删除不会造成结构损坏

### P2 增强级
- Markdown 双向转换
- 更复杂块级结构编辑
- 跨浏览器一致性优化
- 长文档性能基线

## 测试分层

### L1 单元测试
优先覆盖：
- History
- Selection
- 输入状态机
- 默认动作 / 事务边界

### L2 集成测试
优先覆盖：
- `keyboardEvents` -> `Transaction` -> `History`
- 原生选区 -> `updateRangesFromNative()`
- Alt 多选区 -> `_distinct()` 去重
- undo / redo 链路

### L3 UI / E2E
优先自动化旅程：
1. 页面打开，编辑器正常挂载
2. 点击文档后可输入文本
3. 删除文本并验证内容变化
4. 撤销 / 重做恢复正确
5. 工具栏基础格式化可用
6. 拖选文本与 Alt 多光标可工作
7. 中文输入法无重复提交

## 测试网站验收补充

当前阶段必须提供测试网站用于本地与远程验收，最小要求：
- 左侧提供富文本编辑区
- 同页提供 Markdown 输入区，用于驱动预览验证
- 右侧提供实时预览区
- 预览区可渲染富文本文档快照与 Markdown 文本
- 空内容、非法内容、基础格式（标题/加粗/段落）有稳定表现

建议优先补齐：
- `tests/demo-markdown-preview.test.js`
- `tests/demo-preview-state.test.js`
- `tests/demo-app.test.js`

## GitHub Pages Demo 验证

发布验收必须包含远程 Demo 验证：
- 页面可访问
- 关键静态资源能加载
- 编辑器可初始化
- 基础输入能力正常
- 控制台无阻塞级报错

关键失败条件：
- 页面无法访问
- JS 资源 404 / 加载失败
- 首屏报错导致编辑器无法挂载
- 无法输入或删除
- 控制台存在阻塞级异常

## 当前阶段建议

P0 先建立 editor public API 与最小自动化测试基线；IME、多光标、Markdown 闭环按后续阶段继续推进。