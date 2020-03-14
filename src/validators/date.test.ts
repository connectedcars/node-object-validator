import { NotDateError, RequiredError } from '../errors'
import { OptionalDate, RequiredDate, validateDate } from './date'

describe('Date', () => {
  describe('validateDate', () => {
    it('requires value to be a Date object', () => {
      expect(validateDate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual(null)
      expect(validateDate(new Date('2018-08-06'))).toStrictEqual(null)
      expect(validateDate(new Date('13:37:00'))).toStrictEqual(null)
      expect(validateDate((500 as unknown) as Date)).toStrictEqual(new NotDateError('Must be a Date object'))
      expect(validateDate(('' as unknown) as Date)).toStrictEqual(new NotDateError('Must be a Date object'))
      expect(validateDate((true as unknown) as Date)).toStrictEqual(new NotDateError('Must be a Date object'))
      expect(validateDate((false as unknown) as Date)).toStrictEqual(new NotDateError('Must be a Date object'))
      expect(validateDate(('2018-08-06T13:37:00Z' as unknown) as Date)).toStrictEqual(
        new NotDateError('Must be a Date object')
      )
    })
  })

  describe('OptionalStringValue', () => {
    it('accepts empty value', function() {
      const validator = new RequiredDate()
      expect(validator.validate((null as unknown) as Date)).toStrictEqual(new RequiredError('Is required'))
      expect(validator.validate((undefined as unknown) as Date)).toStrictEqual(new RequiredError('Is required'))
    })
  })

  describe('OptionalStringValue', () => {
    it('accepts empty value', function() {
      const validator = new OptionalDate()
      expect(validator.validate((null as unknown) as Date)).toStrictEqual(null)
      expect(validator.validate((undefined as unknown) as Date)).toStrictEqual(null)
    })
  })
})
