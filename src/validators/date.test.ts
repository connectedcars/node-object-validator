import { NotDateError, RequiredError } from '../errors'
import { OptionalDate, RequiredDate, validateDate } from './date'

describe('Date', () => {
  describe('validateDate', () => {
    it('requires value to be a Date object', () => {
      expect(validateDate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual([])
      expect(validateDate(new Date('2018-08-06'))).toStrictEqual([])
      expect(validateDate(new Date('13:37:00'))).toStrictEqual([])
      expect(validateDate(500)).toStrictEqual([new NotDateError('Must be a Date object')])
      expect(validateDate('')).toStrictEqual([new NotDateError('Must be a Date object')])
      expect(validateDate(true)).toStrictEqual([new NotDateError('Must be a Date object')])
      expect(validateDate(false)).toStrictEqual([new NotDateError('Must be a Date object')])
      expect(validateDate('2018-08-06T13:37:00Z')).toStrictEqual([new NotDateError('Must be a Date object')])
    })
  })

  describe('OptionalStringValue', () => {
    it('accepts empty value', function() {
      const validator = new RequiredDate()
      expect(validator.validate(null)).toStrictEqual([new RequiredError('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredError('Is required')])
    })
  })

  describe('OptionalStringValue', () => {
    it('accepts empty value', function() {
      const validator = new OptionalDate()
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
