import { NotExactStringError, RequiredError } from '../errors'
import { OptionalExactString, RequiredExactString, validateExactString } from './exact-string'

describe('validateExactString', () => {
  describe('validateExactString', () => {
    it('requires value to be exact string', function() {
      expect(validateExactString('MyString', 'MyString')).toStrictEqual(null)
      expect(validateExactString('', 'MyString')).toStrictEqual(
        new NotExactStringError('Must strictly equal "MyString" (received "")')
      )
      expect(validateExactString('mystring', 'MyString')).toStrictEqual(
        new NotExactStringError('Must strictly equal "MyString" (received "mystring")')
      )
      expect(validateExactString('MyString ', 'MyString')).toStrictEqual(
        new NotExactStringError('Must strictly equal "MyString" (received "MyString ")')
      )
      expect(validateExactString(' MyString', 'MyString')).toStrictEqual(
        new NotExactStringError('Must strictly equal "MyString" (received " MyString")')
      )
      expect(validateExactString('bogus', 'MyString')).toStrictEqual(
        new NotExactStringError('Must strictly equal "MyString" (received "bogus")')
      )
    })

    it('requires value to be same type (boolean)', () => {
      expect(validateExactString((true as unknown) as string, 'true')).toStrictEqual(
        new NotExactStringError('Must strictly equal "true" (received "true")')
      )
    })

    it('requires value to be same type (integer)', () => {
      expect(validateExactString((0 as unknown) as string, '0')).toStrictEqual(
        new NotExactStringError('Must strictly equal "0" (received "0")')
      )
    })
  })

  describe('RequiredExactString', () => {
    it('requires empty value', function() {
      const validator = new RequiredExactString()
      expect(validator.validate((null as unknown) as string, 'MyString')).toStrictEqual(
        new RequiredError('Is required')
      )
      expect(validator.validate((undefined as unknown) as string, 'MyString')).toStrictEqual(
        new RequiredError('Is required')
      )
    })
  })

  describe('OptionalExactString', () => {
    it('requires empty value', function() {
      const validator = new OptionalExactString()
      expect(validator.validate((undefined as unknown) as string, 'MyString')).toStrictEqual(null)
      expect(validator.validate((undefined as unknown) as string, 'MyString')).toStrictEqual(null)
    })
  })
})
