/** @jest-environment jsdom */

import Content from '../packages/@typex-core/model/content'

describe('content formatting notifications', () => {
  test('setFormat notifies document changes after component update', async () => {
    const selectedPath = { node: { formats: {} } }
    const update = jest.fn(() => Promise.resolve())
    const notifyDocumentChange = jest.fn()
    const drawRangeBg = jest.fn()
    const range = {
      startContainer: {
        queryCommonPath: jest.fn(() => ({
          currentComponent: {
            update,
          },
        })),
      },
      endContainer: {},
      updateCaret: jest.fn(),
    }

    const context = {
      $editor: {
        notifyDocumentChange,
        selection: {
          getLeafPaths: jest.fn(() => [selectedPath]),
          drawRangeBg,
        },
      },
    }
    const callback = jest.fn((path) => {
      path.node.formats.bold = true
    })

    Content.prototype.setFormat.call(context, range, callback)
    await Promise.resolve()

    expect(callback).toHaveBeenCalledWith(selectedPath)
    expect(update).toHaveBeenCalledTimes(1)
    expect(notifyDocumentChange).toHaveBeenCalledTimes(1)
    expect(range.updateCaret).toHaveBeenCalledTimes(1)
    expect(drawRangeBg).toHaveBeenCalledTimes(1)
  })
})
