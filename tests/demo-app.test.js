/** @jest-environment jsdom */

import { createDemoApp } from '../src/demo/app'

describe('demo app', () => {
  function createEditorMock(initialValue) {
    const listeners = {}
    const editor = {
      setToolBar: jest.fn(() => editor),
      mount: jest.fn(() => editor),
      getValue: jest.fn(() => initialValue),
      on: jest.fn((eventName, handler) => {
        listeners[eventName] = handler
      }),
      emitChange(nextValue) {
        listeners.change?.(nextValue)
      },
    }

    return editor
  }

  function createDemoDOM() {
    document.body.innerHTML = `
      <div class="demo-tabs">
        <button class="demo-tab demo-tab--active" data-demo-target="editor">Editor</button>
        <button class="demo-tab" data-demo-target="markdown">Markdown</button>
      </div>
      <section class="demo-subview demo-subview--active" data-demo-panel="editor">
        <div id="editor-root"></div>
        <div id="preview-root-editor"></div>
      </section>
      <section class="demo-subview" data-demo-panel="markdown" hidden>
        <textarea id="markdown-input"></textarea>
        <div id="preview-root-markdown"></div>
      </section>
    `
  }

  test('mounts the editor and renders the initial rich text preview', () => {
    createDemoDOM()

    const editor = createEditorMock({
      data: [
        {
          data: [
            {
              data: 'hello world',
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

    createDemoApp({
      createEditorImpl: jest.fn(() => editor),
      documentRef: document,
      windowRef: window,
    })

    expect(editor.setToolBar).toHaveBeenCalled()
    expect(editor.mount).toHaveBeenCalledWith('editor-root')
    expect(document.getElementById('preview-root-editor').innerHTML).toContain('hello world')
    expect(document.getElementById('preview-root-markdown').innerHTML).toContain('Markdown Demo')
  })

  test('updates rich text preview when the editor emits a change event', () => {
    createDemoDOM()

    const editor = createEditorMock({
      data: [
        {
          data: [
            {
              data: 'before update',
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

    createDemoApp({
      createEditorImpl: jest.fn(() => editor),
      documentRef: document,
      windowRef: window,
    })

    editor.emitChange('# Updated\n\n**preview**')

    expect(document.getElementById('preview-root-editor').innerHTML).toContain('<h1>Updated</h1>')
    expect(document.getElementById('preview-root-editor').innerHTML).toContain('<strong>preview</strong>')
  })

  test('updates markdown preview when markdown textarea input changes', () => {
    createDemoDOM()

    const editor = createEditorMock({
      data: [
        {
          data: [
            {
              data: 'editor content',
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

    createDemoApp({
      createEditorImpl: jest.fn(() => editor),
      documentRef: document,
      windowRef: window,
    })

    const markdownInput = document.getElementById('markdown-input')
    markdownInput.value = '# Markdown\n\nHello **Typex**'
    markdownInput.dispatchEvent(new window.Event('input', { bubbles: true }))

    expect(document.getElementById('preview-root-markdown').innerHTML).toContain('<h1>Markdown</h1>')
    expect(document.getElementById('preview-root-markdown').innerHTML).toContain('<strong>Typex</strong>')
  })

  test('switches demo subviews when demo tab changes', () => {
    createDemoDOM()

    const editor = createEditorMock({
      data: [
        {
          data: [
            {
              data: 'editor content',
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

    const app = createDemoApp({
      createEditorImpl: jest.fn(() => editor),
      documentRef: document,
      windowRef: window,
    })

    document.querySelector('[data-demo-target="markdown"]').click()

    expect(app.demoTabs.getActiveTab()).toBe('markdown')
    expect(document.querySelector('[data-demo-panel="markdown"]').hidden).toBe(false)
    expect(document.querySelector('[data-demo-panel="editor"]').hidden).toBe(true)
  })
})
