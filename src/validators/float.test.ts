import { NotFloatFail, OutOfRangeFail, RequiredFail } from '../errors'
import { Float, FloatValidator, OptionalFloat, RequiredFloat, validateFloat } from './float'

describe.each([false, true])('Float (optimize: %s)', optimize => {
  describe('validateFloat', () => {
    it('requires value to be a float', () => {
      expect(validateFloat(0.0001)).toStrictEqual([])
    })
  })

  describe('FloatValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new FloatValidator(1, 2, { optimize })
      const str = validator.validate.toString()
      if (optimize) {
        expect(str).toMatch(/generatedFunction = true/)
      } else {
        expect(str).not.toMatch(/generatedFunction = true/)
      }
      const errors = validator.validate(1.5)
      expect(errors).toEqual([])
    })

    it('requires value to be a float', () => {
      const validator = new FloatValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(0.0001)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(1.25)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([new NotFloatFail('Must be a float (received "1")')])
      expect(validator.validate('')).toStrictEqual([new NotFloatFail('Must be a float (received "")')])
      expect(validator.validate({})).toStrictEqual([new NotFloatFail('Must be a float (received "[object Object]")')])
      expect(validator.validate([])).toStrictEqual([new NotFloatFail('Must be a float (received "")')])
      expect(validator.validate(true)).toStrictEqual([new NotFloatFail('Must be a float (received "true")')])
      expect(validator.validate(false)).toStrictEqual([new NotFloatFail('Must be a float (received "false")')])
    })

    it('requires min value', () => {
      const validator = new FloatValidator(0.5, 500, { optimize })
      expect(validator.validate(-0.1)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "-0.1")')
      ])
      expect(validator.validate(0)).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500 (received "0")')])
      expect(validator.validate(0.1)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0.1")')
      ])
      expect(validator.validate(0.2)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0.2")')
      ])
      expect(validator.validate(0.3)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0.3")')
      ])
      expect(validator.validate(0.4)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0.4")')
      ])
      expect(validator.validate(0.49999999)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500 (received "0.49999999")')
      ])
      expect(validator.validate(0.5)).toStrictEqual([])
      expect(validator.validate(0.6)).toStrictEqual([])
      expect(validator.validate(123.456)).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new FloatValidator(-500, 0.5, { optimize })
      expect(validator.validate(-0.1)).toStrictEqual([])
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(0.1)).toStrictEqual([])
      expect(validator.validate(0.2)).toStrictEqual([])
      expect(validator.validate(0.3)).toStrictEqual([])
      expect(validator.validate(0.4)).toStrictEqual([])
      expect(validator.validate(0.5)).toStrictEqual([])
      expect(validator.validate(0.500000001)).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 0.5 (received "0.500000001")')
      ])
      expect(validator.validate(0.6)).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 0.5 (received "0.6")')
      ])
      expect(validator.validate(0.7)).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 0.5 (received "0.7")')
      ])
    })
  })

  describe('RequiredFloat', () => {
    it('accepts empty value', () => {
      const validator = new RequiredFloat(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalFloat', () => {
    it('accepts empty value', () => {
      const validator = new OptionalFloat(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })

  describe('Float', () => {
    it('accepts empty value', () => {
      const validator = Float(0, Number.MAX_SAFE_INTEGER, false)
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })

    it('rejects empty value', () => {
      const validator = Float(0, Number.MAX_SAFE_INTEGER)
      expect(validator.validate(null).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
      expect(validator.validate(undefined).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
    })
  })
})
