/** @jest-environment jsdom */

import Transaction from '../packages/@typex-core/transform/transaction'
import { TextInsert } from '../packages/@typex-core/transform/step'

describe('phase 1 transaction side-effect boundary', () => {
  function createStepHarness() {
    const update = jest.fn()
    const path = {
      position: '0.0',
      currentComponent: {
        update,
      },
      textInsert: jest.fn(),
      textDelete: jest.fn(),
    }

    const selection = {
      updatePoints: jest.fn(),
      recoverRangesFromSnapshot: jest.fn(),
      rangesSnapshot: [{ start: 'snapshot' }],
    }

    const editor = {
      queryPath: jest.fn(() => path),
      selection,
      notifyDocumentChange: jest.fn(),
      history: {
        push: jest.fn(),
      },
    }

    const range = {
      container: path,
      offset: 0,
      editor,
    }

    return {
      update,
      path,
      selection,
      editor,
      range,
    }
  }

  test('step apply no longer triggers component update directly', () => {
    const { update, path, range } = createStepHarness()
    const step = new TextInsert({ range, data: 'A' })

    step.apply()

    expect(path.textInsert).toHaveBeenCalledWith(0, 'A')
    expect(update).not.toHaveBeenCalled()
  })

  test('addAndApplyStep triggers component update from transaction boundary', () => {
    const { update, selection, editor, range } = createStepHarness()
    const transaction = new Transaction(editor)
    const step = new TextInsert({ range, data: 'A' })

    transaction.addAndApplyStep(step)

    expect(update).toHaveBeenCalledTimes(1)
    expect(selection.updatePoints).toHaveBeenCalledWith(range.container, 0, 1)
  })

  test('commit emits a document change notification after recording history', () => {
    const { editor, range } = createStepHarness()
    const transaction = new Transaction(editor)
    const step = new TextInsert({ range, data: 'A' })

    transaction.addAndApplyStep(step)
    transaction.commit()

    expect(editor.history.push).toHaveBeenCalledWith(transaction)
    expect(editor.notifyDocumentChange).toHaveBeenCalledTimes(1)
  })

  test('apply and rollback update components from transaction boundary and recover snapshots', () => {
    jest.useFakeTimers()
    const { update, selection, editor, range } = createStepHarness()
    const transaction = new Transaction(editor)
    const step = new TextInsert({ range, data: 'AB' })

    transaction.addStep(step)
    transaction.endRanges = [{ end: 'snapshot' }]

    transaction.apply()
    transaction.rollback()

    expect(update).toHaveBeenCalledTimes(2)
    expect(editor.notifyDocumentChange).toHaveBeenCalledTimes(2)

    jest.runAllTimers()

    expect(selection.recoverRangesFromSnapshot).toHaveBeenNthCalledWith(1, transaction.endRanges)
    expect(selection.recoverRangesFromSnapshot).toHaveBeenNthCalledWith(2, transaction.startRanges)
    jest.useRealTimers()
  })
})
