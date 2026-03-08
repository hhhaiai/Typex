# Typex Plugin And Extension Architecture

来源：
- `docs/specs/canonical-schema-spec.md`
- `docs/api/editor-kit-public-api.md`

## 1. 目标

定义 schema / command / parser / serializer / render token / embed 的扩展机制。

## 2. 扩展点

- schema extension
- command extension
- parser extension
- serializer extension
- render extension
- embed adapter extension

## 3. 原则

- 扩展不得破坏 canonical model
- 扩展不得绕过 command -> transaction -> dispatch 主链路
- 扩展必须声明兼容的 schema 和 adapter 版本

## 4. 冲突规则

- 同名扩展禁止覆盖 stable core 类型
- 必须使用命名空间避免冲突
- 优先级冲突必须明确化
