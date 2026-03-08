# ADR-003 Platform layer bridges host capabilities only

## Status
Accepted

## Decision
Platform 层只桥接宿主能力，不承载编辑语义。

## Rationale
- 编辑语义应保留在 document / schema / transform / command 层
- 平台层职责仅限渲染、选区、输入、IME、clipboard、caret 等宿主桥接
