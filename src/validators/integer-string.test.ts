import { NotIntegerStringFail, OutOfRangeFail, RequiredFail, WrongLengthFail } from '../errors'
import {
  IntegerStringValidator,
  OptionalIntegerString,
  RequiredIntegerString,
  validateIntegerString
} from './integer-string'

describe.each([false, true])('Integer (optimize: %s)', optimize => {
  describe('validateInteger', () => {
    it('requires value to be an integer', () => {
      expect(validateIntegerString('0', 0, 1)).toStrictEqual([])
    })
  })

  describe('IntegerStringValidator', () => {
    it('requires value to be an integer', () => {
      const validator = new IntegerStringValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
      expect(validator.validate('-123')).toStrictEqual([])
      expect(validator.validate(0)).toStrictEqual([new NotIntegerStringFail('Must be a string with an integer', 0)])
      expect(validator.validate('9.9')).toStrictEqual([
        new NotIntegerStringFail('Must be a string with an integer', '9.9')
      ])
      expect(validator.validate('')).toStrictEqual([new WrongLengthFail('Must be a string with an integer', '')])
      expect(validator.validate('a')).toStrictEqual([new NotIntegerStringFail('Must be a string with an integer', 'a')])
      expect(validator.validate({})).toStrictEqual([new NotIntegerStringFail('Must be a string with an integer', {})])
      expect(validator.validate([])).toStrictEqual([new NotIntegerStringFail('Must be a string with an integer', [])])
      expect(validator.validate(true)).toStrictEqual([
        new NotIntegerStringFail('Must be a string with an integer', true)
      ])
      expect(validator.validate(false)).toStrictEqual([
        new NotIntegerStringFail('Must be a string with an integer', false)
      ])
    })

    it('requires min value', () => {
      const validator = new IntegerStringValidator(5, 500, { optimize })
      expect(validator.validate('-1')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', -1)])
      expect(validator.validate('0')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', 0)])
      expect(validator.validate('1')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', 1)])
      expect(validator.validate('2')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', 2)])
      expect(validator.validate('3')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', 3)])
      expect(validator.validate('4')).toStrictEqual([new OutOfRangeFail('Must be between 5 and 500', 4)])
      expect(validator.validate('5')).toStrictEqual([])
      expect(validator.validate('6')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new IntegerStringValidator(-500, 5, { optimize })
      expect(validator.validate('-1')).toStrictEqual([])
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('2')).toStrictEqual([])
      expect(validator.validate('3')).toStrictEqual([])
      expect(validator.validate('4')).toStrictEqual([])
      expect(validator.validate('5')).toStrictEqual([])
      expect(validator.validate('6')).toStrictEqual([new OutOfRangeFail('Must be between -500 and 5', 6)])
      expect(validator.validate('7')).toStrictEqual([new OutOfRangeFail('Must be between -500 and 5', 7)])
    })
  })

  describe('RequiredIntegerString', () => {
    it('rejects empty value', () => {
      const validator = new RequiredIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required', null)])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })
  })

  describe('OptionalIntegerString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
