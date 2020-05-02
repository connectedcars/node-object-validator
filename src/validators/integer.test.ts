import { NotIntegerFail, OutOfRangeFail, RequiredFail } from '../errors'
import { IntegerValidator, OptionalInteger, RequiredInteger, validateInteger } from './integer'

describe.each([false, true])('Integer (optimize: %s)', optimize => {
  describe('validateInteger', () => {
    it('requires value to be an integer', function() {
      expect(validateInteger(0)).toStrictEqual([])
    })
  })

  describe('IntegerValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new IntegerValidator(1, 30, { optimize })
      const str = validator.validate.toString()
      if (optimize) {
        expect(str).toMatch(/generatedFunction = true/)
      } else {
        expect(str).not.toMatch(/generatedFunction = true/)
      }
      const errors = validator.validate(10)
      expect(errors).toEqual([])
    })

    it('requires value to be an integer', function() {
      const validator = new IntegerValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([new NotIntegerFail('Must be an integer (received "1")')])
      expect(validator.validate('')).toStrictEqual([new NotIntegerFail('Must be an integer (received "")')])
      expect(validator.validate({})).toStrictEqual([
        new NotIntegerFail('Must be an integer (received "[object Object]")')
      ])
      expect(validator.validate([])).toStrictEqual([new NotIntegerFail('Must be an integer (received "")')])
      expect(validator.validate(true)).toStrictEqual([new NotIntegerFail('Must be an integer (received "true")')])
      expect(validator.validate(false)).toStrictEqual([new NotIntegerFail('Must be an integer (received "false")')])
    })

    it('requires min value', function() {
      const validator = new IntegerValidator(5, 500, { optimize })
      expect(validator.validate(-1)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "-1")')])
      expect(validator.validate(0)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "0")')])
      expect(validator.validate(1)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "1")')])
      expect(validator.validate(2)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "2")')])
      expect(validator.validate(3)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "3")')])
      expect(validator.validate(4)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "4")')])
      expect(validator.validate(5)).toStrictEqual([])
      expect(validator.validate(6)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
    })

    it('requires max value', function() {
      const validator = new IntegerValidator(-500, 5, { optimize })
      expect(validator.validate(-1)).toStrictEqual([])
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(2)).toStrictEqual([])
      expect(validator.validate(3)).toStrictEqual([])
      expect(validator.validate(4)).toStrictEqual([])
      expect(validator.validate(5)).toStrictEqual([])
      expect(validator.validate(6)).toStrictEqual([new OutOfRangeFail('Must be between -500 and 5 (received "6")')])
      expect(validator.validate(7)).toStrictEqual([new OutOfRangeFail('Must be between -500 and 5 (received "7")')])
    })
  })

  describe('RequiredInteger', () => {
    it('accepts empty value', function() {
      const validator = new RequiredInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalInteger', () => {
    it('accepts empty value', function() {
      const validator = new OptionalInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
