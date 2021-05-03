import { AssertEqual } from '../common'
import { NotArrayFail, NotFloatFail, NotIntegerFail, NotObjectFail, RequiredFail } from '../errors'
import { OptionalArray, RequiredArray } from './array'
import { OptionalDate } from './date'
import { RequiredFloat } from './float'
import { OptionalInteger, RequiredInteger } from './integer'
import {
  isObject,
  NullableObject,
  OptionalNullableObject,
  OptionalObject,
  RequiredObject,
  validateObject
} from './object'
import { RequiredRegexMatch } from './regex-match'

describe('Object', () => {
  describe('validateObject', () => {
    it('should validate simple object', () => {
      expect(
        validateObject(
          {
            int: new RequiredInteger(1, 2)
          },
          { int: 1 }
        )
      ).toEqual([])
    })
  })

  describe('isObject', () => {
    it('should cast to simple object', () => {
      const value = { int: 1 } as unknown
      if (
        isObject(
          {
            int: new RequiredInteger(1, 2)
          },
          value
        )
      ) {
        expect(true as AssertEqual<typeof value, { int: number }>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })
  })

  it('should fail validation', () => {
    const value = 'string' as unknown
    expect(
      isObject(
        {
          int: new RequiredInteger(1, 2)
        },
        value
      )
    ).toEqual(false)
  })

  it('should handle nested optimize', () => {
    const objectValidator = new RequiredObject(
      {
        requiredObject: new RequiredObject(
          {
            optionalInt: new OptionalInteger(1, 2)
          },
          { optimize: true }
        )
      },
      { optimize: false }
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

  describe('RequiredInteger', () => {
    it('should return an function body', () => {
      const validator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2)
        },
        { optimize: false }
      )
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('should export types', () => {
      const validator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2)
        },
        { optimize: false }
      )
      const code = validator.toString({ types: true })
      expect(code).toEqual(`{\n  'int': number\n  'float': number\n}`)
    })
  })
})

describe.each([false, true])('Object (optimize: %s)', optimize => {
  describe('ObjectValidator', () => {
    it('should generate validation code and give same result', () => {
      const objectValidator = new RequiredObject(
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
      const validator = new RequiredObject({ int: new RequiredInteger(), float: new RequiredFloat() }, { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual(
          `new RequiredObject({\n  'int': new RequiredInteger(),\n  'float': new RequiredFloat()\n})`
        )
      } else {
        expect(code).toEqual(
          `new RequiredObject({\n  'int': new RequiredInteger(),\n  'float': new RequiredFloat()\n}, { optimize: false })`
        )
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredObject(
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
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]]
      }
      expect(validator.validate(unknownValue)).toEqual([])
    })

    it('rejects invalid values', () => {
      const validator = new RequiredObject(
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
      expect(validator.validate(unknownValue)).toEqual([
        new NotIntegerFail(`Must be an integer`, '1', "requiredObject['optionalInt']"),
        new NotIntegerFail(`Must be an integer`, '1', 'optionalArray[0]'),
        new NotArrayFail(`Must be an array`, 1, 'optionalArrayArray[0]')
      ])
      expect(validator.validate(null)).toStrictEqual([new NotObjectFail('Must be an object', null)])
    })

    it('rejects undefined', () => {
      const validator = new RequiredObject({}, { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('should fail validation of wrong key types', () => {
      const validator = new RequiredObject({ int: new RequiredInteger(), float: new RequiredFloat() }, { optimize })
      expect(validator.validate({ int: '', float: '' })).toStrictEqual([
        new NotIntegerFail('Must be an integer', '', 'int'),
        new NotFloatFail('Must be a float', '', 'float')
      ])
    })

    it('should fail validation early of wrong key types', () => {
      const validator = new RequiredObject(
        { int: new RequiredInteger(), float: new RequiredFloat() },
        { optimize, earlyFail: true }
      )
      const errors = validator.validate({ int: '', float: '' })
      expect(errors.length).toEqual(1)
    })

    it('should cast type guard correctly for isType', () => {
      const validator = new RequiredObject(
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
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]]
      }
      const errors = validator.validate(unknownValue)
      if (validator.isType(unknownValue, errors)) {
        expect(
          true as AssertEqual<
            typeof unknownValue,
            {
              int: number
              requiredObject: {
                int: number
                optionalInt?: number | undefined
              }
              optionalInt?: number | undefined
              optionalArray?: number[] | undefined
              optionalArrayArray?: number[][] | undefined
            }
          >
        ).toEqual(true)
      } else {
        expect('did not validate but should').toBe('')
      }
    })

    it('should cast type guard correctly for isValid', () => {
      const objectValidator = new RequiredObject(
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
        expect(
          true as AssertEqual<
            typeof unknownValue,
            {
              int: number
              float: number
              requiredObject: {
                int: number
                optionalInt?: number | undefined
              }
              optionalInt?: number | undefined
              optionalArray?: number[] | undefined
              optionalArrayArray?: number[][] | undefined
            }
          >
        ).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should cast to known type', () => {
      const objectValidator = new RequiredObject(
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
        expect(
          true as AssertEqual<
            typeof knownValue,
            {
              int: number
            }
          >
        ).toEqual(true)
      }).not.toThrow()
    })

    it('should fail to cast', () => {
      const objectValidator = new RequiredObject(
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
        expect(
          true as AssertEqual<
            typeof knownValue,
            {
              int: number
            }
          >
        ).toEqual(true)
      }).toThrow()
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredObject({}, { optimize })
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

  describe('OptionalObject', () => {
    it('accepts empty value', () => {
      const validator = new OptionalObject({}, { optimize })
      expect(validator.validate({})).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Record<string, any> | undefined>).toEqual(true)
    })
  })

  describe('NullableObject', () => {
    it('accepts empty value', () => {
      const validator = new NullableObject({}, { optimize })
      expect(validator.validate({})).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Record<string, any> | null>).toEqual(true)
    })
  })

  describe('OptionalNullableObject', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableObject({}, { optimize })
      expect(validator.validate({})).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Record<string, any> | null | undefined>).toEqual(true)
    })
  })
})
