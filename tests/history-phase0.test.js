import History from '../packages/@typex-core/history'

describe('phase 0 history baseline', () => {
  function createTransaction(name) {
    return {
      name,
      apply: jest.fn(),
      rollback: jest.fn(),
    }
  }

  test('push tracks the latest transaction as current', () => {
    const history = new History({ editor: {} })
    const transaction = createTransaction('A')

    history.push(transaction)

    expect(history.current).toBe(transaction)
    expect(history.idx).toBe(0)
  })

  test('undo rolls back current transaction and moves index backward', () => {
    const history = new History({ editor: {} })
    const transaction = createTransaction('A')
    history.push(transaction)

    history.undo()

    expect(transaction.rollback).toHaveBeenCalledTimes(1)
    expect(history.idx).toBe(-1)
  })

  test('redo reapplies the next transaction and moves index forward', () => {
    const history = new History({ editor: {} })
    const transaction = createTransaction('A')
    history.push(transaction)
    history.undo()

    history.redo()

    expect(transaction.apply).toHaveBeenCalledTimes(1)
    expect(history.idx).toBe(0)
  })

  test('push after undo truncates the future queue', () => {
    const history = new History({ editor: {} })
    const transactionA = createTransaction('A')
    const transactionB = createTransaction('B')
    const transactionC = createTransaction('C')

    history.push(transactionA)
    history.push(transactionB)
    history.undo()
    history.push(transactionC)

    expect(history.queue).toEqual([transactionA, transactionC])
    expect(history.idx).toBe(1)
  })

  test('respects the configured queue size limit', () => {
    const history = new History({ size: 2, editor: {} })
    const transactionA = createTransaction('A')
    const transactionB = createTransaction('B')
    const transactionC = createTransaction('C')

    history.push(transactionA)
    history.push(transactionB)
    history.push(transactionC)

    expect(history.queue).toEqual([transactionB, transactionC])
    expect(history.idx).toBe(1)
  })

  test('does nothing when undo or redo cannot proceed', () => {
    const history = new History({ editor: {} })

    expect(history.undo()).toBe(false)
    expect(history.redo()).toBe(false)
  })
})
