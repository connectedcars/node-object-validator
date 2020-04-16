import { NotRfc3339Fail, RequiredFail, WrongLengthFail } from '../errors'
import { DateTimeValidator, OptionalDateTime, RequiredDateTime, validateDateTime } from './datetime'

describe('DateTime', () => {
  describe('validateDateTime', () => {
    it('requires value to be an RFC 3339 timestamp', () => {
      expect(validateDateTime('2018-08-06T13:37:00Z')).toStrictEqual([])
      expect(validateDateTime('2018-08-06T13:37:00.000Z')).toStrictEqual([])
      expect(validateDateTime('2018-08-06T13:37:00+00:00')).toStrictEqual([])
      expect(validateDateTime('2018-08-06T13:37:00.000+00:00')).toStrictEqual([])
      expect(validateDateTime('')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 29 characters (received "")')
      ])
      expect(validateDateTime('2018-08-06')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 29 characters (received "2018-08-06")')
      ])
      expect(validateDateTime('2018-08-06T13:37:00')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 29 characters (received "2018-08-06T13:37:00")')
      ])
      expect(validateDateTime('13:37:00')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 29 characters (received "13:37:00")')
      ])
    })
  })

  describe('StringValidator', () => {
    it('1 should generate validation code and give same result', () => {
      const validator = new DateTimeValidator({ optimize: true })
      const str = validator.validate.toString()
      expect(str).toMatch(/generatedFunction = true/)
      const errors = validator.validate('2018-08-06T13:37:00Z')
      expect(errors).toEqual([])
    })
  })

  describe('RequiredDateTime', () => {
    it('requires empty value', function() {
      const validator = new RequiredDateTime()
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalDateTime', () => {
    it('requires empty value', function() {
      const validator = new OptionalDateTime()
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
