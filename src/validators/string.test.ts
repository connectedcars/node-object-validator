import { AssertEqual } from '../common'
import { NotStringFail, RequiredFail, WrongLengthFail } from '../errors'
import { isString, OptionalString, RequiredString, StringValidator, validateString } from './string'

describe('String (optimize: %s)', () => {
  describe('validateString', () => {
    it('requires value to be a string', () => {
      const value = 'foo' as unknown
      expect(validateString(value)).toStrictEqual([])
    })
  })
  describe('isString', () => {
    it('requires value to be a string', () => {
      const value = 'foo' as unknown
      if (isString(value)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, string> = true
      } else {
        fail('did not validate but should')
      }
    })
  })
})

describe.each([false, true])('String (optimize: %s)', optimize => {
  describe('StringValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new StringValidator(1, 30, { optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate('MyString')
      expect(errors).toEqual([])
    })

    it('requires value to be a string', () => {
      const validator = new StringValidator(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('foo')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([new NotStringFail('Must be a string (received "1")')])
      expect(validator.validate({})).toStrictEqual([new NotStringFail('Must be a string (received "[object Object]")')])
      expect(validator.validate([])).toStrictEqual([new NotStringFail('Must be a string (received "")')])
      expect(validator.validate(true)).toStrictEqual([new NotStringFail('Must be a string (received "true")')])
      expect(validator.validate(false)).toStrictEqual([new NotStringFail('Must be a string (received "false")')])
    })

    it('requires min value length', () => {
      const validator = new StringValidator(5, 500, { optimize })
      expect(validator.validate('')).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters (received "")')
      ])
      expect(validator.validate('a')).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters (received "a")')
      ])
      expect(validator.validate('ab')).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters (received "ab")')
      ])
      expect(validator.validate('abc')).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters (received "abc")')
      ])
      expect(validator.validate('abcd')).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters (received "abcd")')
      ])
      expect(validator.validate('abcde')).toStrictEqual([])
      expect(validator.validate('abcdef')).toStrictEqual([])
      expect(validator.validate('this is a long string')).toStrictEqual([])
    })

    it('requires max value length', () => {
      const validator = new StringValidator(0, 5, { optimize })
      expect(validator.validate('')).toStrictEqual([])
      expect(validator.validate('a')).toStrictEqual([])
      expect(validator.validate('ab')).toStrictEqual([])
      expect(validator.validate('abc')).toStrictEqual([])
      expect(validator.validate('abcd')).toStrictEqual([])
      expect(validator.validate('abcde')).toStrictEqual([])
      expect(validator.validate('abcdef')).toStrictEqual([
        new WrongLengthFail('Must contain between 0 and 5 characters (received "abcdef")')
      ])
      expect(validator.validate('abcdefg')).toStrictEqual([
        new WrongLengthFail('Must contain between 0 and 5 characters (received "abcdefg")')
      ])
      expect(validator.validate('this is a long string')).toStrictEqual([
        new WrongLengthFail('Must contain between 0 and 5 characters (received "this is a long string")')
      ])
    })
  })

  describe('RequiredString', () => {
    it('rejects empty value', () => {
      const validator = new RequiredString()
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalString()
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
