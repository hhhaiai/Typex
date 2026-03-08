# Typex 升级总体交付方案 v1

## 1. 项目目标

将当前 `Typex` 从一个以 Web Demo 为主的富文本编辑器实验项目，升级为一套：

- **Node-first** 的富文本与 Markdown 引擎
- **Web-first** 的正式平台实现
- 后续可扩展到 **Flutter / Android / iOS / React Native**
- 支持 **富文本 + Markdown 双能力**
- 支持 **CommonMark / GFM 主线**
- 可扩展支持：
  - Mermaid 新老格式
  - `[topic]`
  - `[[]]` 图片 / wiki link 风格
  - draw.io XML
  - 历史 Markdown 方言
- 具备：
  - 清晰代码结构
  - 高性能
  - 低资源占用
  - 测试与验收体系
  - GitHub Pages 可部署演示

目标仓库：

- `https://github.com/hhhaiai/Typex`

最终演示部署目标：

- **当前仓库 GitHub Pages**

---

## 2. 当前现状判断

### 2.1 当前已有优势

当前代码库已经具备几个很有价值的内核资产：

- Path 树
- Selection / 多光标
- Step / Transaction / History
- 非 `contentEditable` 的输入桥接思路
- 格式分组渲染思路
- core / platform 初步分层

这些是后续重构的基础，不建议推倒重来。

### 2.2 当前主要问题

当前项目还不能直接称为“多端编辑器内核”，更准确地说是：

> **Web 编辑器内核 + Web 平台实现**

核心问题：

1. `core` 仍然依赖平台上下文，全局耦合偏重
2. 文档模型、渲染、UI 更新、副作用边界不清
3. `Formater` 职责过重
4. 输入法 / 事务 / 分发边界脆弱
5. 当前平台实现深度绑定 DOM / Selection / iframe input
6. `packages/editor` 同时承担 demo 和产品接入职责
7. Markdown 目前不能算完整支持，只能算“入口存在，能力未闭环”

---

## 3. 总体战略判断

### 3.1 正确方向

正确方向不是继续强化当前 Web 细节，而是抽象出：

- 平台无关 document model
- 平台无关 transform/history
- 平台无关 render-core
- parser / serializer / adapter 体系
- 面向业务的 editor-kit
- Web 首发平台
- 多端后续扩展

### 3.2 错误方向

不建议：

- 继续让模型层直接驱动 UI 更新
- 把 Markdown 方言兼容写死到 core
- 让平台层承载编辑语义
- 过早承诺 Flutter / RN 短期直接可用
- 把 draw.io XML 混进普通文本模型

---

## 4. 目标架构

建议采用 7 层架构。

### 4.1 `@typex/document`

职责：

- canonical document model
- block / inline / text / embed / selection snapshot
- 纯数据层
- 不依赖 DOM
- 不直接触发 UI 更新

### 4.2 `@typex/schema`

职责：

- 定义节点与 mark 的语义规则
- 统一 paragraph / heading / table / image / code_block / diagram / embed 等能力边界

### 4.3 `@typex/transform`

职责：

- operation / step / transaction / command
- history
- selection transform
- apply / invert / normalize

### 4.4 `@typex/render-core`

职责：

- document + schema -> render plan
- 平台无关的渲染中间层
- 沉淀当前 Formater 的通用算法

### 4.5 `@typex/platform-*`

首发：

- `@typex/platform-web`

后续：

- `@typex/platform-flutter`
- `@typex/platform-rn`

职责仅限：

- 宿主渲染
- 选区桥接
- 输入桥接
- IME
- clipboard
- caret / overlay

### 4.6 `@typex/parser-*` / `@typex/serializer-*`

例如：

- parser-markdown
- serializer-markdown
- parser-html
- serializer-html
- adapter-drawio

原则：

> parser / serializer 是 adapter，不是 core

### 4.7 `@typex/editor-kit`

职责：

- `createEditor`
- command 注册
- preset schema
- 外部 API
- 与业务接入对齐

### 4.8 `apps/editor-demo`

职责：

- GitHub Pages demo
- 手工验证
- 示例能力展示
- 不承载产品 API 边界

---

## 5. 关键 ADR 决策

### ADR-001
采用 **Node-first canonical document model**

### ADR-002
Parser / Serializer 作为 **adapter**，不进入 core

### ADR-003
Platform 层只桥接宿主能力，不承载编辑语义

### ADR-004
Mermaid / draw.io 采用 **source-first** 语义块节点

### ADR-005
采用 **Web-first，Flutter/RN 后置** 的推进顺序

### ADR-006
所有 command 都必须编译为 transaction / operation

### ADR-007
采用 **一个 canonical schema，对应多个 syntax adapters**

这些 ADR 已经足以支撑后续详细设计。

---

## 6. Markdown / 富文本支持策略

### 6.1 总原则

- 内部 canonical model 只有一份
- Markdown 只是导入导出视图之一
- CommonMark + GFM 是主线
- 历史语法与特殊格式通过 parser plugin / serializer adapter 承担
- 不让方言污染 core

### 6.2 第一阶段支持范围

优先支持：

- 标题
- 段落
- 引用
- 粗体 / 斜体 / 删除线
- 行内代码
- 链接
- 列表 / 任务列表
- 代码块
- 表格
- 图片
- 分割线
- 硬换行

### 6.3 第二阶段扩展

- Mermaid fenced block
- 历史 wiki link / topic 语法
- 特殊 markdown 扩展块
- 基础 HTML fallback

### 6.4 第三阶段扩展

- draw.io adapter
- 更复杂 embed 协议
- 更高保真的 round-trip 策略

---

## 7. Mermaid / draw.io / 特殊语法策略

### 7.1 Mermaid

内部节点建议：

```json
{
  "type": "diagram",
  "dialect": "mermaid",
  "source": "graph TD; A-->B"
}
```

原则：

- 存源码
- 不只存 SVG
- 预览结果属于派生数据

### 7.2 draw.io XML

内部节点建议：

```json
{
  "type": "embed",
  "kind": "drawio",
  "sourceXml": "<mxfile>...</mxfile>",
  "meta": {}
}
```

原则：

- 保留原始 XML
- 短期以嵌入 / 预览 / 导出为主
- 不视为普通段落文本

### 7.3 `[topic]` / `[[]]`

建议策略：

- 作为 parser plugin 处理
- 映射为 link / embed / custom inline node
- 不直接污染核心 schema 主线

---

## 8. 多端支持策略

### 8.1 准确结论

短期不能说“Flutter / RN / iOS / Android 都直接可用”。

正确结论是：

> **共用核心，不共用当前 Web 平台实现**

### 8.2 可复用部分

未来可复用：

- document
- schema
- transform
- history
- render-core
- parser / serializer

### 8.3 不可复用部分

不可直接复用：

- DOM patch
- 浏览器 Selection
- iframe input
- Web IME 处理
- Web caret / overlay

### 8.4 多端推进顺序

建议：

1. 先把 Web 做成正式平台
2. 抽离纯核心
3. 定 platform contract
4. 做 Flutter / RN 原型
5. 再进入原生平台级优化

---

## 9. GitHub Pages 部署方案

### 9.1 目标

最终将以下内容部署到当前仓库 GitHub Pages：

- editor demo
- 架构文档
- 验收文档
- API / 使用文档

### 9.2 部署原则

- demo 与核心包解耦
- GitHub Pages 只承载静态产物
- 所有资源支持 GitHub Pages 子路径
- Mermaid 前端惰性加载
- draw.io 优先预览 / 链接 / 占位展示
- 文档和 demo 可共存

### 9.3 Pages 展示内容建议

- 首页介绍
- 在线 demo
- Markdown / 富文本演示
- Mermaid 示例
- draw.io 嵌入示例
- 架构图
- 质量验收说明

---

## 10. QA / 验收体系

已落地文档：

- `TYPEX质量验收体系.md`

### 10.1 P0 必过

- 基础输入
- 删除
- 选区同步
- 撤销 / 重做
- 单光标编辑

### 10.2 P1 必过

- 多光标去重与同步
- IME 合成输入
- 跨节点删除
- 工具栏格式操作

### 10.3 P2 观察项

- Markdown 双向转换
- 跨浏览器差异
- 异常焦点切换
- 多平台风险项

### 10.4 测试分层

- 单元测试：document / transform / history / selection
- 集成测试：事件分发链路
- UI/E2E：editor 实际编辑流
- GitHub Pages demo 验证：必做

---

## 11. 分阶段实施路线

### Phase 0：稳住现有内核

目标：

- 不破坏当前 demo
- 建立测试基线

工作：

- 给 Selection / Transaction / History / Path 补测试
- 明确现有 API 行为
- 清理 demo 与库耦合点

### Phase 1：抽纯核心

目标：

- document / transform / history 去 Web 依赖

工作：

- 拆 `pluginContext` 全局依赖
- 剥离模型层 UI 更新副作用
- 纯化 command -> transaction -> apply 路径

### Phase 2：拆 render-core 与 platform-web

目标：

- 平台无关 render plan
- Web 成为正式平台适配器

工作：

- 从 Formater 抽 render-core
- DOM patch 留在 platform-web
- Selection 依赖注入 platform adapter

### Phase 3：建立 parser / serializer

目标：

- 打通 Markdown / HTML / canonical doc

工作：

- 先做 CommonMark + GFM baseline
- 接 Mermaid
- 接 draw.io adapter

### Phase 4：建立 editor-kit 与 demo 分离

目标：

- 形成正式接入层

工作：

- `createEditor()` 放入 editor-kit
- `packages/editor` 迁为 demo/app
- 标准化命令、工具栏、事件

### Phase 5：多端预研与原型

目标：

- Flutter / RN / 原生平台的 contract prototype

工作：

- 定义 platform contract
- 做 Flutter/RN 最小原型
- 评估投入产出比

---

## 12. P0 / P1 / P2 任务建议

### P0

- 抽 document / transform / history 纯核心
- 标准化 editor public API
- 建最小 schema
- 建 Markdown round-trip baseline
- 建核心单测基线
- 保住 GitHub Pages demo 入口可运行

### P1

- 拆 render-core / platform-web
- clipboard / paste pipeline
- mermaid block
- parser-markdown / serializer-markdown 初版
- demo 与 editor-kit 分离

### P2

- draw.io adapter
- HTML parser / serializer
- Flutter / RN platform contract prototype
- 协同编辑 feasibility study

---

## 13. 推荐仓库目标结构

```text
packages/
  typex-document/
  typex-schema/
  typex-transform/
  typex-render-core/
  typex-platform-web/
  typex-platform-flutter/
  typex-platform-rn/
  typex-parser-markdown/
  typex-serializer-markdown/
  typex-parser-html/
  typex-serializer-html/
  typex-adapter-drawio/
  typex-editor-kit/

apps/
  editor-demo/

docs/
  architecture/
  adr/
  api/
  guides/
  quality/

tests/
  unit/
  integration/
  e2e/
```

---

## 14. 关键风险

1. **Selection 与宿主映射** 是最高风险区域
2. **IME 输入法** 是高复杂度区域
3. **多光标** 会放大所有边界问题
4. **draw.io** 完整编辑成本很高，短期不应过度承诺
5. **GitHub Pages** 适合演示，不应成为核心架构约束
6. 若继续维持“模型层直接触发 UI 更新”，会阻碍 Node-first 和多端演进

---

## 15. 最终交付物清单

第一阶段目标交付：

- 升级后的总体方案文档
- 架构文档
- ADR 文档
- Mermaid 架构图 / 路线图
- QA / 验收体系文档
- GitHub Pages 可运行 demo
- 清晰的 editor public API
- Markdown baseline 能力
- 核心测试基线
- 分阶段实施与排期建议

第二阶段目标交付：

- 更完整的 Markdown 兼容能力
- Mermaid 支持
- draw.io adapter 初版
- platform contract prototype
- 更完整的验收报告 / 功能报告

---

## 16. 结论

Typex 的正确演进方向已经明确：

> **不是继续强化当前 Web Demo 细节，而是沉淀为一套 Node-first、平台无关、Web 首发、Markdown/富文本双支持、可扩展到多端的编辑器引擎体系。**

短期最重要的不是“立刻支持所有端”，而是：

- 抽纯核心
- 明确 canonical model
- 建立 parser / serializer 边界
- 建立 render-core
- 做好 GitHub Pages demo
- 建立 QA / 验收体系
- 让工程真正可维护、可验证、可持续演进
