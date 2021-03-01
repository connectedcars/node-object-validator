import { AssertEqual } from '../common'
import { NotExactStringFail, RequiredFail } from '../errors'
import {
  ExactStringValidator,
  isExactString,
  OptionalExactString,
  RequiredExactString,
  validateExactString
} from './exact-string'

describe('validateExactString (optimize: %s)', () => {
  describe('validateExactString', () => {
    it('requires value to be exact string', () => {
      const value = 'MyString' as unknown
      expect(validateExactString(value, 'MyString')).toStrictEqual([])
    })
  })

  describe('isExactString', () => {
    it('should cast value to string', () => {
      const value = 'MyString' as unknown
      if (isExactString(value, 'MyString')) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, 'MyString'> = true
      } else {
        fail('did not validate but should')
      }
    })
  })
})

describe.each([false, true])('validateExactString (optimize: %s)', optimize => {
  describe('ExactStringValidator', () => {
    it('should generate code for validation and give same result', () => {
      const validator = new ExactStringValidator('MyString', { optimize })
      const str = validator.validate.toString()
      if (optimize) {
        expect(str).toMatch(/generatedFunction = true/)
      } else {
        expect(str).not.toMatch(/generatedFunction = true/)
      }
      const errors = validator.validate('MyString')
      expect(errors).toEqual([])
    })

    it('requires value to be exact string', () => {
      const validator = new ExactStringValidator('MyString', { optimize })
      expect(validator.validate('MyString')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([
        new NotExactStringFail('Must strictly equal "MyString" (received "")')
      ])
      expect(validator.validate('mystring')).toStrictEqual([
        new NotExactStringFail('Must strictly equal "MyString" (received "mystring")')
      ])
      expect(validator.validate('MyString ')).toStrictEqual([
        new NotExactStringFail('Must strictly equal "MyString" (received "MyString ")')
      ])
      expect(validator.validate(' MyString')).toStrictEqual([
        new NotExactStringFail('Must strictly equal "MyString" (received " MyString")')
      ])
      expect(validator.validate('bogus')).toStrictEqual([
        new NotExactStringFail('Must strictly equal "MyString" (received "bogus")')
      ])
    })

    it('requires value to be same type (boolean)', () => {
      const validator = new ExactStringValidator('true', { optimize })
      expect(validator.validate(true)).toStrictEqual([
        new NotExactStringFail('Must strictly equal "true" (received "true")')
      ])
    })

    it('requires value to be same type (integer)', () => {
      const validator = new ExactStringValidator('0', { optimize })
      expect(validator.validate(0)).toStrictEqual([new NotExactStringFail('Must strictly equal "0" (received "0")')])
    })
  })

  describe('RequiredExactString', () => {
    it('requires empty value', () => {
      const validator = new RequiredExactString('MyString', { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalExactString', () => {
    it('requires empty value', () => {
      const validator = new OptionalExactString('MyString', { optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
