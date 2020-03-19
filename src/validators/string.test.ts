import { NotStringError, RequiredError, WrongLengthError } from '../errors'
import { OptionalString, RequiredString, validateString } from './string'

describe('String', () => {
  describe('RequiredString', () => {
    it('requires empty value', function() {
      const validator = new RequiredString()
      expect(validator.validate(null)).toStrictEqual([new RequiredError('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredError('Is required')])
    })
  })

  describe('OptionalString', () => {
    it('requires empty value', function() {
      const validator = new OptionalString()
      expect(validator.validate(undefined)).toStrictEqual(null)
      expect(validator.validate(undefined)).toStrictEqual(null)
    })
  })

  describe('validateString', () => {
    it('requires value to be a string', () => {
      expect(validateString('foo')).toStrictEqual(null)
      expect(validateString('')).toStrictEqual(null)
      expect(validateString((1 as unknown) as string)).toStrictEqual([
        new NotStringError('Must be a string (received "1")')
      ])
      expect(validateString(({} as unknown) as string)).toStrictEqual([
        new NotStringError('Must be a string (received "[object Object]")')
      ])
      expect(validateString(([] as unknown) as string)).toStrictEqual([
        new NotStringError('Must be a string (received "")')
      ])
      expect(validateString((true as unknown) as string)).toStrictEqual([
        new NotStringError('Must be a string (received "true")')
      ])
      expect(validateString((false as unknown) as string)).toStrictEqual([
        new NotStringError('Must be a string (received "false")')
      ])
    })

    it('requires min value length', () => {
      expect(validateString('', 5, 500)).toStrictEqual([
        new WrongLengthError('Must contain between 5 and 500 characters (received "")')
      ])
      expect(validateString('a', 5, 500)).toStrictEqual([
        new WrongLengthError('Must contain between 5 and 500 characters (received "a")')
      ])
      expect(validateString('ab', 5, 500)).toStrictEqual([
        new WrongLengthError('Must contain between 5 and 500 characters (received "ab")')
      ])
      expect(validateString('abc', 5, 500)).toStrictEqual([
        new WrongLengthError('Must contain between 5 and 500 characters (received "abc")')
      ])
      expect(validateString('abcd', 5, 500)).toStrictEqual([
        new WrongLengthError('Must contain between 5 and 500 characters (received "abcd")')
      ])
      expect(validateString('abcde', 5, 500)).toStrictEqual(null)
      expect(validateString('abcdef', 5, 500)).toStrictEqual(null)
      expect(validateString('this is a long string', 5, 500)).toStrictEqual(null)
    })

    it('requires max value length', () => {
      expect(validateString('', 0, 5)).toStrictEqual(null)
      expect(validateString('a', 0, 5)).toStrictEqual(null)
      expect(validateString('ab', 0, 5)).toStrictEqual(null)
      expect(validateString('abc', 0, 5)).toStrictEqual(null)
      expect(validateString('abcd', 0, 5)).toStrictEqual(null)
      expect(validateString('abcde', 0, 5)).toStrictEqual(null)
      expect(validateString('abcdef', 0, 5)).toStrictEqual([
        new WrongLengthError('Must contain between 0 and 5 characters (received "abcdef")')
      ])
      expect(validateString('abcdefg', 0, 5)).toStrictEqual([
        new WrongLengthError('Must contain between 0 and 5 characters (received "abcdefg")')
      ])
      expect(validateString('this is a long string', 0, 5)).toStrictEqual([
        new WrongLengthError('Must contain between 0 and 5 characters (received "this is a long string")')
      ])
    })
  })
})
