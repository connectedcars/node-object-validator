/* eslint-disable @typescript-eslint/no-unused-vars */
import { AssertEqual } from '../common'
import { NotArrayFail, NotFloatFail, NotIntegerFail, NotObjectFail, RequiredFail } from '../errors'
import { OptionalArray, RequiredArray } from './array'
import { OptionalDate } from './date'
import { FloatValidator, RequiredFloat } from './float'
import { IntegerValidator, OptionalInteger, RequiredInteger } from './integer'
import { isObject, ObjectValidator, OptionalObject, RequiredObject, validateObject } from './object'
import { RequiredRegexMatch } from './regex-match'

describe('Object', () => {
  describe('validateObject', () => {
    it('should validate simple object', () => {
      const value = { int: 1 } as unknown
      const errors = validateObject(
        {
          int: new RequiredInteger(1, 2)
        },
        value
      )
      expect(errors).toEqual([])
    })
  })

  describe('isObject', () => {
    it('should cast to simple object', () => {
      const value = { int: 1 } as unknown
      if (
        isObject<{ int: number }>(
          {
            int: new RequiredInteger(1, 2)
          },
          value
        )
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, { int: number }> = true
      } else {
        fail('did not validate but should')
      }
    })
  })

  it('should handle nested optimize', () => {
    // Un optimized top validator should not include nested optimized validators
    const objectValidator = new RequiredObject<{
      requiredObject: { optionalInt?: number }
    }>(
      {
        requiredObject: new RequiredObject(
          {
            optionalInt: new OptionalInteger(1, 2)
          },
          { optimize: true }
        )
      },
      { optimize: true }
    )

    const unknownValue: unknown = {
      requiredObject: {
        optionalInt: '1'
      }
    }
    expect(objectValidator.validate(unknownValue)).toEqual([
      new NotIntegerFail(`Must be an integer`, '1', "requiredObject['optionalInt']")
    ])
  })
})

describe.each([false, true])('Object (optimize: %s)', optimize => {
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
      if (optimize) {
        expect(objectValidator['optimizedValidate']).not.toBeNull()
      } else {
        expect(objectValidator['optimizedValidate']).toBeNull()
      }
      const errors = objectValidator.validate(unknownValue)
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new ObjectValidator({ int: new IntegerValidator(), float: new FloatValidator() }, { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual(
          `new ObjectValidator({\n  'int': new IntegerValidator(),\n  'float': new FloatValidator()\n}, { optimize: true })`
        )
      } else {
        expect(code).toEqual(
          `new ObjectValidator({\n  'int': new IntegerValidator(),\n  'float': new FloatValidator()\n})`
        )
      }
    })

    it('should export types', () => {
      const validator = new ObjectValidator({ int: new IntegerValidator(), float: new FloatValidator() }, { optimize })
      const code = validator.toString({ types: true })
      expect(code).toEqual(`{\n  'int': number\n  'float': number\n}`)
    })

    it('should fail validation of wrong key types', () => {
      const validator = new ObjectValidator({ int: new IntegerValidator(), float: new FloatValidator() }, { optimize })
      expect(validator.validate({ int: '', float: '' })).toStrictEqual([
        new NotIntegerFail('Must be an integer', '', 'int'),
        new NotFloatFail('Must be a float', '', 'float')
      ])
    })

    it('should fail validation early of wrong key types', () => {
      const validator = new ObjectValidator(
        { int: new IntegerValidator(), float: new FloatValidator() },
        { optimize, earlyFail: true }
      )
      const errors = validator.validate({ int: '', float: '' })
      expect(errors.length).toEqual(1)
    })

    it('should cast type guard correctly for isValid', () => {
      const objectValidator = new ObjectValidator<{
        int: number
        float: number
        optionalInt?: number
        requiredObject: { int: number; optionalInt?: number }
        optionalArray?: number[]
        optionalArrayArray?: number[][]
      }>(
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
        fail('did not validate but should')
      }
    })

    it('should cast to known type', () => {
      const objectValidator = new ObjectValidator<{ int: number }>(
        {
          int: new RequiredInteger(1, 2)
        },
        { optimize }
      )

      const unknownValue: unknown = {
        int: 1
      }
      expect(() => {
        const knownValue = objectValidator.cast(unknownValue)
        const itShouldCastIntToNumber: AssertEqual<typeof knownValue.int, number> = true
      }).not.toThrow()
    })

    it('should fail to cast', () => {
      const objectValidator = new ObjectValidator<{ int: number }>(
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
    const objectValidator = new RequiredObject<{
      int: number
      float: number
      optionalInt?: number
      requiredObject: { int: number; optionalInt?: number }
      optionalArray?: number[]
      optionalArrayArray?: number[][]
    }>(
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

    it('rejects empty value', () => {
      const validator = new RequiredObject({}, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required', null)])
      expect(validator.validate(undefined as unknown)).toStrictEqual([new RequiredFail('Is required', undefined)])
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
        new NotIntegerFail(`Must be an integer`, '1', "requiredObject['optionalInt']"),
        new NotIntegerFail(`Must be an integer`, '1', 'optionalArray[0]'),
        new NotArrayFail(`Must be an array`, 1, 'optionalArrayArray[0]')
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
    it('accepts empty value', () => {
      const validator = new OptionalObject<{ key: string }>({}, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      const knownValue = validator.cast(null)
      const itShouldCastIntToNumber: AssertEqual<typeof knownValue, { key: string } | null | undefined> = true
    })
  })
})
