/* eslint-disable @typescript-eslint/no-unused-vars */
import { NotIntegerFail, RequiredFail } from '../errors'
import { AssertEqual } from '../types'
import { OptionalArray, RequiredArray } from './array'
import { OptionalDate } from './date'
import { RequiredFloat } from './float'
import { OptionalInteger, RequiredInteger } from './integer'
import { ObjectValidator, OptionalObject, RequiredObject, TypedObject, validateObject } from './object'
import { RegexMatch, RequiredRegexMatch } from './regex-match'

describe.each([false, true])('Object (optimize: %s)', optimize => {
  describe('validateObject', () => {
    it('should validate simple object', () => {
      const errors = validateObject(
        new RequiredObject({
          int: new RequiredInteger(1, 2)
        }),
        { int: 1 }
      )
      expect(errors).toEqual([])
    })
  })

  describe('ObjectValidator', () => {
    it('should validation and give expected result', () => {
      const objectValidator = new ObjectValidator(
        {
          int: new RequiredInteger(1, 2),
          optionalInt: new OptionalInteger(1, 2),
          requiredObject: new RequiredObject({
            int: new RequiredInteger(1, 2),
            optionalInt: new OptionalInteger(1, 2)
          }),
          optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
          optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2))),
          optionalDate: new OptionalDate(),
          regexMatch: new RequiredRegexMatch(/^.*$/)
        },
        { optimize }
      )

      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]],
        optionalDate: new Date(),
        regexMatch: 'hello'
      }
      const str = objectValidator.validate.toString()
      if (optimize) {
        expect(str).toMatch(/generatedFunction = true/)
      } else {
        expect(str).not.toMatch(/generatedFunction = true/)
      }
      const errors = objectValidator.validate(unknownValue)
      expect(errors).toEqual([])
    })

    it('should cast type guard correctly for isValid', () => {
      const objectValidator = new ObjectValidator(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2),
          optionalInt: new OptionalInteger(1, 2),
          requiredObject: new RequiredObject({
            int: new RequiredInteger(1, 2),
            optionalInt: new OptionalInteger(1, 2)
          }),
          optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
          optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2)))
        },
        { optimize }
      )

      const unknownValue: unknown = {
        int: 1,
        float: 1.5,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]]
      }
      if (objectValidator.isValid(unknownValue)) {
        const itShouldCastIntToNumber: AssertEqual<typeof unknownValue.int, number> = true
        const itShouldCastFloatToNumber: AssertEqual<typeof unknownValue.float, number> = true
      } else {
        expect('did not validate but should').toBe('')
      }
    })

    it('should cast to known type', () => {
      const objectValidator = new ObjectValidator(
        {
          int: new RequiredInteger(1, 2)
        },
        { optimize }
      )

      const unknownValue: unknown = {
        int: 1
      }
      expect(() => {
        const knownValue = objectValidator.cast<{ int: number }>(unknownValue)
        const itShouldCastIntToNumber: AssertEqual<typeof knownValue.int, number> = true
      }).not.toThrow()
    })

    it('should fail to cast', () => {
      const objectValidator = new ObjectValidator(
        {
          int: new RequiredInteger(1, 2)
        },
        { optimize }
      )

      const unknownValue: unknown = {
        int: '1'
      }
      expect(() => {
        const knownValue = objectValidator.cast(unknownValue)
        const itShouldCastIntToNumber: AssertEqual<typeof knownValue.int, number> = true
      }).toThrow()
    })

    it('should reject non object values', () => {
      const validator = new ObjectValidator({}, { optimize })
      expect(validator.validate([]).map(e => e.toString())).toStrictEqual([
        'NotObjectFail: Must be an object (received "")'
      ])
      expect(validator.validate(1).map(e => e.toString())).toStrictEqual([
        'NotObjectFail: Must be an object (received "1")'
      ])
      expect(validator.validate(true).map(e => e.toString())).toStrictEqual([
        'NotObjectFail: Must be an object (received "true")'
      ])
      expect(validator.validate('').map(e => e.toString())).toStrictEqual([
        'NotObjectFail: Must be an object (received "")'
      ])
    })
  })

  describe('RequiredObject', () => {
    const objectValidator = new RequiredObject(
      {
        int: new RequiredInteger(1, 2),
        optionalInt: new OptionalInteger(1, 2),
        requiredObject: new RequiredObject({
          int: new RequiredInteger(1, 2),
          optionalInt: new OptionalInteger(1, 2)
        }),
        optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
        optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2)))
      },
      { optimize }
    )

    it('should export the correct type and compile', () => {
      const itShouldAllowOptionalParameters: typeof objectValidator.type = {
        int: 0,
        optionalInt: 1,
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

    it('accepts empty value', function () {
      const validator = new RequiredObject({}, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined as unknown)).toStrictEqual([new RequiredFail('Is required')])
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
        new NotIntegerFail(`Must be an integer (received "1")`, {
          key: "requiredObject['optionalInt']"
        }),
        new NotIntegerFail(`Must be an integer (received "1")`, {
          key: 'optionalArray[0]'
        }),
        new NotIntegerFail(`Must be an array (received "1")`, {
          key: 'optionalArrayArray[0]'
        })
      ])
    })

    it('should cast type guard correctly for isType', () => {
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]]
      }
      const errors = objectValidator.validate(unknownValue)
      if (objectValidator.isType(unknownValue, errors)) {
        const itShouldCastIntToNumber: AssertEqual<typeof unknownValue.int, number> = true
      } else {
        expect('did not validate but should').toBe('')
      }
    })

    it('should cast type guard correctly for cast', () => {
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]]
      }
      const knownValue = objectValidator.cast(unknownValue)
      const itShouldCastIntToNumber: AssertEqual<typeof knownValue.int, number> = true
    })
  })

  describe('OptionalObject', () => {
    it('accepts empty value', function () {
      const validator = new OptionalObject({}, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      const knownValue = validator.cast(null)
      const itShouldCastIntToNumber: AssertEqual<typeof knownValue, {} | null | undefined> = true
    })
  })

  describe('TypedObject', () => {
    it('accepts empty value', () => {
      const validator = TypedObject({}, false)
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })

    it('rejects empty value', () => {
      const validator = TypedObject({})
      expect(validator.validate(null).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
      expect(validator.validate(undefined).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
    })
  })
})
