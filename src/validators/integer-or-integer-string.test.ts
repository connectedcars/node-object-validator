import { NotIntegerOrIntegerStringFail, RequiredFail } from '../errors'
import {
  IntegerOrIntegerString,
  IntegerOrIntegerStringValidator,
  OptionalIntegerOrIntegerString,
  RequiredIntegerOrIntegerString,
  validateIntegerOrIntegerString
} from './integer-or-integer-string'

describe.each([false, true])('Integer (optimize: %s)', optimize => {
  describe('validateIntegerOrIntegerString', () => {
    it('requires value to be a integer', () => {
      expect(validateIntegerOrIntegerString(1, 0, 1)).toStrictEqual([])
    })
  })

  describe('IntegerOrIntegerStringValidator', () => {
    it('requires value to be a integer', () => {
      const validator = new IntegerOrIntegerStringValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
        optimize
      })
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(5)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('5')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "")')
      ])
      expect(validator.validate('0.1')).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "0.1")')
      ])
      expect(validator.validate(0.1)).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "0.1")')
      ])
      expect(validator.validate('a')).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "a")')
      ])
      expect(validator.validate({})).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer (received "[object Object]")'
        )
      ])
      expect(validator.validate([])).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "")')
      ])
      expect(validator.validate(true)).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "true")')
      ])
      expect(validator.validate(false)).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "false")')
      ])
    })

    it('requires min value', () => {
      const validator = new IntegerOrIntegerStringValidator(1, 500, { optimize })
      expect(validator.validate(-1)).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between 1 and 500 (received "-1")'
        )
      ])
      expect(validator.validate(0)).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between 1 and 500 (received "0")'
        )
      ])
      expect(validator.validate('5')).toStrictEqual([])
      expect(validator.validate(6)).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])

      expect(validator.validate('-1')).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between 1 and 500 (received "-1")'
        )
      ])
      expect(validator.validate('0')).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between 1 and 500 (received "0")'
        )
      ])
      expect(validator.validate('1.5')).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between 1 and 500 (received "1.5")'
        )
      ])
    })

    it('requires value to be a integer larger than', () => {
      const validator = new IntegerOrIntegerStringValidator(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(-1)).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer larger than 0 (received "-1")'
        )
      ])
      expect(validator.validate(1)).toStrictEqual([])
    })

    it('requires value to be a integer smaller than', () => {
      const validator = new IntegerOrIntegerStringValidator(Number.MIN_SAFE_INTEGER, 10, { optimize })
      expect(validator.validate(20)).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer smaller than 10 (received "20")'
        )
      ])
      expect(validator.validate(1)).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new IntegerOrIntegerStringValidator(-500, 1, { optimize })
      expect(validator.validate(-1)).toStrictEqual([])
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(2)).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between -500 and 1 (received "2")'
        )
      ])
      expect(validator.validate('-1')).toStrictEqual([])
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('2')).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between -500 and 1 (received "2")'
        )
      ])
    })
  })

  describe('RequiredIntegerOrIntegerString', () => {
    it('accepts empty value', () => {
      const validator = new RequiredIntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalIntegerString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalIntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })

  describe('IntegerString', () => {
    it('accepts empty value', () => {
      const validator = IntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, false)
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })

    it('rejects empty value', () => {
      const validator = IntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER)
      expect(validator.validate(null).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
      expect(validator.validate(undefined).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
    })
  })
})
