import { IsNullable } from './types'

function toBeType<V extends T, T>(value: V, type: T): T {
  return value
}

describe('Types', () => {
  it('IsNullable', () => {
    expect(toBeType(true, true as IsNullable<undefined, true>)).toEqual(true)
    expect(toBeType(true as never, true as IsNullable<null, true>)).toEqual(true)
  })
})
