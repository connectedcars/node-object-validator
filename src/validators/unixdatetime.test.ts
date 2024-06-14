import { AssertEqual } from '../common'
import { NotIntegerFail, NotStringFail, OutOfRangeFail, RequiredFail, WrongLengthFail } from '../errors'
import {
  isUnixDateTime,
  NullableUnixDateTime,
  OptionalNullableUnixDateTime,
  OptionalUnixDateTime,
  RequiredUnixDateTime,
  validateUnixDateTime
} from './unixdatetime'

describe('UnixDateTime Validators', () => {
  describe('validateUnixDateTime', () => {
    it('should validate correct Unix timestamp strings', () => {
      const validTimestamps = ['1595894400', '0', '2147483647']
      for (const value of validTimestamps) {
        expect(validateUnixDateTime(value)).toStrictEqual([])
      }
    })

    it('should reject invalid Unix timestamp strings', () => {
      const invalidCases = [
        {
          value: '',
          expectedErrors: [new WrongLengthFail('Must contain between 1 and 20 characters', '')]
        },
        {
          value: 'abcdef',
          expectedErrors: [new NotIntegerFail('Must be a number in string format', 'abcdef')]
        },
        {
          value: '2147483648',
          expectedErrors: [new OutOfRangeFail('Must be a valid Unix timestamp', '2147483648')]
        },
        {
          value: '-1',
          expectedErrors: [new OutOfRangeFail('Must be a valid Unix timestamp', '-1')]
        },
        {
          value: '123.45',
          expectedErrors: [new NotIntegerFail('Must be a number in string format', '123.45')]
        },
        {
          value: null,
          expectedErrors: [new NotStringFail('Must be a string', null)]
        },
        {
          value: undefined,
          expectedErrors: [new NotStringFail('Must be a string', undefined)]
        }
      ]

      for (const { value, expectedErrors } of invalidCases) {
        expect(validateUnixDateTime(value)).toStrictEqual(expectedErrors)
      }
    })
  })

  describe('isUnixDateTime', () => {
    it('should correctly identify valid Unix timestamp strings', () => {
      const validTimestamp = '1595894400' as unknown
      if (isUnixDateTime(validTimestamp)) {
        expect(true as AssertEqual<typeof validTimestamp, string>).toEqual(true)
      } else {
        fail('Expected valid Unix timestamp to be recognized')
      }
    })

    it('should reject invalid Unix timestamp strings', () => {
      const invalidTimestamps = [null, undefined, 'abc', '2147483648', '-1']
      for (const value of invalidTimestamps) {
        expect(isUnixDateTime(value)).toBe(false)
      }
    })
  })

  describe.each([false, true])('DateTime (optimize: %s)', optimize => {
    describe('RequiredUnixDateTime', () => {
      it('should validate correct Unix timestamp strings', () => {
        const validator = new RequiredUnixDateTime({ optimize })
        expect(validator.validate('1595894400')).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, string>).toEqual(true)
      })

      it('should reject invalid Unix timestamp strings', () => {
        const validator = new RequiredUnixDateTime({ optimize: true })
        expect(validator.validate('')).toStrictEqual([
          new WrongLengthFail('Must contain between 1 and 20 characters', '')
        ])
        expect(validator.validate('abc')).toStrictEqual([
          new NotIntegerFail('Must be a number in string format', 'abc')
        ])
        expect(validator.validate('2147483648')).toStrictEqual([
          new OutOfRangeFail('Must be a valid Unix timestamp', '2147483648')
        ])
        expect(validator.validate('-1')).toStrictEqual([new OutOfRangeFail('Must be a valid Unix timestamp', '-1')])
        expect(validator.validate(null)).toStrictEqual([new NotStringFail('Must be a string', null)])
      })

      it('should reject undefined', () => {
        const validator = new RequiredUnixDateTime({ optimize })
        expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
      })

      it('should convert valid Unix timestamp to Date', () => {
        const validator = new RequiredUnixDateTime({ optimize })
        const validTimestamp = '1595894400'
        const errors = validator.validate(validTimestamp)
        expect(errors).toStrictEqual([])
        const date = new Date(Number(validTimestamp) * 1000)
        expect(date.toISOString()).toEqual(new Date(1595894400 * 1000).toISOString())
      })
    })

    describe('OptionalUnixDateTime', () => {
      it('should accept valid Unix timestamp strings and undefined', () => {
        const validator = new OptionalUnixDateTime({ optimize })
        expect(validator.validate('1595894400')).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, string | undefined>).toEqual(true)
      })

      it('should reject invalid Unix timestamp strings', () => {
        const validator = new OptionalUnixDateTime({ optimize })
        expect(validator.validate('abc')).toStrictEqual([
          new NotIntegerFail('Must be a number in string format', 'abc')
        ])
        expect(validator.validate('2147483648')).toStrictEqual([
          new OutOfRangeFail('Must be a valid Unix timestamp', '2147483648')
        ])
        expect(validator.validate('-1')).toStrictEqual([new OutOfRangeFail('Must be a valid Unix timestamp', '-1')])
        expect(validator.validate(null)).toStrictEqual([new NotStringFail('Must be a string', null)])
      })
    })

    describe('NullableUnixDateTime', () => {
      it('should accept valid Unix timestamp strings and null', () => {
        const validator = new NullableUnixDateTime({ optimize })
        expect(validator.validate('1595894400')).toStrictEqual([])
        expect(validator.validate(null)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, string | null>).toEqual(true)
      })

      it('should reject invalid Unix timestamp strings', () => {
        const validator = new NullableUnixDateTime({ optimize })
        expect(validator.validate('abc')).toStrictEqual([
          new NotIntegerFail('Must be a number in string format', 'abc')
        ])
        expect(validator.validate('2147483648')).toStrictEqual([
          new OutOfRangeFail('Must be a valid Unix timestamp', '2147483648')
        ])
        expect(validator.validate('-1')).toStrictEqual([new OutOfRangeFail('Must be a valid Unix timestamp', '-1')])
        expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
      })
    })

    describe('OptionalNullableUnixDateTime', () => {
      it('should accept valid Unix timestamp strings, undefined, and null', () => {
        const validator = new OptionalNullableUnixDateTime({ optimize })
        expect(validator.validate('1595894400')).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(validator.validate(null)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, string | undefined | null>).toEqual(true)
      })

      it('should reject invalid Unix timestamp strings', () => {
        const validator = new OptionalNullableUnixDateTime({ optimize })
        expect(validator.validate('abc')).toStrictEqual([
          new NotIntegerFail('Must be a number in string format', 'abc')
        ])
        expect(validator.validate('2147483648')).toStrictEqual([
          new OutOfRangeFail('Must be a valid Unix timestamp', '2147483648')
        ])
        expect(validator.validate('-1')).toStrictEqual([new OutOfRangeFail('Must be a valid Unix timestamp', '-1')])
      })
    })
  })
})
