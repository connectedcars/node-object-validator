import { NotFloatFail, OutOfRangeFail, RequiredFail } from '../errors'
import { OptionalFloat, RequiredFloat, validateFloat } from './float'

describe('Float', () => {
  describe('validateFloat', () => {
    it('requires value to be a float', function() {
      expect(validateFloat(0.0001)).toStrictEqual([])
      expect(validateFloat(1)).toStrictEqual([])
      expect(validateFloat(1.25)).toStrictEqual([])
      expect(validateFloat(123)).toStrictEqual([])
      expect(validateFloat('1')).toStrictEqual([new NotFloatFail('Must be a float (received "1")')])
      expect(validateFloat('')).toStrictEqual([new NotFloatFail('Must be a float (received "")')])
      expect(validateFloat({})).toStrictEqual([new NotFloatFail('Must be a float (received "[object Object]")')])
      expect(validateFloat([])).toStrictEqual([new NotFloatFail('Must be a float (received "")')])
      expect(validateFloat(true)).toStrictEqual([new NotFloatFail('Must be a float (received "true")')])
      expect(validateFloat(false)).toStrictEqual([new NotFloatFail('Must be a float (received "false")')])
    })

    it('requires min value', function() {
      expect(validateFloat(-0.1, 0.5, 500)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "-0.1")')
      ])
      expect(validateFloat(0, 0.5, 500)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0")')
      ])
      expect(validateFloat(0.1, 0.5, 500)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0.1")')
      ])
      expect(validateFloat(0.2, 0.5, 500)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0.2")')
      ])
      expect(validateFloat(0.3, 0.5, 500)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0.3")')
      ])
      expect(validateFloat(0.4, 0.5, 500)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0.4")')
      ])
      expect(validateFloat(0.49999999, 0.5, 500)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0.49999999")')
      ])
      expect(validateFloat(0.5, 0.5, 500)).toStrictEqual([])
      expect(validateFloat(0.6, 0.5, 500)).toStrictEqual([])
      expect(validateFloat(123.456, 0.5, 500)).toStrictEqual([])
    })

    it('requires max value', function() {
      expect(validateFloat(-0.1, -500, 0.5)).toStrictEqual([])
      expect(validateFloat(0, -500, 0.5)).toStrictEqual([])
      expect(validateFloat(0.1, -500, 0.5)).toStrictEqual([])
      expect(validateFloat(0.2, -500, 0.5)).toStrictEqual([])
      expect(validateFloat(0.3, -500, 0.5)).toStrictEqual([])
      expect(validateFloat(0.4, -500, 0.5)).toStrictEqual([])
      expect(validateFloat(0.5, -500, 0.5)).toStrictEqual([])
      expect(validateFloat(0.500000001, -500, 0.5)).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 0.5 (received "0.500000001")')
      ])
      expect(validateFloat(0.6, -500, 0.5)).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 0.5 (received "0.6")')
      ])
      expect(validateFloat(0.7, -500, 0.5)).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 0.5 (received "0.7")')
      ])
    })
  })

  describe('RequiredFloat', () => {
    it('accepts empty value', function() {
      const validator = new RequiredFloat()
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalFloat', () => {
    it('accepts empty value', function() {
      const validator = new OptionalFloat()
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
