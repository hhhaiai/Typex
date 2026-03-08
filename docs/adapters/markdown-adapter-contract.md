# Typex Markdown Adapter Contract

来源：
- `docs/specs/canonical-document-model.md`
- `docs/specs/canonical-schema-spec.md`
- `docs/adr/ADR-002-parser-serializer-as-adapters.md`

## 1. 目标

本文定义 Markdown <-> canonical document 的适配契约。

## 2. 基线范围

第一阶段基线：
- CommonMark
- GFM 基础能力
- heading / paragraph / quote / list / code / link / image / table / task list

## 3. Round-trip 等级

- Exact：完全无损
- Canonical-preserving：语义无损但语法可规范化
- Lossy-with-diagnostics：允许有损，但必须返回 diagnostics

## 4. 特殊语法

扩展但不污染 core：
- wiki-link `[[...]]`
- topic/tag 语法 `[topic]`
- Mermaid fenced block
- draw.io source embed

## 5. 输入输出

```ts
parse(markdown: string): { document: TypexDocument, diagnostics?: string[] }
serialize(document: TypexDocument): { markdown: string, diagnostics?: string[] }
```

## 6. 安全规则

- 原始 HTML 片段必须按 HTML adapter 的安全策略处理
- 不信任外部 markdown 内联 HTML

## 7. 测试站点要求

测试站点右侧预览的 markdown 模式至少支持：
- paragraph
- heading
- bold/italic
- list
- code block
- link
- safe escaping
