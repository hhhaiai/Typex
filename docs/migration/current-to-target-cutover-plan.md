# Typex Current-To-Target Cutover Plan

来源：
- `docs/guides/roadmap.md`
- `docs/guides/master-delivery-plan.md`
- `docs/architecture/package-contract-matrix.md`

## 1. 目标

定义当前 `@typex-core` / `@typex-platform` / `packages/editor` 向目标 packages 演进的切换路径。

## 2. 当前到目标映射

- `packages/@typex-core/model/path.js` -> `@typex/document` / `@typex/schema` / `@typex/transform` 的拆分来源
- `packages/@typex-core/model/formater.js` -> `@typex/render-core`
- `packages/@typex-platform/web/*` -> `@typex/platform-web`
- `packages/editor/*` -> `@typex/editor-kit` + `apps/editor-demo`

## 3. 分阶段切换

### Phase 0
- 建立测试基线
- 稳住现有 public API

### Phase 1
- 抽 canonical document / schema / transform 边界
- 清理全局 platform 注入

### Phase 2
- 提取 render-core
- 正式化 platform-web contract

### Phase 3
- 建立 markdown/html adapter baseline

### Phase 4
- 拆 editor-kit 与 demo

### Phase 5
- 验证 Flutter / RN / 原生 contract prototype

## 4. 回滚规则

- 每阶段 cutover 必须保留可验证基线
- 若 selection / input / undo / render 退化，必须回退到上阶段稳定点
