import { DoesNotMatchRegexError, NotStringError, RequiredError } from '../errors'
import { OptionalRegex, RequiredRegex, validateRegex } from './regex'

describe('Regex', () => {
  describe('validateRegex', () => {
    it('requires value to be a string', function() {
      expect(validateRegex('foo', /^.*$/)).toStrictEqual(null)
      expect(validateRegex('', /^.*$/)).toStrictEqual(null)
      expect(validateRegex((1 as unknown) as string, /^.*$/)).toStrictEqual(
        new NotStringError('Must be a string (received "1")')
      )
      expect(validateRegex(({} as unknown) as string, /^.*$/)).toStrictEqual(
        new NotStringError('Must be a string (received "[object Object]")')
      )
      expect(validateRegex(([] as unknown) as string, /^.*$/)).toStrictEqual(
        new NotStringError('Must be a string (received "")')
      )
      expect(validateRegex((true as unknown) as string, /^.*$/)).toStrictEqual(
        new NotStringError('Must be a string (received "true")')
      )
      expect(validateRegex((false as unknown) as string, /^.*$/)).toStrictEqual(
        new NotStringError('Must be a string (received "false")')
      )
    })

    it('requires match', function() {
      expect(validateRegex('', /^abcde/)).toStrictEqual(
        new DoesNotMatchRegexError(`Did not match '/^abcde/' (received "")`)
      )
      expect(validateRegex('abcd', /^abcde/)).toStrictEqual(
        new DoesNotMatchRegexError(`Did not match '/^abcde/' (received "abcd")`)
      )
      expect(validateRegex('abcde', /^abcde/)).toStrictEqual(null)
      expect(validateRegex('abcdef', /^abcde/)).toStrictEqual(null)
    })
  })

  describe('OptionalRegex', () => {
    it('accepts empty value', function() {
      const validator = new RequiredRegex(/^.*$/)
      expect(validator.validate((null as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
      expect(validator.validate((undefined as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
    })
  })

  describe('OptionalRegex', () => {
    it('accepts empty value', function() {
      const validator = new OptionalRegex(/^.*$/)
      expect(validator.validate((null as unknown) as string)).toStrictEqual(null)
      expect(validator.validate((undefined as unknown) as string)).toStrictEqual(null)
    })
  })
})
