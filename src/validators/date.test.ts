import { NotDateFail, RequiredFail } from '../errors'
import { DateValidator, OptionalDate, RequiredDate, validateDate } from './date'

describe.each([false, true])('Date (optimize: %s)', optimize => {
  describe('validateDate', () => {
    it('should validate simple date', () => {
      expect(validateDate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual([])
    })
  })

  describe('DateValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new DateValidator({ optimize })
      const str = validator.validate.toString()
      if (optimize) {
        expect(str).toMatch(/generatedFunction = true/)
      } else {
        expect(str).not.toMatch(/generatedFunction = true/)
      }
      const errors = validator.validate(new Date())
      expect(errors).toEqual([])
    })

    it('requires value to be a Date object', () => {
      const validator = new DateValidator({ optimize })
      expect(validator.validate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual([])
      expect(validator.validate(new Date('2018-08-06'))).toStrictEqual([])
      expect(validator.validate(new Date('13:37:00'))).toStrictEqual([])
      expect(validator.validate(500)).toStrictEqual([new NotDateFail('Must be a Date object')])
      expect(validator.validate('')).toStrictEqual([new NotDateFail('Must be a Date object')])
      expect(validator.validate(true)).toStrictEqual([new NotDateFail('Must be a Date object')])
      expect(validator.validate(false)).toStrictEqual([new NotDateFail('Must be a Date object')])
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([new NotDateFail('Must be a Date object')])
    })
  })

  describe('OptionalStringValue', () => {
    it('accepts empty value', function() {
      const validator = new RequiredDate({ optimize })
      expect(validator.validate(null)).toEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalStringValue', () => {
    it('accepts empty value', function() {
      const validator = new OptionalDate({ optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
