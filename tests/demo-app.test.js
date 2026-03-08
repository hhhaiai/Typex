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

  test('mounts the editor on the left and renders the initial preview on the right', () => {
    document.body.innerHTML = `
      <div id="demo-app">
        <div class="demo-pane demo-pane--editor">
          <div id="editor-root"></div>
          <textarea id="markdown-input"></textarea>
        </div>
        <div class="demo-pane demo-pane--preview">
          <div id="preview-root"></div>
        </div>
      </div>
    `

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
    expect(document.getElementById('preview-root').innerHTML).toContain('hello world')
  })

  test('updates preview when the editor emits a change event', () => {
    document.body.innerHTML = `
      <div id="demo-app">
        <div class="demo-pane demo-pane--editor">
          <div id="editor-root"></div>
          <textarea id="markdown-input"></textarea>
        </div>
        <div class="demo-pane demo-pane--preview">
          <div id="preview-root"></div>
        </div>
      </div>
    `

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

    expect(document.getElementById('preview-root').innerHTML).toContain('<h1>Updated</h1>')
    expect(document.getElementById('preview-root').innerHTML).toContain('<strong>preview</strong>')
  })

  test('updates preview when markdown textarea input changes', () => {
    document.body.innerHTML = `
      <div id="demo-app">
        <div class="demo-pane demo-pane--editor">
          <div id="editor-root"></div>
          <textarea id="markdown-input"></textarea>
        </div>
        <div class="demo-pane demo-pane--preview">
          <div id="preview-root"></div>
        </div>
      </div>
    `

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

    expect(document.getElementById('preview-root').innerHTML).toContain('<h1>Markdown</h1>')
    expect(document.getElementById('preview-root').innerHTML).toContain('<strong>Typex</strong>')
  })
})
