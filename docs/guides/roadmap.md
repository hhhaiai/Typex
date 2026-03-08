# Typex Roadmap

来源：`TYPEX项目梳理.md` 与 `Typex升级总体交付方案-v1.md`。

## 当前阶段目标

把 Typex 从“Demo 可跑”推进到“业务可接入的 Web 编辑器内核”。

## Phase 0

目标：
- 不破坏当前 demo
- 建立测试基线

工作：
- 为 Selection / Transaction / History 补测试
- 明确现有 API 行为
- 清理 demo 与库耦合点

## Phase 1

目标：
- document / transform / history 去 Web 依赖
- 打通 editor 对外 API

工作：
- 让 `createEditor(options.data)` 真正生效
- 补 `getValue()` / `setValue()` / `execCommand()`
- 拆 `pluginContext` 全局依赖
- 剥离模型层 UI 更新副作用

## Phase 2

目标：
- 平台无关 render plan
- Web 成为正式平台适配器

工作：
- 从 `Formater` 抽 render-core
- DOM patch 留在 platform-web
- Selection 依赖注入 platform adapter

## Phase 3

目标：
- 打通 Markdown / HTML / canonical doc

工作：
- 先做 CommonMark + GFM baseline
- 再接 Mermaid
- 再接 draw.io adapter

## Phase 4

目标：
- 形成正式 editor-kit 接入层

工作：
- `createEditor()` 放入 editor-kit
- demo 与产品接入分离
- 标准化命令、工具栏、事件

## Phase 5

目标：
- Flutter / RN / 原生平台 contract prototype

工作：
- 定义 platform contract
- 做 Flutter / RN 最小原型
- 评估投入产出比

## 当前最推荐的第一批改造

1. 让 `createEditor(options.data)` 真正生效
2. 增加 `getValue()` / `setValue()`
3. 抽离 `mockData` 默认逻辑
4. 统一 `execCommand()` 调用入口
5. 建立最小 JSON 输入输出基线
6. 为 selection / transaction / history 补测试

## 风险提示

- Selection 与 DOM 映射非常脆弱
- 输入法组合输入是高风险区域
- 多光标会放大所有边界问题
- 当前 editor、demo、core 仍有耦合

## 近期不做

- 不急着做 RN / Flutter 正式适配
- 不急着做协同编辑
- 不急着做过复杂的块级组件体系
