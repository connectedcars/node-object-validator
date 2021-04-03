import { NotFloatStringFail, OutOfRangeFail, RequiredFail, WrongLengthFail } from '../errors'
import { FloatStringValidator, OptionalFloatString, RequiredFloatString, validateFloatString } from './float-string'

describe.each([false, true])('Float (optimize: %s)', optimize => {
  describe('validateFloatString', () => {
    it('requires value to be a float', () => {
      expect(validateFloatString('0.0001', 0, 1)).toStrictEqual([])
    })
  })

  describe('FloatStringValidator', () => {
    it('requires value to be a float', () => {
      const validator = new FloatStringValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(0.0001)).toStrictEqual([
        new NotFloatStringFail(`Must be a string with a float`, 0.0001)
      ])
      expect(validator.validate(1)).toStrictEqual([new NotFloatStringFail(`Must be a string with a float`, 1)])
      expect(validator.validate(1.25)).toStrictEqual([new NotFloatStringFail(`Must be a string with a float`, 1.25)])
      expect(validator.validate(0)).toStrictEqual([new NotFloatStringFail(`Must be a string with a float`, 0)])
      expect(validator.validate('0.0001')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('1.25')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([new WrongLengthFail('Must be a string with a float', '')])
      expect(validator.validate('a')).toStrictEqual([new NotFloatStringFail('Must be a string with a float', 'a')])
      expect(validator.validate({})).toStrictEqual([new NotFloatStringFail('Must be a string with a float', {})])
      expect(validator.validate([])).toStrictEqual([new NotFloatStringFail('Must be a string with a float', [])])
      expect(validator.validate(true)).toStrictEqual([new NotFloatStringFail('Must be a string with a float', true)])
      expect(validator.validate(false)).toStrictEqual([new NotFloatStringFail('Must be a string with a float', false)])
    })

    it('requires min value', () => {
      const validator = new FloatStringValidator(0.5, 500, { optimize })
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.6')).toStrictEqual([])
      expect(validator.validate('123.456')).toStrictEqual([])

      expect(validator.validate('-0.1')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', -0.1)])
      expect(validator.validate('0')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', 0)])
      expect(validator.validate('0.1')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', 0.1)])
      expect(validator.validate('0.2')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', 0.2)])
      expect(validator.validate('0.3')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', 0.3)])
      expect(validator.validate('0.4')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', 0.4)])
      expect(validator.validate('0.49999999')).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500', 0.49999999)
      ])
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.6')).toStrictEqual([])
      expect(validator.validate('123.456')).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new FloatStringValidator(-500, 0.5, { optimize })
      expect(validator.validate('-0.1')).toStrictEqual([])
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('0.1')).toStrictEqual([])
      expect(validator.validate('0.2')).toStrictEqual([])
      expect(validator.validate('0.3')).toStrictEqual([])
      expect(validator.validate('0.4')).toStrictEqual([])
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.500000001')).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 0.5', 0.500000001)
      ])
      expect(validator.validate('0.6')).toStrictEqual([new OutOfRangeFail('Must be between -500 and 0.5', 0.6)])
      expect(validator.validate('0.7')).toStrictEqual([new OutOfRangeFail('Must be between -500 and 0.5', 0.7)])
    })
  })

  describe('RequiredFloatString', () => {
    it('rejects empty value', () => {
      const validator = new RequiredFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required', null)])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })
  })

  describe('OptionalFloatString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
