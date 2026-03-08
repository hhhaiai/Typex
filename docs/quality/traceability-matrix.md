# Typex Traceability Matrix

| 架构要求 | 规范文档 | 实现层 | 测试层 | 验收层 |
|---|---|---|---|---|
| canonical document model | canonical-document-model.md | document/schema | unit/integration | P0 |
| command -> transaction 单路径 | transaction-and-operation-spec.md | transform/runtime | unit/integration | P0 |
| selection 脱离 DOM | selection-snapshot-spec.md | selection/runtime/platform | integration/e2e | P0/P1 |
| render-core 平台无关 | render-plan-schema.md | render-core/platform | unit/integration | P1 |
| markdown/html adapter | markdown/html adapter contract | parser/serializer | adapter/roundtrip | P2 |
| source-first embed | source-first-embed-spec.md | adapter/embed | adapter/integration | P2 |
| 安全导入 | security-and-sanitization-policy.md | html/markdown/paste/drop | security/integration | release gate |
