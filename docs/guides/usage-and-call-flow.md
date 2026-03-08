# Typex Usage And Call Flow

来源：根目录 `TYPEX项目梳理.md`。

## 项目定位

Typex 不是开箱即用的富文本产品，而是一套：
- 编辑器内核
- 平台适配层
- 示例编辑器应用

它强调：
- 不依赖 `contentEditable`
- 不依赖 `document.execCommand`
- 自定义数据模型驱动编辑
- 平台层与内核层解耦

## 当前最直接的使用方式

当前 Demo 入口位于 `src/index.js:23`：

```js
window.editor = createEditor({
  data: 'hello world',
})
  .setToolBar(toolBar)
  .mount('editor-root')
```

挂载容器位于 `index.html:24`。

## 初始化主链路

### 1. 入口层
`src/index.js` 调用：
- `createEditor()`
- `setToolBar(...)`
- `mount('editor-root')`

### 2. Editor 组装层
`packages/editor/index.js:23` 中：
- `Editor` 继承 `Typex`
- 构造时注入 `formats`
- 注入 `plugins: [platform]`
- 绑定 command 事件

### 3. Core 初始化层
`packages/@typex-core/Typex.js:15` 调用 `initCore()`，初始化：
- Formater
- History
- Plugin
- Selection
- Intercept
- Dispatcher

### 4. 插件安装层
`packages/@typex-platform/index.js:6`：
- 把 core 注入平台上下文
- 把 web 能力挂到 `pluginContext.platform`
- 返回平台拦截初始化函数

### 5. 挂载层
`packages/editor/mount.js:29`：
- 渲染工具栏
- 渲染编辑内容
- 通过 `patch()` 生成 DOM
- append 到目标容器

## 当前亮点

- 自绘光标、模拟输入
- 支持多光标
- 组件化格式系统
- 事务与历史记录机制
- 平台层与内核层分离

## 当前限制

- 当前正式平台实现仍然只有 Web
- Markdown 还没有形成完整导入导出闭环
- `packages/editor` 同时承担 demo 与产品接入职责
- editor/core/platform 之间仍有较强耦合

## 当前 P0 重点

P0 第一批最关键改造：
1. 让 `createEditor(options.data)` 真正生效
2. 增加 `getValue()` / `setValue()`
3. 抽离 `mockData` 默认逻辑
4. 统一 `execCommand()` 调用入口
5. 为 selection / transaction / history 建立测试基线
