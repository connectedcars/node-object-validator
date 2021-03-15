import { NotFloatOrFloatStringFail, RequiredFail } from '../errors'
import {
  FloatOrFloatStringValidator,
  OptionalFloatOrFloatString,
  RequiredFloatOrFloatString,
  validateFloatOrFloatString
} from './float-or-float-string'

describe.each([false, true])('Float (optimize: %s)', optimize => {
  describe('validateFloatOrFloatString', () => {
    it('requires value to be a float', () => {
      expect(validateFloatOrFloatString(0.0001, 0, 1)).toStrictEqual([])
    })
  })

  describe('FloatOrFloatStringValidator', () => {
    it('requires value to be a float', () => {
      const validator = new FloatOrFloatStringValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(0.0001)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(1.25)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
      expect(validator.validate('0.0001')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('1.25')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "")')
      ])
      expect(validator.validate('a')).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "a")')
      ])
      expect(validator.validate({})).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "[object Object]")')
      ])
      expect(validator.validate([])).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "")')
      ])
      expect(validator.validate(true)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "true")')
      ])
      expect(validator.validate(false)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "false")')
      ])
    })

    it('requires min value', () => {
      const validator = new FloatOrFloatStringValidator(0.5, 500, { optimize })
      expect(validator.validate(-0.1)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "-0.1")'
        )
      ])
      expect(validator.validate(0)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500 (received "0")')
      ])
      expect(validator.validate(0.1)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.1")'
        )
      ])
      expect(validator.validate(0.2)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.2")'
        )
      ])
      expect(validator.validate(0.3)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.3")'
        )
      ])
      expect(validator.validate(0.4)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.4")'
        )
      ])
      expect(validator.validate(0.49999999)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.49999999")'
        )
      ])
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.6')).toStrictEqual([])
      expect(validator.validate('123.456')).toStrictEqual([])

      expect(validator.validate('-0.1')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "-0.1")'
        )
      ])
      expect(validator.validate('0')).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500 (received "0")')
      ])
      expect(validator.validate('0.1')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.1")'
        )
      ])
      expect(validator.validate('0.2')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.2")'
        )
      ])
      expect(validator.validate('0.3')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.3")'
        )
      ])
      expect(validator.validate('0.4')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.4")'
        )
      ])
      expect(validator.validate('0.49999999')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.49999999")'
        )
      ])
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.6')).toStrictEqual([])
      expect(validator.validate('123.456')).toStrictEqual([])
    })

    it('requires value to be a float', () => {
      const validator = new FloatOrFloatStringValidator(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(-0.1)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float larger than 0 (received "-0.1")')
      ])
      expect(validator.validate(1)).toStrictEqual([])
    })

    it('requires value to be a float', () => {
      const validator = new FloatOrFloatStringValidator(Number.MIN_SAFE_INTEGER, 10, { optimize })
      expect(validator.validate(20)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float smaller than 10 (received "20")')
      ])
      expect(validator.validate(1)).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new FloatOrFloatStringValidator(-500, 0.5, { optimize })
      expect(validator.validate(-0.1)).toStrictEqual([])
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(0.1)).toStrictEqual([])
      expect(validator.validate(0.2)).toStrictEqual([])
      expect(validator.validate(0.3)).toStrictEqual([])
      expect(validator.validate(0.4)).toStrictEqual([])
      expect(validator.validate(0.5)).toStrictEqual([])
      expect(validator.validate(0.500000001)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.500000001")'
        )
      ])
      expect(validator.validate(0.6)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.6")'
        )
      ])
      expect(validator.validate(0.7)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.7")'
        )
      ])
      expect(validator.validate('-0.1')).toStrictEqual([])
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('0.1')).toStrictEqual([])
      expect(validator.validate('0.2')).toStrictEqual([])
      expect(validator.validate('0.3')).toStrictEqual([])
      expect(validator.validate('0.4')).toStrictEqual([])
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.500000001')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.500000001")'
        )
      ])
      expect(validator.validate('0.6')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.6")'
        )
      ])
      expect(validator.validate('0.7')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.7")'
        )
      ])
    })
  })

  describe('RequiredFloatOrFloatString', () => {
    it('rejects empty value', () => {
      const validator = new RequiredFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalFloatString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
