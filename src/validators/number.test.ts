import { NotNumberFail, OutOfRangeFail, RequiredFail } from '../errors'
import { NumberFunc, NumberValidator, OptionalNumber, RequiredNumber, validateNumber } from './number'

describe.each([false, true])('Number (optimize: %s)', optimize => {
  describe('validateNumber', () => {
    it('requires value to be a Number', () => {
      expect(validateNumber(0.0001)).toStrictEqual([])
    })
  })

  describe('NumberValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new NumberValidator(1, 2, { optimize })
      const str = validator.validate.toString()
      if (optimize) {
        expect(str).toMatch(/generatedFunction = true/)
      } else {
        expect(str).not.toMatch(/generatedFunction = true/)
      }
      const errors = validator.validate(1.5)
      expect(errors).toEqual([])
    })

    it('requires value to be a Number', () => {
      const validator = new NumberValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(0.0001)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(1.25)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([new NotNumberFail('Must be a Number (received "1")')])
      expect(validator.validate('')).toStrictEqual([new NotNumberFail('Must be a Number (received "")')])
      expect(validator.validate({})).toStrictEqual([new NotNumberFail('Must be a Number (received "[object Object]")')])
      expect(validator.validate([])).toStrictEqual([new NotNumberFail('Must be a Number (received "")')])
      expect(validator.validate(true)).toStrictEqual([new NotNumberFail('Must be a Number (received "true")')])
      expect(validator.validate(false)).toStrictEqual([new NotNumberFail('Must be a Number (received "false")')])
    })

    it('requires min value', () => {
      const validator = new NumberValidator(0.5, 500, { optimize })
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
      const validator = new NumberValidator(-500, 0.5, { optimize })
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

  describe('RequiredNumber', () => {
    it('accepts empty value', () => {
      const validator = new RequiredNumber(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalNumber', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNumber(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })

  describe('Number', () => {
    it('accepts empty value', () => {
      const validator = NumberFunc(0, Number.MAX_SAFE_INTEGER, false)
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })

    it('rejects empty value', () => {
      const validator = NumberFunc(0, Number.MAX_SAFE_INTEGER)
      expect(validator.validate(null).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
      expect(validator.validate(undefined).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
    })
  })
})
