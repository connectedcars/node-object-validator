import { DoesNotMatchRegexError, NotStringError, RequiredError } from '../errors'
import { OptionalRegexMatch, RequiredRegexMatch, validateRegexMatch } from './regex-match'

describe('Regex', () => {
  describe('validateRegex', () => {
    it('requires value to be a string', function() {
      expect(validateRegexMatch('foo', /^.*$/)).toStrictEqual(null)
      expect(validateRegexMatch('', /^.*$/)).toStrictEqual(null)
      expect(validateRegexMatch((1 as unknown) as string, /^.*$/)).toStrictEqual(
        new NotStringError('Must be a string (received "1")')
      )
      expect(validateRegexMatch(({} as unknown) as string, /^.*$/)).toStrictEqual(
        new NotStringError('Must be a string (received "[object Object]")')
      )
      expect(validateRegexMatch(([] as unknown) as string, /^.*$/)).toStrictEqual(
        new NotStringError('Must be a string (received "")')
      )
      expect(validateRegexMatch((true as unknown) as string, /^.*$/)).toStrictEqual(
        new NotStringError('Must be a string (received "true")')
      )
      expect(validateRegexMatch((false as unknown) as string, /^.*$/)).toStrictEqual(
        new NotStringError('Must be a string (received "false")')
      )
    })

    it('requires match', function() {
      expect(validateRegexMatch('', /^abcde/)).toStrictEqual(
        new DoesNotMatchRegexError(`Did not match '/^abcde/' (received "")`)
      )
      expect(validateRegexMatch('abcd', /^abcde/)).toStrictEqual(
        new DoesNotMatchRegexError(`Did not match '/^abcde/' (received "abcd")`)
      )
      expect(validateRegexMatch('abcde', /^abcde/)).toStrictEqual(null)
      expect(validateRegexMatch('abcdef', /^abcde/)).toStrictEqual(null)
    })
  })

  describe('OptionalRegex', () => {
    it('accepts empty value', function() {
      const validator = new RequiredRegexMatch(/^.*$/)
      expect(validator.validate((null as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
      expect(validator.validate((undefined as unknown) as string)).toStrictEqual(new RequiredError('Is required'))
    })
  })

  describe('OptionalRegex', () => {
    it('accepts empty value', function() {
      const validator = new OptionalRegexMatch(/^.*$/)
      expect(validator.validate((null as unknown) as string)).toStrictEqual(null)
      expect(validator.validate((undefined as unknown) as string)).toStrictEqual(null)
    })
  })
})
