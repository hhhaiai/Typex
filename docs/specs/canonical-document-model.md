# Typex Canonical Document Model

来源：
- `docs/architecture/target-architecture.md`
- `docs/architecture/package-contract-matrix.md`
- `docs/adr/ADR-001-node-first-canonical-document-model.md`
- `docs/adr/ADR-004-source-first-diagram-and-embed-nodes.md`
- `docs/adr/ADR-007-one-canonical-schema-many-syntax-adapters.md`

## 1. 目标

本文定义 Typex 的唯一 canonical document model。它是富文本、Markdown、HTML、Mermaid、draw.io 等所有视图与适配器共享的内部源数据模型。

设计目标：
- 与平台无关
- 与语法无关
- 与渲染无关
- 能表达富文本、结构化块、嵌入节点与选择快照
- 能作为 parser / serializer / runtime / history 的共同基础

## 2. 非目标

canonical document model 不包含：
- DOM 节点
- 浏览器 Selection / Range
- Flutter / RN / 原生宿主对象
- 组件实例
- VDOM / render token
- parser tokenizer 状态
- 预览图、SVG、HTML 缓存等派生结果

## 3. 顶层结构

唯一合法的文档根节点类型为 `document`。

建议结构：

```ts
interface TypexDocument {
  version: 1
  type: 'document'
  attrs?: Record<string, unknown>
  children: TypexNode[]
}
```

约束：
- `document.children` 只能包含 block-level 节点
- 根节点不能为空对象；空文档必须有规范化结果
- 任何持久化文档都必须包含 `version`

## 4. 节点分类

canonical node 分为五类：
1. document
2. block
3. inline container
4. text
5. embed

建议共享结构：

```ts
interface BaseNode {
  type: string
  attrs?: Record<string, unknown>
  marks?: TypexMark[]
  meta?: Record<string, unknown>
}
```

### 4.1 Block node

```ts
interface BlockNode extends BaseNode {
  kind: 'block'
  children: Array<BlockNode | InlineNode | TextNode | EmbedNode>
}
```

### 4.2 Inline node

```ts
interface InlineNode extends BaseNode {
  kind: 'inline'
  children: Array<InlineNode | TextNode | EmbedNode>
}
```

### 4.3 Text node

```ts
interface TextNode extends BaseNode {
  kind: 'text'
  text: string
}
```

约束：
- `text` 节点不能再有 `children`
- `text` 可以带 `marks`
- 空字符串节点是否允许由 schema 和 normalize 共同决定

### 4.4 Embed node

```ts
interface EmbedNode extends BaseNode {
  kind: 'embed'
  source: {
    format: string
    data: unknown
  }
  preview?: {
    status?: 'none' | 'pending' | 'ready' | 'failed'
    mime?: string
    data?: unknown
  }
}
```

约束：
- embed 节点必须 source-first
- `source` 是主存储
- `preview` 是派生结果，不参与 canonical round-trip 保证

## 5. Mark 结构

mark 仅表示文本或 inline 语义修饰，不表示 block 结构。

```ts
interface TypexMark {
  type: string
  attrs?: Record<string, unknown>
}
```

规则：
- marks 顺序应被规范化
- 重复 mark 不允许存在
- mark 的兼容性由 schema 决定

## 6. 推荐核心节点族

首批 canonical schema 至少应支持：
- `paragraph`
- `heading`
- `blockquote`
- `ordered_list`
- `bullet_list`
- `list_item`
- `task_list`
- `task_item`
- `code_block`
- `table`
- `table_row`
- `table_cell`
- `image`
- `link`
- `diagram`
- `embed`
- `text`

首批 marks 至少应支持：
- `bold`
- `italic`
- `underline`
- `strike`
- `code`
- `sub`
- `sup`
- `color`
- `background`
- `font_size`

## 7. 路径与定位

canonical model 不直接存储运行时 Path 实例，但所有节点必须能被稳定路径定位。

建议路径表达：

```ts
type NodePath = number[]
```

规则：
- 根节点路径固定为 `[]`
- 子节点路径通过 children index 追加形成
- Path 仅作为定位协议，不是 runtime class 的泄漏
- 所有 selection / operation / render plan 定位都必须能映射到 `NodePath`

## 8. 规范化规则

normalize 后必须满足：
1. 文档根节点永远是 `document`
2. 根下只能有 block nodes
3. text 节点不能有 children
4. embed 节点必须有 `source`
5. 不允许 null / undefined children
6. 不允许循环引用
7. mark 列表去重并排序稳定
8. schema 不允许的空容器应被修复或移除
9. 空文档规范化为最小合法文档

最小合法文档建议：

```json
{
  "version": 1,
  "type": "document",
  "children": [
    {
      "kind": "block",
      "type": "paragraph",
      "children": [
        {
          "kind": "text",
          "type": "text",
          "text": ""
        }
      ]
    }
  ]
}
```

## 9. Source-first embed 规则

Mermaid、draw.io XML、未来 diagram/embed 节点必须遵守：
- 原始源文本 / XML 是 canonical source
- 渲染出的 SVG/HTML/bitmap 不是 source
- preview 失败不能破坏 source
- parser / serializer round-trip 必须优先保留 source

示例：

```json
{
  "kind": "embed",
  "type": "diagram",
  "attrs": {
    "engine": "mermaid"
  },
  "source": {
    "format": "text/mermaid",
    "data": "graph TD; A-->B;"
  },
  "preview": {
    "status": "ready",
    "mime": "image/svg+xml"
  }
}
```

## 10. 与语法 adapter 的关系

- Markdown / HTML / wiki-link / topic / Mermaid / draw.io 都只是 adapter
- adapter 负责 syntax <-> canonical document 的映射
- canonical model 不感知来源语法细节
- 历史语法兼容不能污染 canonical node 类型

## 11. 与 runtime 的关系

runtime 只读写 canonical document：
- command 编译到 transaction
- transaction 作用于 canonical document
- history 存储 document 变更语义
- render-core 从 canonical document 生成 render plan

## 12. 版本与兼容

建议：
- 文档持久化必须带 `version`
- 大版本结构变化通过 migration 处理
- parser / serializer 应根据 version 做兼容转换或给出 diagnostics

## 13. 示例

### 13.1 段落文本

```json
{
  "version": 1,
  "type": "document",
  "children": [
    {
      "kind": "block",
      "type": "paragraph",
      "children": [
        {
          "kind": "text",
          "type": "text",
          "text": "Hello Typex"
        }
      ]
    }
  ]
}
```

### 13.2 标题 + 加粗文本

```json
{
  "version": 1,
  "type": "document",
  "children": [
    {
      "kind": "block",
      "type": "heading",
      "attrs": { "level": 2 },
      "children": [
        {
          "kind": "text",
          "type": "text",
          "text": "Design",
          "marks": [{ "type": "bold" }]
        }
      ]
    }
  ]
}
```

## 14. 验证要求

该模型定稿前必须验证：
- 能覆盖 roadmap 中的首批格式
- 能承载 Markdown / HTML baseline
- 能承载 source-first embed
- 能脱离 DOM/Path class 独立存在
- 能被 selection / operation / render plan 共同引用
