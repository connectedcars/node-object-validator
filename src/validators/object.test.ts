/* eslint-disable @typescript-eslint/no-unused-vars */
import { RequiredError } from '../errors'
import { AssertEqual } from '../types'
import { OptionalArray, RequiredArray } from './array'
import { OptionalInteger, RequiredInteger } from './integer'
import { OptionalObject, RequiredObject } from './object'

describe('Object', () => {
  describe('validateObject', () => {})

  describe('RequiredObject', () => {
    const objectValidator = new RequiredObject({
      int: new RequiredInteger(1, 2),
      optionalInt: new OptionalInteger(1, 2),
      requiredObject: new RequiredObject({
        int: new RequiredInteger(1, 2),
        optionalInt: new OptionalInteger(1, 2)
      }),
      optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
      optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2)))
    })

    it('should export the correct type and compile', () => {
      const itShouldAllowOptionalParameters: typeof objectValidator.schemaType = {
        int: 0,
        optionalInt: 1,
        requiredObject: {
          int: 0
        },
        optionalArray: [0],
        optionalArrayArray: [[0]]
      }

      const itShouldCastIntToNumber: AssertEqual<typeof objectValidator.schemaType.int, number> = true
      const itShouldCastOptionalIntToNumberOrUndefined: AssertEqual<
        typeof objectValidator.schemaType.optionalInt,
        number | undefined
      > = true
      const itShouldCastOptionalArrayToNumberArrayOrUndefined: AssertEqual<
        typeof objectValidator.schemaType.optionalArray,
        number[] | undefined
      > = true
    })

    it('accepts empty value', function() {
      const validator = new RequiredObject({})
      expect(validator.validate(null)).toStrictEqual([new RequiredError('Is required')])
      expect(validator.validate(undefined as unknown)).toStrictEqual([new RequiredError('Is required')])
    })

    it('validates correct value', () => {
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]]
      }
      expect(objectValidator.validate(unknownValue)).toEqual([])
    })

    it('rejects wrong types', () => {
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1,
          optionalInt: '1'
        },
        optionalArray: ['1'],
        optionalArrayArray: [1]
      }
      expect(objectValidator.validate(unknownValue)).toEqual([
        new Error(`Field 'requiredObject['optionalInt']' must be an integer (received "1")`),
        new Error(`Field 'optionalArray[0]' must be an integer (received "1")`),
        new Error(`Field 'optionalArrayArray[0]' must be an array (received "1")`)
      ])
    })
  })

  describe('OptionalObject', () => {
    it('accepts empty value', function() {
      const validator = new OptionalObject({})
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
