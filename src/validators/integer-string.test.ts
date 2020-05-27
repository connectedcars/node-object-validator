import { NotIntegerFail, NotIntegerStringFail, OutOfRangeFail, RequiredFail, WrongLengthFail } from '../errors'
import {
  IntegerString,
  IntegerStringValidator,
  OptionalIntegerString,
  RequiredIntegerString,
  validateIntegerString
} from './integer-string'

describe.each([false, true])('Integer (optimize: %s)', optimize => {
  describe('validateInteger', () => {
    it('requires value to be an integer', function() {
      expect(validateIntegerString('0', 0, 1)).toStrictEqual([])
    })
  })

  describe('IntegerStringValidator', () => {
    it.skip('should generate validation code and give same result', () => {
      const validator = new IntegerStringValidator(1, 30, { optimize })
      const str = validator.validate.toString()
      if (optimize) {
        expect(str).toMatch(/generatedFunction = true/)
      } else {
        expect(str).not.toMatch(/generatedFunction = true/)
      }
      const errors = validator.validate('10')
      expect(errors).toEqual([])
    })

    it('requires value to be an integer', function() {
      const validator = new IntegerStringValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
      expect(validator.validate('-123')).toStrictEqual([])
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
      expect(validator.validate(-123)).toStrictEqual([])
      expect(validator.validate(9.9)).toStrictEqual([new NotIntegerFail('Must be an integer (received "9.9")')])
      expect(validator.validate('')).toStrictEqual([
        new WrongLengthFail('Must be an integer or a string with an integer (received "")')
      ])
      expect(validator.validate('a')).toStrictEqual([
        new NotIntegerStringFail('Must be a string with an integer (received "a")')
      ])
      expect(validator.validate({})).toStrictEqual([
        new NotIntegerStringFail('Must be an integer or a string with an integer (received "[object Object]")')
      ])
      expect(validator.validate([])).toStrictEqual([
        new NotIntegerStringFail('Must be an integer or a string with an integer (received "")')
      ])
      expect(validator.validate(true)).toStrictEqual([
        new NotIntegerStringFail('Must be an integer or a string with an integer (received "true")')
      ])
      expect(validator.validate(false)).toStrictEqual([
        new NotIntegerStringFail('Must be an integer or a string with an integer (received "false")')
      ])
    })

    it('requires min value', function() {
      const validator = new IntegerStringValidator(5, 500, { optimize })
      expect(validator.validate('-1')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "-1")')])
      expect(validator.validate('0')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "0")')])
      expect(validator.validate('1')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "1")')])
      expect(validator.validate('2')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "2")')])
      expect(validator.validate('3')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "3")')])
      expect(validator.validate('4')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500 (received "4")')])
      expect(validator.validate('5')).toStrictEqual([])
      expect(validator.validate('6')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
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
      const validator = new IntegerStringValidator(-500, 5, { optimize })
      expect(validator.validate('-1')).toStrictEqual([])
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('2')).toStrictEqual([])
      expect(validator.validate('3')).toStrictEqual([])
      expect(validator.validate('4')).toStrictEqual([])
      expect(validator.validate('5')).toStrictEqual([])
      expect(validator.validate('6')).toStrictEqual([new OutOfRangeFail('Must be between -500 and 5 (received "6")')])
      expect(validator.validate('7')).toStrictEqual([new OutOfRangeFail('Must be between -500 and 5 (received "7")')])
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

  describe('RequiredIntegerString', () => {
    it('accepts empty value', function() {
      const validator = new RequiredIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalIntegerString', () => {
    it('accepts empty value', function() {
      const validator = new OptionalIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })

  describe('IntegerString', () => {
    it('accepts empty value', () => {
      const validator = IntegerString(0, Number.MAX_SAFE_INTEGER, false)
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })

    it('rejects empty value', () => {
      const validator = IntegerString(0, Number.MAX_SAFE_INTEGER)
      expect(validator.validate(null).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
      expect(validator.validate(undefined).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
    })
  })
})
