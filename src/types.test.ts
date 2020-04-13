/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectValidator } from './object-validator'
import { AssertEqual, IsNotUndefined, IsUndefined } from './types'
import { OptionalArray, RequiredArray } from './validators/array'
import { OptionalInteger, RequiredInteger } from './validators/integer'
import { RequiredObject } from './validators/object'

describe('Types', () => {
  it('Compiles', () => {
    // Make Jest happy
  })

  describe('IsUndefined', () => {
    const itShouldReturnTrueIfUndefined: AssertEqual<IsUndefined<undefined, true>, true> = true
    const itShouldReturnNeverIfNull: AssertEqual<IsUndefined<null, true>, never> = true
    const itShouldReturnTrueIfNullOrUndefined: AssertEqual<IsUndefined<null | undefined, true>, true> = true
    const itShouldReturnTrueIfStringOrUndefined: AssertEqual<IsUndefined<string | undefined, true>, true> = true
  })

  describe('IsNotUndefined', () => {
    const itShouldReturnNeverIfUndefined: AssertEqual<IsNotUndefined<undefined, true>, never> = true
    const itShouldReturnNeverIStringOrUndefined: AssertEqual<IsNotUndefined<string | undefined, true>, never> = true
    const itShouldReturnTrueIfNull: AssertEqual<IsNotUndefined<null, true>, true> = true
    const itShouldReturnTrueIString: AssertEqual<IsNotUndefined<string, true>, true> = true
  })
})
