import { NotStringFail, RequiredFail, WrongLengthFail } from '../errors'
import { OptionalString, RequiredString, StringValidator, validateString } from './string'

describe('String', () => {
  describe('StringValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new StringValidator(1, 30, { optimize: true })
      const str = validator.validate.toString()
      expect(str).toMatch(/generatedFunction = true/)
      const errors = validator.validate('MyString')
      expect(errors).toEqual([])
    })
  })

  describe('RequiredString', () => {
    it('requires empty value', function() {
      const validator = new RequiredString()
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalString', () => {
    it('requires empty value', function() {
      const validator = new OptionalString()
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })

  describe('validateString', () => {
    it('requires value to be a string', () => {
      expect(validateString('foo')).toStrictEqual([])
      expect(validateString('')).toStrictEqual([])
      expect(validateString((1 as unknown) as string)).toStrictEqual([
        new NotStringFail('Must be a string (received "1")')
      ])
      expect(validateString(({} as unknown) as string)).toStrictEqual([
        new NotStringFail('Must be a string (received "[object Object]")')
      ])
      expect(validateString(([] as unknown) as string)).toStrictEqual([
        new NotStringFail('Must be a string (received "")')
      ])
      expect(validateString((true as unknown) as string)).toStrictEqual([
        new NotStringFail('Must be a string (received "true")')
      ])
      expect(validateString((false as unknown) as string)).toStrictEqual([
        new NotStringFail('Must be a string (received "false")')
      ])
    })

    it('requires min value length', () => {
      expect(validateString('', 5, 500)).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters (received "")')
      ])
      expect(validateString('a', 5, 500)).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters (received "a")')
      ])
      expect(validateString('ab', 5, 500)).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters (received "ab")')
      ])
      expect(validateString('abc', 5, 500)).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters (received "abc")')
      ])
      expect(validateString('abcd', 5, 500)).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters (received "abcd")')
      ])
      expect(validateString('abcde', 5, 500)).toStrictEqual([])
      expect(validateString('abcdef', 5, 500)).toStrictEqual([])
      expect(validateString('this is a long string', 5, 500)).toStrictEqual([])
    })

    it('requires max value length', () => {
      expect(validateString('', 0, 5)).toStrictEqual([])
      expect(validateString('a', 0, 5)).toStrictEqual([])
      expect(validateString('ab', 0, 5)).toStrictEqual([])
      expect(validateString('abc', 0, 5)).toStrictEqual([])
      expect(validateString('abcd', 0, 5)).toStrictEqual([])
      expect(validateString('abcde', 0, 5)).toStrictEqual([])
      expect(validateString('abcdef', 0, 5)).toStrictEqual([
        new WrongLengthFail('Must contain between 0 and 5 characters (received "abcdef")')
      ])
      expect(validateString('abcdefg', 0, 5)).toStrictEqual([
        new WrongLengthFail('Must contain between 0 and 5 characters (received "abcdefg")')
      ])
      expect(validateString('this is a long string', 0, 5)).toStrictEqual([
        new WrongLengthFail('Must contain between 0 and 5 characters (received "this is a long string")')
      ])
    })
  })
})
