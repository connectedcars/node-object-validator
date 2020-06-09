import { NotDatetimeOrDateFail, RequiredFail } from '../errors'
import {
  DateTimeOrDate,
  DateTimeOrDateValidator,
  OptionalDateTimeOrDate,
  RequiredDateTimeOrDate,
  validateDateTimeOrDate
} from './datetime-or-date'

describe.each([false, true])('DateTime (optimize: %s)', optimize => {
  describe('validateDateTimeOrDate', () => {
    it('requires value to be an RFC 3339 timestamp', () => {
      expect(validateDateTimeOrDate('2018-08-06T13:37:00Z')).toStrictEqual([])
      expect(validateDateTimeOrDate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual([])
    })
  })

  describe('DateTimeOrDateValidator', () => {
    it('requires value to be an RFC 3339 timestamp', () => {
      const validator = new DateTimeOrDateValidator({ optimize })
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00+00:00')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000+00:00')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "")'
        )
      ])
      expect(validator.validate('2018-08-06')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "2018-08-06")'
        )
      ])
      expect(validator.validate('2018-08-06T13:37:00')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "2018-08-06T13:37:00")'
        )
      ])
      expect(validator.validate('13:37:00')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "13:37:00")'
        )
      ])
      expect(validator.validate('2018-08-ABT13:37:00Z')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "2018-08-ABT13:37:00Z")'
        )
      ])
    })

    it('requires value to be a Date object', () => {
      const validator = new DateTimeOrDateValidator({ optimize })
      expect(validator.validate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual([])
      expect(validator.validate(new Date('2018-08-06'))).toStrictEqual([])
      expect(validator.validate(new Date('13:37:00'))).toStrictEqual([])
      expect(validator.validate(500)).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "500")'
        )
      ])
      expect(validator.validate('')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "")'
        )
      ])
      expect(validator.validate(true)).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "true")'
        )
      ])
      expect(validator.validate(false)).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "false")'
        )
      ])
    })
  })

  describe('RequiredDateTimeOrDate', () => {
    it('requires empty value', function() {
      const validator = new RequiredDateTimeOrDate({ optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalDateTimeOrDate', () => {
    it('requires empty value', function() {
      const validator = new OptionalDateTimeOrDate({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })

  describe('DatDateTimeOrDateeTime', () => {
    it('accepts empty value', () => {
      const validator = DateTimeOrDate(false)
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })

    it('rejects empty value', () => {
      const validator = DateTimeOrDate()
      expect(validator.validate(null).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
      expect(validator.validate(undefined).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
    })
  })
})
