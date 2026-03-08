/** @jest-environment jsdom */

jest.mock('@typex/platform', () => {
  const platform = {
    nativeSelection: {
      rangeCount: 0,
      getRangeAt: jest.fn(),
      isCollapsed: true,
      collapse: jest.fn(),
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    },
    Caret: jest.fn().mockImplementation(() => ({
      remove: jest.fn(),
      update: jest.fn(),
      hidden: jest.fn(),
      rect: { x: 0, y: 0, height: 0 },
    })),
  }

  return {
    __esModule: true,
    default: platform,
  }
})

import Selection from '../packages/@typex-core/selection'

describe('phase 2 selection snapshot foundation', () => {
  beforeEach(() => {
    jest.useRealTimers()
  })

  function createSelectionHarness() {
    const pathMap = {
      '0.0': { position: '0.0', elm: document.createTextNode('a') },
      '0.1': { position: '0.1', elm: document.createTextNode('b') },
      '0/1': { position: '0/1', elm: document.createTextNode('left') },
      '0/3': { position: '0/3', elm: document.createTextNode('right') },
      A: { position: 'A', elm: document.createTextNode('container-a') },
      B: { position: 'B', elm: document.createTextNode('container-b') },
    }

    const editor = {
      queryPath: jest.fn((position) => pathMap[position]),
    }

    const selection = new Selection(editor)
    selection.updateCaret = jest.fn()

    return {
      editor,
      selection,
      pathMap,
    }
  }

  test('exports range snapshots from current ranges', () => {
    const { selection, pathMap } = createSelectionHarness()
    selection.ranges = [
      selection.createRange({
        startContainer: pathMap['0.0'],
        endContainer: pathMap['0.1'],
        startOffset: 1,
        endOffset: 2,
        d: 1,
      }),
    ]

    expect(selection.exportRangesSnapshot()).toEqual([
      {
        startContainer: '0.0',
        endContainer: '0.1',
        startOffset: 1,
        endOffset: 2,
        d: 1,
      },
    ])
    expect(selection.rangesSnapshot).toEqual(selection.exportRangesSnapshot())
  })

  test('creates and replaces ranges from snapshot using queryPath', () => {
    const { editor, selection, pathMap } = createSelectionHarness()
    const removeAllRangesSpy = jest.spyOn(selection, 'removeAllRanges').mockImplementation(() => {
      selection.ranges = []
    })

    const snapshot = [
      {
        startContainer: '0.0',
        endContainer: '0.1',
        startOffset: 0,
        endOffset: 1,
        d: 0,
      },
    ]

    const ranges = selection.replaceRangesFromSnapshot(snapshot)

    expect(removeAllRangesSpy).toHaveBeenCalled()
    expect(editor.queryPath).toHaveBeenCalledWith('0.0')
    expect(editor.queryPath).toHaveBeenCalledWith('0.1')
    expect(ranges).toHaveLength(1)
    expect(selection.ranges[0].startContainer).toBe(pathMap['0.0'])
    expect(selection.ranges[0].endContainer).toBe(pathMap['0.1'])
  })

  test('recoverRangesFromSnapshot replaces ranges and updates carets', () => {
    const { selection } = createSelectionHarness()
    const replaceRangesSpy = jest.spyOn(selection, 'replaceRangesFromSnapshot')

    selection.recoverRangesFromSnapshot([
      {
        startContainer: '0.0',
        endContainer: '0.0',
        startOffset: 0,
        endOffset: 0,
        d: 0,
      },
    ])

    expect(replaceRangesSpy).toHaveBeenCalled()
    expect(selection.updateCaret).toHaveBeenCalled()
  })

  test('skips unresolved snapshot entries when recreating ranges', () => {
    const { editor, selection, pathMap } = createSelectionHarness()
    const removeAllRangesSpy = jest.spyOn(selection, 'removeAllRanges').mockImplementation(() => {
      selection.ranges = []
    })

    const ranges = selection.replaceRangesFromSnapshot([
      {
        startContainer: '0.0',
        endContainer: 'missing',
        startOffset: 0,
        endOffset: 1,
        d: 0,
      },
      {
        startContainer: '0/1',
        endContainer: '0/3',
        startOffset: 2,
        endOffset: 5,
        d: 1,
      },
    ])

    expect(removeAllRangesSpy).toHaveBeenCalled()
    expect(editor.queryPath).toHaveBeenCalledWith('missing')
    expect(ranges).toHaveLength(1)
    expect(selection.ranges[0].startContainer).toBe(pathMap['0/1'])
    expect(selection.ranges[0].endContainer).toBe(pathMap['0/3'])
  })

  test('returns an empty selection when all snapshot entries are unresolved', () => {
    const { editor, selection } = createSelectionHarness()
    const removeAllRangesSpy = jest.spyOn(selection, 'removeAllRanges').mockImplementation(() => {
      selection.ranges = []
    })

    const ranges = selection.replaceRangesFromSnapshot([
      {
        startContainer: 'missing-start',
        endContainer: 'missing-end',
        startOffset: 0,
        endOffset: 1,
        d: 0,
      },
    ])

    expect(removeAllRangesSpy).toHaveBeenCalled()
    expect(editor.queryPath).toHaveBeenCalledWith('missing-start')
    expect(editor.queryPath).toHaveBeenCalledWith('missing-end')
    expect(ranges).toEqual([])
    expect(selection.rangeCount).toBe(0)
    expect(selection.rangesSnapshot).toEqual([])
  })

  test('range snapshot exports serialized positions and offsets', () => {
    const { selection, pathMap } = createSelectionHarness()
    const range = selection.createRange({
      startContainer: pathMap['0/1'],
      endContainer: pathMap['0/3'],
      startOffset: 2,
      endOffset: 5,
      d: 1,
    })

    expect(range.snapshot).toEqual({
      startContainer: '0/1',
      endContainer: '0/3',
      startOffset: 2,
      endOffset: 5,
      d: 1,
    })
  })

  test('selection snapshot round trip restores the same logical ranges', () => {
    const { selection, pathMap } = createSelectionHarness()
    const removeAllRangesSpy = jest.spyOn(selection, 'removeAllRanges').mockImplementation(() => {
      selection.ranges = []
    })

    selection.ranges = [
      selection.createRange({
        startContainer: pathMap['0.0'],
        endContainer: pathMap['0.1'],
        startOffset: 1,
        endOffset: 2,
        d: 1,
      }),
      selection.createRange({
        startContainer: pathMap['0/1'],
        endContainer: pathMap['0/3'],
        startOffset: 2,
        endOffset: 5,
        d: 0,
      }),
    ]

    const snapshot = selection.rangesSnapshot

    selection.recoverRangesFromSnapshot(snapshot)

    expect(removeAllRangesSpy).toHaveBeenCalled()
    expect(selection.rangeCount).toBe(2)
    expect(selection.ranges[0].startContainer).toBe(pathMap['0.0'])
    expect(selection.ranges[0].endContainer).toBe(pathMap['0.1'])
    expect(selection.ranges[0].startOffset).toBe(1)
    expect(selection.ranges[0].endOffset).toBe(2)
    expect(selection.ranges[0].d).toBe(1)
    expect(selection.ranges[1].startContainer).toBe(pathMap['0/1'])
    expect(selection.ranges[1].endContainer).toBe(pathMap['0/3'])
    expect(selection.ranges[1].startOffset).toBe(2)
    expect(selection.ranges[1].endOffset).toBe(5)
    expect(selection.ranges[1].d).toBe(0)
    expect(selection.rangesSnapshot).toEqual(snapshot)
  })

  test('updatePoints keeps snapshot stable when only matching endpoints move', () => {
    const { selection, pathMap } = createSelectionHarness()
    selection.ranges = [
      selection.createRange({
        startContainer: pathMap.A,
        endContainer: pathMap.A,
        startOffset: 2,
        endOffset: 5,
        d: 0,
      }),
    ]

    selection.updatePoints(pathMap.A, 3, 2)

    expect(selection.rangesSnapshot[0]).toEqual({
      startContainer: 'A',
      endContainer: 'A',
      startOffset: 2,
      endOffset: 7,
      d: 0,
    })
  })

  test('updatePoints moves matching endpoints to a new container at equality boundary', () => {
    const { selection, pathMap } = createSelectionHarness()
    selection.ranges = [
      selection.createRange({
        startContainer: pathMap.A,
        endContainer: pathMap.A,
        startOffset: 2,
        endOffset: 4,
        d: 0,
      }),
    ]

    selection.updatePoints(pathMap.A, 2, -2, pathMap.B)

    expect(selection.rangesSnapshot[0]).toEqual({
      startContainer: 'B',
      endContainer: 'B',
      startOffset: 0,
      endOffset: 2,
      d: 0,
    })
  })

  test('updateRangesFromNative only applies the latest queued sync', () => {
    jest.useFakeTimers()
    const { selection } = createSelectionHarness()
    const resetSpy = jest.spyOn(selection, '_resetRangesFromNative').mockImplementation(() => {})
    const updateCaretSpy = jest.spyOn(selection, 'updateCaret').mockImplementation(() => {})

    selection.updateRangesFromNative(false)
    selection.updateRangesFromNative(false)

    jest.runAllTimers()

    expect(resetSpy).toHaveBeenCalledTimes(1)
    expect(updateCaretSpy).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
  })

  test('collapse invalidates older queued native sync callbacks', () => {
    jest.useFakeTimers()
    const { selection, pathMap } = createSelectionHarness()
    const nativeCollapseSpy = jest.spyOn(selection.nativeSelection, 'collapse')
    const resetSpy = jest.spyOn(selection, '_resetRangesFromNative').mockImplementation(() => {
      selection.ranges = [
        selection.createRange({
          startContainer: pathMap['0.0'],
          endContainer: pathMap['0.0'],
          startOffset: 0,
          endOffset: 0,
          d: 0,
        }),
      ]
    })
    const updateCaretSpy = jest.spyOn(selection, 'updateCaret').mockImplementation(() => {})

    selection.updateRangesFromNative(false)
    selection.collapse(pathMap['0.0'].elm, 0)
    jest.runAllTimers()

    expect(nativeCollapseSpy).toHaveBeenCalledWith(pathMap['0.0'].elm, 0)
    expect(resetSpy).toHaveBeenCalledTimes(1)
    expect(updateCaretSpy).not.toHaveBeenCalled()
    expect(selection.rangesSnapshot).toEqual([
      {
        startContainer: '0.0',
        endContainer: '0.0',
        startOffset: 0,
        endOffset: 0,
        d: 0,
      },
    ])
    jest.useRealTimers()
  })
})
