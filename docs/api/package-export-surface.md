# Typex Package Export Surface

来源：
- `docs/architecture/package-contract-matrix.md`
- `docs/api/editor-kit-public-api.md`

## 1. 目标

本文定义目标 packages 的稳定导出面，区分 stable / experimental / internal-only。

## 2. 导出级别

- stable：业务可直接依赖
- experimental：可试用但不承诺稳定
- internal-only：禁止外部依赖

## 3. 目标 package 导出

### @typex/document
- stable: document types, builders, normalize helpers
- internal-only: low-level normalization internals

### @typex/schema
- stable: createSchema, defineNodeSpec, defineMarkSpec, validation helpers
- internal-only: schema merge internals

### @typex/transform
- stable: createTransaction, applyTransaction, invertTransaction, createHistory
- experimental: command compiler registration helpers
- internal-only: step internals

### @typex/render-core
- stable: buildRenderPlan, diffRenderPlan
- internal-only: grouping/token internals

### @typex/platform-*
- stable: createPlatformAdapter
- internal-only: host-specific DOM / widget bridge details

### @typex/parser-markdown / serializer-markdown
- stable: parse, serialize, diagnostics
- internal-only: tokenizer/formatting internals

### @typex/parser-html / serializer-html
- stable: parse, serialize, diagnostics
- internal-only: sanitization and normalization internals

### @typex/editor-kit
- stable: createEditor, editor instance API
- experimental: plugin registration helpers
- internal-only: runtime composition internals

## 4. Semver 规则

- stable 导出遵循 semver
- experimental 导出允许次版本调整
- internal-only 无兼容承诺
