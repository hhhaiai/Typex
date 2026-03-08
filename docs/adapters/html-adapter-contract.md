# Typex HTML Adapter Contract

来源：
- `docs/specs/canonical-document-model.md`
- `docs/quality/security-and-sanitization-policy.md`

## 1. 目标

定义 HTML <-> canonical document 的导入导出契约。

## 2. 导入规则

- 仅允许白名单标签与属性
- 未支持结构应降级为 text / paragraph / diagnostics
- script / unsafe protocol / event handler 必须移除或拒绝

## 3. 导出规则

- 导出 HTML 必须遵循 canonical schema
- 不导出平台私有属性
- embed 预览导出与 source 持久化分离

## 4. Diagnostics

- sanitize removal
- unsupported node fallback
- lossy conversion warning
