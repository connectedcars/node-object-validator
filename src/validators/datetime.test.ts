import { NotRfc3339Fail, RequiredFail, WrongLengthFail } from '../errors'
import { DateTime, DateTimeValidator, OptionalDateTime, RequiredDateTime, validateDateTime } from './datetime'

describe.each([false, true])('DateTime (optimize: %s)', optimize => {
  describe('validateDateTime', () => {
    it('requires value to be an RFC 3339 timestamp', () => {
      expect(validateDateTime('2018-08-06T13:37:00Z')).toStrictEqual([])
    })
  })

  describe('DateTimeValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new DateTimeValidator({ optimize })
      const str = validator.validate.toString()
      if (optimize) {
        expect(str).toMatch(/generatedFunction = true/)
      } else {
        expect(str).not.toMatch(/generatedFunction = true/)
      }
      const errors = validator.validate('2018-08-06T13:37:00Z')
      expect(errors).toEqual([])
    })

    it('requires value to be an RFC 3339 timestamp', () => {
      const validator = new DateTimeValidator({ optimize })
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00+00:00')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000+00:00')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 29 characters (received "")')
      ])
      expect(validator.validate('2018-08-06')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 29 characters (received "2018-08-06")')
      ])
      expect(validator.validate('2018-08-06T13:37:00')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 29 characters (received "2018-08-06T13:37:00")')
      ])
      expect(validator.validate('13:37:00')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 29 characters (received "13:37:00")')
      ])
      expect(validator.validate('2018-08-ABT13:37:00Z')).toStrictEqual([
        new NotRfc3339Fail('Must be formatted as an RFC 3339 timestamp (received "2018-08-ABT13:37:00Z")')
      ])
    })

    it('requires value to show correct context on error', () => {
      const validator = new DateTimeValidator({ optimize })
      expect(validator.validate('', { key: 'myDate' }).map(e => e.toString())).toStrictEqual([
        `WrongLengthFail: Field 'myDate' must contain between 20 and 29 characters (received "")`
      ])
    })
  })

  describe('RequiredDateTime', () => {
    it('requires empty value', () => {
      const validator = new RequiredDateTime({ optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalDateTime', () => {
    it('requires empty value', () => {
      const validator = new OptionalDateTime({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })

  describe('DateTime', () => {
    it('accepts empty value', () => {
      const validator = DateTime(false)
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })

    it('rejects empty value', () => {
      const validator = DateTime()
      expect(validator.validate(null).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
      expect(validator.validate(undefined).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
    })
  })
})
