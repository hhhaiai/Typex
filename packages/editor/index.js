/*
 * @Author: caiwu
 * @Description:
 * @CreateDate:
 * @LastEditor:
 * @LastEditTime: 2022-08-31 17:12:53
 */
import mount from './mount'
import { createPath, Typex, utils } from '@typex/core'
import platform from '@typex/platform'
import formats from './formats'
import { mockData } from './data'
import toolBarOptions from './toolBar/toolBarOptions'

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

const MAX_DOCUMENT_DEPTH = 100

function isValidFormats(value) {
  return !value || utils.typeOf(value) === 'object'
}

function isValidNode(node, context = { seen: new WeakSet(), depth: 0 }) {
  if (utils.typeOf(node) !== 'object' || Array.isArray(node)) {
    return false
  }
  if (context.seen.has(node) || context.depth > MAX_DOCUMENT_DEPTH) {
    return false
  }
  context.seen.add(node)
  if (!('data' in node)) {
    return false
  }
  if (!isValidFormats(node.formats)) {
    return false
  }
  if (utils.typeOf(node.data) === 'string') {
    return true
  }
  if (utils.typeOf(node.data) !== 'array') {
    return false
  }
  return node.data.every((child) => isValidNode(child, { seen: context.seen, depth: context.depth + 1 }))
}

function isPlainObject(value) {
  return utils.typeOf(value) === 'object' && !Array.isArray(value)
}

function isValidMark(mark) {
  return isPlainObject(mark) && typeof mark.type === 'string' && (!('attrs' in mark) || isPlainObject(mark.attrs))
}

function isValidCanonicalNode(node, context = { seen: new WeakSet(), depth: 0, isRoot: false }) {
  if (!isPlainObject(node)) {
    return false
  }
  if (context.seen.has(node) || context.depth > MAX_DOCUMENT_DEPTH) {
    return false
  }
  context.seen.add(node)

  const hasChildren = 'children' in node
  const hasMarks = 'marks' in node
  const hasAttrs = 'attrs' in node
  const hasMeta = 'meta' in node

  if (context.isRoot) {
    if (node.version !== 1 || node.type !== 'document' || !Array.isArray(node.children)) {
      return false
    }
    if (hasAttrs && !isPlainObject(node.attrs)) {
      return false
    }
    return node.children.every((child) => isValidCanonicalNode(child, {
      seen: context.seen,
      depth: context.depth + 1,
      isRoot: false,
    }))
  }

  if (typeof node.type !== 'string' || typeof node.kind !== 'string') {
    return false
  }
  if (hasAttrs && !isPlainObject(node.attrs)) {
    return false
  }
  if (hasMeta && !isPlainObject(node.meta)) {
    return false
  }
  if (hasMarks) {
    if (!Array.isArray(node.marks) || !node.marks.every(isValidMark)) {
      return false
    }
  }

  if (node.kind === 'text') {
    return typeof node.text === 'string' && !hasChildren
  }

  if (node.kind === 'embed') {
    return hasAttrs ? isPlainObject(node.attrs) : true
  }

  if ((node.kind === 'block' || node.kind === 'inline') && Array.isArray(node.children)) {
    return node.children.every((child) => isValidCanonicalNode(child, {
      seen: context.seen,
      depth: context.depth + 1,
      isRoot: false,
    }))
  }

  return false
}

function isCanonicalDocument(data) {
  return isValidCanonicalNode(data, { seen: new WeakSet(), depth: 0, isRoot: true })
}

function assertValidValue(data) {
  if (!isValidNode(data) && !isCanonicalDocument(data)) {
    throw new Error('editor data 必须是合法的文档节点结构')
  }
}

function createLegacyParagraphDocument(text) {
  return {
    data: [
      {
        data: [
          {
            data: text,
            formats: {},
          },
        ],
        formats: {
          paragraph: true,
        },
      },
    ],
    formats: {
      root: true,
    },
  }
}

function createCanonicalParagraphDocument(text) {
  return {
    version: 1,
    type: 'document',
    children: [
      {
        kind: 'block',
        type: 'paragraph',
        children: [
          {
            kind: 'text',
            type: 'text',
            text,
          },
        ],
      },
    ],
  }
}

function getCanonicalBlockDescriptor(formats = {}) {
  if (formats.header) {
    return {
      type: 'heading',
      attrs: {
        level: Number(formats.header) || 1,
      },
    }
  }

  return {
    type: 'paragraph',
  }
}

function getCanonicalTextMarks(formats = {}) {
  const marks = []

  if (formats.bold) marks.push({ type: 'bold' })
  if (formats.italic) marks.push({ type: 'italic' })
  if (formats.underline) marks.push({ type: 'underline' })
  if (formats.deleteline) marks.push({ type: 'strike' })
  if (formats.code) marks.push({ type: 'code' })
  if (formats.sub) marks.push({ type: 'sub' })
  if (formats.sup) marks.push({ type: 'sup' })
  if (formats.color) marks.push({ type: 'color', attrs: { value: formats.color } })
  if (formats.background) marks.push({ type: 'background', attrs: { value: formats.background } })
  if (formats.fontSize) marks.push({ type: 'font_size', attrs: { value: formats.fontSize } })

  return marks
}

function getLegacyBlockFormats(node) {
  if (node.type === 'heading') {
    return {
      header: node.attrs?.level || 1,
    }
  }
  return {
    paragraph: true,
  }
}

function getLegacyTextFormats(node) {
  return (node.marks || []).reduce((formats, mark) => {
    if (mark.type === 'bold') formats.bold = true
    if (mark.type === 'italic') formats.italic = true
    if (mark.type === 'underline') formats.underline = true
    if (mark.type === 'strike') formats.deleteline = true
    if (mark.type === 'code') formats.code = true
    if (mark.type === 'sub') formats.sub = true
    if (mark.type === 'sup') formats.sup = true
    if (mark.type === 'color') formats.color = mark.attrs?.value
    if (mark.type === 'background') formats.background = mark.attrs?.value
    if (mark.type === 'font_size') formats.fontSize = mark.attrs?.value
    return formats
  }, {})
}

function canonicalNodeToLegacyNode(node) {
  if (node.kind === 'text') {
    return {
      data: node.text,
      formats: getLegacyTextFormats(node),
    }
  }

  if (node.kind === 'block') {
    return {
      data: (node.children || []).map(canonicalNodeToLegacyNode),
      formats: getLegacyBlockFormats(node),
    }
  }

  throw new Error(`暂不支持将 canonical 节点类型 ${node.type} 转换为 legacy 文档`)
}

function canonicalToLegacyDocument(document) {
  return {
    data: (document.children || []).map(canonicalNodeToLegacyNode),
    formats: {
      root: true,
    },
  }
}

function legacyNodeToCanonicalNode(node, context = { isRoot: false }) {
  if (context.isRoot) {
    return {
      version: 1,
      type: 'document',
      children: Array.isArray(node?.data)
        ? node.data.map((child) => legacyNodeToCanonicalNode(child, { isRoot: false }))
        : [],
    }
  }

  if (utils.typeOf(node?.data) === 'string') {
    const marks = getCanonicalTextMarks(node.formats || {})
    const textNode = {
      kind: 'text',
      type: 'text',
      text: node.data,
    }
    if (marks.length > 0) {
      textNode.marks = marks
    }
    return textNode
  }

  const { type, attrs } = getCanonicalBlockDescriptor(node?.formats || {})
  const blockNode = {
    kind: 'block',
    type,
    children: Array.isArray(node?.data)
      ? node.data.map((child) => legacyNodeToCanonicalNode(child, { isRoot: false }))
      : [],
  }

  if (attrs) {
    blockNode.attrs = attrs
  }

  return blockNode
}

function legacyToCanonicalDocument(document) {
  return legacyNodeToCanonicalNode(document, { isRoot: true })
}

function normalizeToolBarSelection(options = []) {
  if (utils.typeOf(options) !== 'array') {
    throw new Error('setToolBar 必须提供一个数组类型的参数')
  }

  return options
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .filter(Boolean)
}

function normalizeValue(data) {
  if (utils.typeOf(data) === 'string') {
    return {
      normalizedValue: createLegacyParagraphDocument(data),
      outputMode: 'legacy',
      pathValue: createLegacyParagraphDocument(data),
    }
  }
  if (data === undefined || data === null) {
    return {
      normalizedValue: mockData,
      outputMode: 'legacy',
      pathValue: mockData,
    }
  }
  if (isCanonicalDocument(data)) {
    return {
      normalizedValue: data,
      outputMode: 'canonical',
      pathValue: canonicalToLegacyDocument(data),
    }
  }
  return {
    normalizedValue: data,
    outputMode: 'legacy',
    pathValue: data,
  }
}

function getInitialValue(data) {
  const { normalizedValue, outputMode, pathValue } = normalizeValue(data)
  assertValidValue(normalizedValue)
  return {
    normalizedValue: cloneValue(normalizedValue),
    outputMode,
    pathValue: cloneValue(pathValue),
  }
}

function replaceRootPath(targetPath, sourcePath) {
  targetPath.node = sourcePath.node
  targetPath.parent = sourcePath.parent
  targetPath.index = sourcePath.index
  targetPath.prevSibling = sourcePath.prevSibling
  targetPath.nextSibling = sourcePath.nextSibling
  targetPath.children = sourcePath.children
  targetPath.rebuildFlag = sourcePath.rebuildFlag
  targetPath.children.forEach((child) => {
    child.parent = targetPath
  })
}

class Editor extends Typex {
  conamndHandles = {}
  toolBarOptions = toolBarOptions
  outputMode = 'legacy'
  documentValue = null
  constructor(options) {
    super({
      formats,
      plugins: [platform],
      ...options,
    })
    this.outputMode = options.outputMode || 'legacy'
    this.documentValue = cloneValue(options.documentValue || options.path.node)
    this.on('command', this.command)
    this.setToolBar(toolBarOptions)
  }
  mount (id) {
    mount.call(this, id)
    return this
  }
  setToolBar (options) {
    const selectedNames = normalizeToolBarSelection(options)
    this.conamndHandles = {}
    this.toolBarOptions = toolBarOptions.filter((e) => selectedNames.includes(e.name))
    this.toolBarOptions.forEach((toolItem) => {
      toolItem.editor = this
      this.conamndHandles[toolItem.name] = toolItem.commandHandle
    })
    return this
  }
  command (name, val) {
    const commandHandle = this.conamndHandles[name]
    if (typeof commandHandle !== 'function') return
    commandHandle(this, val)
  }
  execCommand (name, val) {
    this.command(name, val)
    return this
  }
  syncDocumentValue () {
    if (this.outputMode === 'canonical') {
      this.documentValue = legacyToCanonicalDocument(this.$path.node)
      return cloneValue(this.documentValue)
    }

    this.documentValue = cloneValue(this.$path.node)
    return cloneValue(this.documentValue)
  }
  notifyDocumentChange () {
    const nextValue = this.syncDocumentValue()
    this.emit('change', nextValue)
    return nextValue
  }
  getValue () {
    if (this.outputMode === 'canonical') {
      return cloneValue(this.documentValue)
    }
    return cloneValue(this.$path.node)
  }
  setValue (data) {
    const nextValue = getInitialValue(data)
    const nextPath = createPath(nextValue.pathValue)
    replaceRootPath(this.$path, nextPath)
    this.$path.$editor = this
    this.outputMode = nextValue.outputMode
    this.documentValue = cloneValue(nextValue.normalizedValue)
    this.resetInputState?.()
    this.selection.removeAllRanges()
    this.history.queue = []
    this.history.idx = -1
    this.$path.currentComponent?.update()
    this.notifyDocumentChange()
    return this
  }
}
export default function createEditor (options = {}) {
  const initialValue = getInitialValue(options.data)
  const path = createPath(initialValue.pathValue)
  return new Editor({
    ...options,
    path,
    outputMode: initialValue.outputMode,
    documentValue: initialValue.normalizedValue,
  })
}
