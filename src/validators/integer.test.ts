import { AssertEqual } from '../common'
import { NotIntegerFail, OutOfRangeFail, RequiredFail } from '../errors'
import {
  isInteger,
  NullableInteger,
  OptionalInteger,
  OptionalNullableInteger,
  RequiredInteger,
  validateInteger
} from './integer'

describe('Integer', () => {
  describe('validateInteger', () => {
    it('requires value to be an integer', () => {
      expect(validateInteger(0, -1, 1)).toStrictEqual([])
    })
  })

  describe('isInteger', () => {
    it('should cast value to number', () => {
      const value = 0 as unknown
      if (isInteger(value)) {
        expect(true as AssertEqual<typeof value, number>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })
    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isInteger(value)).toEqual(false)
    })
  })

  describe('RequiredInteger', () => {
    it('should return an function body', () => {
      const validator = new RequiredInteger(0, 10, { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('should export types', () => {
      const validator = new RequiredInteger(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('number')
    })
  })
})

describe.each([false, true])('Integer (optimize: %s)', optimize => {
  describe('IntegerValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredInteger(1, 30, { optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate(10)
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredInteger(1, 30, { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredInteger(1, 30)')
      } else {
        expect(code).toEqual('new RequiredInteger(1, 30, { optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, number>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(123.9)).toStrictEqual([new NotIntegerFail('Must be an integer', 123.9)])
      expect(validator.validate('1')).toStrictEqual([new NotIntegerFail('Must be an integer', '1')])
      expect(validator.validate('')).toStrictEqual([new NotIntegerFail('Must be an integer', '')])
      expect(validator.validate({})).toStrictEqual([new NotIntegerFail('Must be an integer', {})])
      expect(validator.validate([])).toStrictEqual([new NotIntegerFail('Must be an integer', [])])
      expect(validator.validate(true)).toStrictEqual([new NotIntegerFail('Must be an integer', true)])
      expect(validator.validate(false)).toStrictEqual([new NotIntegerFail('Must be an integer', false)])
      expect(validator.validate(null)).toStrictEqual([new NotIntegerFail('Must be an integer', null)])
      expect(true as AssertEqual<typeof validator.tsType, number>).toEqual(true)
    })

    it('rejects undefined', () => {
      const validator = new RequiredInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('should cast type guard correctly for isValid', () => {
      const validator = new RequiredInteger()
      const value: unknown = 10
      if (validator.isValid(value)) {
        expect(true as AssertEqual<typeof value, number>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('requires min value', () => {
      const validator = new RequiredInteger(5, 500, { optimize })
      expect(validator.validate(-1)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', -1)])
      expect(validator.validate(0)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', 0)])
      expect(validator.validate(1)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', 1)])
      expect(validator.validate(2)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', 2)])
      expect(validator.validate(3)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', 3)])
      expect(validator.validate(4)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', 4)])
      expect(validator.validate(5)).toStrictEqual([])
      expect(validator.validate(6)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new RequiredInteger(-500, 5, { optimize })
      expect(validator.validate(-1)).toStrictEqual([])
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(2)).toStrictEqual([])
      expect(validator.validate(3)).toStrictEqual([])
      expect(validator.validate(4)).toStrictEqual([])
      expect(validator.validate(5)).toStrictEqual([])
      expect(validator.validate(6)).toStrictEqual([new OutOfRangeFail('Must be between -500 and 5', 6)])
      expect(validator.validate(7)).toStrictEqual([new OutOfRangeFail('Must be between -500 and 5', 7)])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredInteger(0, 10, { optimize })
      expect(validator.validate('', 'int').map(e => e.toString())).toStrictEqual([
        `NotIntegerFail: Field 'int' must be an integer (received "")`
      ])
    })
  })

  describe('OptionalInteger', () => {
    it('accepts empty value', () => {
      const validator = new OptionalInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(10)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, number | undefined>).toEqual(true)
    })
  })

  describe('NullableInteger', () => {
    it('accepts empty value', () => {
      const validator = new NullableInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(10)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, number | null>).toEqual(true)
    })
  })

  describe('OptionalNullableInteger', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(10)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, number | null | undefined>).toEqual(true)
    })
  })
})
