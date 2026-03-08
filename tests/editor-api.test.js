/** @jest-environment jsdom */

jest.mock('../packages/editor/mount', () => ({
  __esModule: true,
  default: jest.fn(function mockMount() {
    return this
  }),
}))

jest.mock('@typex/platform', () => {
  const platform = {
    nativeSelection: {
      rangeCount: 0,
      getRangeAt: jest.fn(),
      isCollapsed: true,
      collapse: jest.fn(),
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
      focusNode: null,
      focusOffset: 0,
    },
    appendChild: jest.fn((parentNode, newNode) => parentNode.appendChild(newNode)),
    initIntercept: jest.fn(),
  }

  platform.install = (pluginContext) => {
    pluginContext.platform = platform
    return platform.initIntercept
  }

  return {
    __esModule: true,
    default: platform,
  }
})

import createEditor from '../packages/editor/index'
import { mockData } from '../packages/editor/data'

describe('editor public api baseline', () => {
  beforeAll(() => {
    if (!global.crypto) {
      global.crypto = {}
    }
    if (!global.crypto.getRandomValues) {
      global.crypto.getRandomValues = (typedArray) => {
        typedArray[0] = 1
        return typedArray
      }
    }
  })

  test('uses provided data instead of always falling back to mockData', () => {
    const customData = {
      data: [
        {
          data: [
            {
              data: 'custom text',
              formats: {},
            },
          ],
          formats: {
            paragraph: true,
          },
        },
      ],
      formats: {},
    }

    const editor = createEditor({ data: customData })

    expect(editor.getValue()).toEqual(customData)
    expect(editor.getValue()).not.toEqual(mockData)
  })

  test('falls back to mockData when no data is provided', () => {
    const editor = createEditor()

    expect(editor.getValue()).toEqual(mockData)
  })

  test('normalizes empty string input into an empty paragraph document', () => {
    const editor = createEditor({ data: '' })

    expect(editor.getValue()).toEqual({
      data: [
        {
          data: [
            {
              data: '',
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
    })
  })

  test('execCommand delegates to existing command pipeline', () => {
    const editor = createEditor()
    const commandSpy = jest.spyOn(editor, 'command').mockImplementation(() => {})

    editor.execCommand('bold', true)

    expect(commandSpy).toHaveBeenCalledWith('bold', true)
  })

  test('setValue replaces current document value', () => {
    const editor = createEditor()
    const nextData = {
      data: [
        {
          data: [
            {
              data: 'replaced text',
              formats: {
                bold: true,
              },
            },
          ],
          formats: {
            paragraph: true,
          },
        },
      ],
      formats: {},
    }

    editor.setValue(nextData)

    expect(editor.getValue()).toEqual(nextData)
  })

  test('setValue emits a change event with the normalized document value', () => {
    const editor = createEditor()
    const changeHandler = jest.fn()
    const nextData = {
      data: [
        {
          data: [
            {
              data: 'Heading text',
              formats: {},
            },
          ],
          formats: {
            header: 1,
          },
        },
      ],
      formats: {
        root: true,
      },
    }

    editor.on('change', changeHandler)
    editor.setValue(nextData)

    expect(changeHandler).toHaveBeenCalledWith(nextData)
    expect(editor.getValue()).toEqual(nextData)
  })

  test('accepts canonical document input and preserves canonical output mode', () => {
    const canonicalDocument = {
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
              text: 'canonical text',
            },
          ],
        },
      ],
    }

    const editor = createEditor({ data: canonicalDocument })

    expect(editor.getValue()).toEqual(canonicalDocument)
  })

  test('setValue accepts canonical document input and emits canonical change payload', () => {
    const editor = createEditor()
    const changeHandler = jest.fn()
    const canonicalDocument = {
      version: 1,
      type: 'document',
      children: [
        {
          kind: 'block',
          type: 'heading',
          attrs: {
            level: 1,
          },
          children: [
            {
              kind: 'text',
              type: 'text',
              text: 'Canonical heading',
              marks: [
                {
                  type: 'bold',
                },
              ],
            },
          ],
        },
      ],
    }

    editor.on('change', changeHandler)
    editor.setValue(canonicalDocument)

    expect(changeHandler).toHaveBeenCalledWith(canonicalDocument)
    expect(editor.getValue()).toEqual(canonicalDocument)
  })

  test('clones canonical input on createEditor and setValue', () => {
    const canonicalDocument = {
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
              text: 'outside',
            },
          ],
        },
      ],
    }

    const editor = createEditor({ data: canonicalDocument })
    canonicalDocument.children[0].children[0].text = 'mutated after create'

    expect(editor.getValue()).toEqual({
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
              text: 'outside',
            },
          ],
        },
      ],
    })

    const nextCanonicalDocument = {
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
              text: 'set value',
            },
          ],
        },
      ],
    }

    editor.setValue(nextCanonicalDocument)
    nextCanonicalDocument.children[0].children[0].text = 'mutated after setValue'

    expect(editor.getValue()).toEqual({
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
              text: 'set value',
            },
          ],
        },
      ],
    })
  })

  test('returns defensive copies for canonical values', () => {
    const canonicalDocument = {
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
              text: 'immutable output',
            },
          ],
        },
      ],
    }

    const editor = createEditor({ data: canonicalDocument })
    const firstValue = editor.getValue()
    firstValue.children[0].children[0].text = 'polluted'

    expect(editor.getValue()).toEqual(canonicalDocument)
  })

  test('accepts canonical empty document input without falling back to mockData', () => {
    const canonicalEmptyDocument = {
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
              text: '',
            },
          ],
        },
      ],
    }

    const editor = createEditor({ data: canonicalEmptyDocument })

    expect(editor.getValue()).toEqual(canonicalEmptyDocument)
    expect(editor.getValue()).not.toEqual(mockData)
  })

  test('canonical output mode stays in sync after live document changes', () => {
    const canonicalDocument = {
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
              text: 'before edit',
            },
          ],
        },
      ],
    }

    const editor = createEditor({ data: canonicalDocument })
    const changeHandler = jest.fn()

    editor.on('change', changeHandler)
    editor.$path.node.data[0].data[0].data = 'after edit'
    editor.notifyDocumentChange()

    const expectedDocument = {
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
              text: 'after edit',
            },
          ],
        },
      ],
    }

    expect(editor.getValue()).toEqual(expectedDocument)
    expect(changeHandler).toHaveBeenCalledWith(expectedDocument)
  })

  test('rejects invalid canonical document data', () => {
    expect(() => createEditor({
      data: {
        version: 1,
        type: 'document',
        children: [
          {
            kind: 'text',
            type: 'text',
            children: [],
          },
        ],
      },
    })).toThrow('editor data 必须是合法的文档节点结构')
  })

  test('rejects invalid document data', () => {
    expect(() => createEditor({ data: { foo: 'bar' } })).toThrow('editor data 必须是合法的文档节点结构')
  })

  test('setValue rejects invalid document data', () => {
    const editor = createEditor()

    expect(() => editor.setValue({ foo: 'bar' })).toThrow('editor data 必须是合法的文档节点结构')
  })
})
