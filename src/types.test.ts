/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectValidator } from './object-validator'
import { IsNotUndefined, IsUndefined } from './types'
import { OptionalArray, RequiredArray } from './validators/array'
import { OptionalInteger, RequiredInteger } from './validators/integer'
import { RequiredObject } from './validators/object'

// https://stackoverflow.com/questions/51651499/typescript-what-is-a-naked-type-parameter
// https://2ality.com/2019/07/testing-static-types.html
// Wrapping the types in an tuple force a specific type instead of allow any in the union
type AssertEqual<T, Expected> = [T, Expected] extends [Expected, T] ? true : never

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

  describe('ObjectValidator', () => {
    const objectValidator = new ObjectValidator({
      int: new RequiredInteger(1, 2),
      optionalInt: new OptionalInteger(1, 2),
      requiredObject: new RequiredObject({
        int: new RequiredInteger(1, 2),
        optionalInt: new OptionalInteger(1, 2)
      }),
      optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
      optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2)))
    })

    const itShouldAllowOptionalParameters: typeof objectValidator.type = {
      int: 0,
      requiredObject: {
        int: 0
      },
      optionalArray: [0],
      optionalArrayArray: [[0]]
    }

    const itShouldCastIntToNumber: AssertEqual<typeof objectValidator.type.int, number> = true
    const itShouldCastOptionalIntToNumberOrUndefined: AssertEqual<
      typeof objectValidator.type.optionalInt,
      number | undefined
    > = true
    const itShouldCastOptionalArrayToNumberArrayOrUndefined: AssertEqual<
      typeof objectValidator.type.optionalArray,
      number[] | undefined
    > = true
  })
})
