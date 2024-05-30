import { AssertEqual } from '../common'
import { NotIntegerStringFail, OutOfRangeFail, RequiredFail, WrongLengthFail } from '../errors'
import {
  isIntegerString,
  NullableIntegerString,
  OptionalIntegerString,
  OptionalNullableIntegerString,
  RequiredIntegerString,
  validateIntegerString
} from './integer-string'

describe('IntegerString', () => {
  describe('validateIntegerString', () => {
    it('requires value to be an integer', () => {
      expect(validateIntegerString('0', 0, 1)).toStrictEqual([])
    })
  })

  describe('isIntegerString', () => {
    it('should cast value to string', () => {
      const value = '10' as unknown
      if (isIntegerString(value)) {
        expect(true as AssertEqual<typeof value, string>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isIntegerString(value)).toEqual(false)
    })
  })

  describe('RequiredIntegerString', () => {
    it('should return an function body', () => {
      const validator = new RequiredIntegerString(0, 10, { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredIntegerString(0, 10, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredIntegerString(0, 10, { optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new RequiredIntegerString(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string')
    })
  })
})

describe.each([false, true])('IntegerString (optimize: %s)', optimize => {
  describe('RequiredIntegerString', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredIntegerString(0, 10, { optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      expect(validator.validate('10')).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredIntegerString(0, 10, { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredIntegerString(0, 10)')
      } else {
        expect(code).toEqual('new RequiredIntegerString(0, 10, { optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
      expect(validator.validate('-123')).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(0)).toStrictEqual([new NotIntegerStringFail('Must be a string with an integer', 0)])
      expect(validator.validate('9.9')).toStrictEqual([
        new NotIntegerStringFail('Must be a string with an integer', '9.9')
      ])
      expect(validator.validate('')).toStrictEqual([new WrongLengthFail('Must be a string with an integer', '')])
      expect(validator.validate('a')).toStrictEqual([new NotIntegerStringFail('Must be a string with an integer', 'a')])
      expect(validator.validate({})).toStrictEqual([new NotIntegerStringFail('Must be a string with an integer', {})])
      expect(validator.validate([])).toStrictEqual([new NotIntegerStringFail('Must be a string with an integer', [])])
      expect(validator.validate(true)).toStrictEqual([
        new NotIntegerStringFail('Must be a string with an integer', true)
      ])
      expect(validator.validate(false)).toStrictEqual([
        new NotIntegerStringFail('Must be a string with an integer', false)
      ])
      expect(validator.validate(null)).toStrictEqual([
        new NotIntegerStringFail('Must be a string with an integer', null)
      ])
      expect(true as AssertEqual<typeof validator.tsType, string>).toEqual(true)
    })

    it('requires min value', () => {
      const validator = new RequiredIntegerString(5, 500, { optimize })
      expect(validator.validate('-1')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', '-1')])
      expect(validator.validate('0')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', '0')])
      expect(validator.validate('1')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', '1')])
      expect(validator.validate('2')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', '2')])
      expect(validator.validate('3')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', '3')])
      expect(validator.validate('4')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', '4')])
      expect(validator.validate('5')).toStrictEqual([])
      expect(validator.validate('6')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new RequiredIntegerString(-500, 5, { optimize })
      expect(validator.validate('-1')).toStrictEqual([])
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('2')).toStrictEqual([])
      expect(validator.validate('3')).toStrictEqual([])
      expect(validator.validate('4')).toStrictEqual([])
      expect(validator.validate('5')).toStrictEqual([])
      expect(validator.validate('6')).toStrictEqual([new OutOfRangeFail('Must be between -500 and 5', '6')])
      expect(validator.validate('7')).toStrictEqual([new OutOfRangeFail('Must be between -500 and 5', '7')])
    })

    it('rejects undefined', () => {
      const validator = new RequiredIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredIntegerString(0, 10, { optimize })
      expect(validator.validate('', 'int').map(e => e.toString())).toStrictEqual([
        `WrongLengthFail: Field 'int' must be a string with an integer (received "")`
      ])
    })
  })

  describe('OptionalIntegerString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('10')).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalIntegerString(0, 10, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalIntegerString(0, 10, { required: false, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalIntegerString(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | undefined')
    })
  })

  describe('NullableIntegerString', () => {
    it('accepts empty value', () => {
      const validator = new NullableIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('10')).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | null>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new NullableIntegerString(0, 10, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new NullableIntegerString(0, 10, { nullable: true, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new NullableIntegerString(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | null')
    })
  })

  describe('OptionalNullableIntegerString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
        optimize
      })
      expect(validator.validate('10')).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | null | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalNullableIntegerString(0, 10, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual(
        'new OptionalNullableIntegerString(0, 10, { required: false, nullable: true, optimize: false })'
      )
    })

    it('toString, typescript', () => {
      const validator = new OptionalNullableIntegerString(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | undefined | null')
    })
  })
})
