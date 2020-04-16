import { NotIntegerFail, OutOfRangeFail, RequiredFail } from '../errors'
import { IntegerValidator, OptionalInteger, RequiredInteger, validateInteger } from './integer'

describe('Integer', () => {
  describe('validateInteger', () => {
    it('requires value to be an integer', function() {
      expect(validateInteger(0)).toStrictEqual([])
      expect(validateInteger(1)).toStrictEqual([])
      expect(validateInteger(123)).toStrictEqual([])
      expect(validateInteger('1')).toStrictEqual([new NotIntegerFail('Must be an integer (received "1")')])
      expect(validateInteger('')).toStrictEqual([new NotIntegerFail('Must be an integer (received "")')])
      expect(validateInteger({})).toStrictEqual([new NotIntegerFail('Must be an integer (received "[object Object]")')])
      expect(validateInteger([])).toStrictEqual([new NotIntegerFail('Must be an integer (received "")')])
      expect(validateInteger(true)).toStrictEqual([new NotIntegerFail('Must be an integer (received "true")')])
      expect(validateInteger(false)).toStrictEqual([new NotIntegerFail('Must be an integer (received "false")')])
    })

    it('requires min value', function() {
      expect(validateInteger(-1, 5, 500)).toStrictEqual([
        new OutOfRangeFail('Must be between 5 and 500 (received "-1")')
      ])
      expect(validateInteger(0, 5, 500)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "0")')])
      expect(validateInteger(1, 5, 500)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "1")')])
      expect(validateInteger(2, 5, 500)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "2")')])
      expect(validateInteger(3, 5, 500)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "3")')])
      expect(validateInteger(4, 5, 500)).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "4")')])
      expect(validateInteger(5, 5, 500)).toStrictEqual([])
      expect(validateInteger(6, 5, 500)).toStrictEqual([])
      expect(validateInteger(123, 5, 500)).toStrictEqual([])
    })

    it('requires max value', function() {
      expect(validateInteger(-1, -500, 5)).toStrictEqual([])
      expect(validateInteger(0, -500, 5)).toStrictEqual([])
      expect(validateInteger(1, -500, 5)).toStrictEqual([])
      expect(validateInteger(2, -500, 5)).toStrictEqual([])
      expect(validateInteger(3, -500, 5)).toStrictEqual([])
      expect(validateInteger(4, -500, 5)).toStrictEqual([])
      expect(validateInteger(5, -500, 5)).toStrictEqual([])
      expect(validateInteger(6, -500, 5)).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 5 (received "6")')
      ])
      expect(validateInteger(7, -500, 5)).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 5 (received "7")')
      ])
    })
  })

  describe('IntegerValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new IntegerValidator(1, 30, { optimize: true })
      const str = validator.validate.toString()
      expect(str).toMatch(/generatedFunction = true/)
      const errors = validator.validate(10)
      expect(errors).toEqual([])
    })
  })

  describe('RequiredInteger', () => {
    it('accepts empty value', function() {
      const validator = new RequiredInteger()
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalInteger', () => {
    it('accepts empty value', function() {
      const validator = new OptionalInteger()
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
