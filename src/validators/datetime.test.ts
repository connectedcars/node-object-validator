import { NotRfc3339Error, RequiredError } from '../errors'
import { OptionalDateTime, RequiredDateTime, validateDateTime } from './datetime'

describe('DateTime', () => {
  describe('validateDateTime', () => {
    it('requires value to be an RFC 3339 timestamp', () => {
      expect(validateDateTime('2018-08-06T13:37:00Z')).toStrictEqual(null)
      expect(validateDateTime('2018-08-06T13:37:00.000Z')).toStrictEqual(null)
      expect(validateDateTime('2018-08-06T13:37:00+00:00')).toStrictEqual(null)
      expect(validateDateTime('2018-08-06T13:37:00.000+00:00')).toStrictEqual(null)
      expect(validateDateTime('')).toStrictEqual(
        new NotRfc3339Error('Must be formatted as an RFC 3339 timestamp (received "")')
      )
      expect(validateDateTime('2018-08-06')).toStrictEqual(
        new NotRfc3339Error('Must be formatted as an RFC 3339 timestamp (received "2018-08-06")')
      )
      expect(validateDateTime('2018-08-06T13:37:00')).toStrictEqual(
        new NotRfc3339Error('Must be formatted as an RFC 3339 timestamp (received "2018-08-06T13:37:00")')
      )
      expect(validateDateTime('13:37:00')).toStrictEqual(
        new NotRfc3339Error('Must be formatted as an RFC 3339 timestamp (received "13:37:00")')
      )
    })
  })

  describe('RequiredDateTime', () => {
    it('requires empty value', function() {
      const validator = new RequiredDateTime()
      expect(validator.validate((null as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
      expect(validator.validate((undefined as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
    })
  })

  describe('OptionalDateTime', () => {
    it('requires empty value', function() {
      const validator = new OptionalDateTime()
      expect(validator.validate((undefined as unknown) as string)).toStrictEqual(null)
      expect(validator.validate((undefined as unknown) as string)).toStrictEqual(null)
    })
  })
})
