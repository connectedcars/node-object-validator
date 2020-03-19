import { DoesNotMatchRegexError, NotStringError, RequiredError } from '../errors'
import { OptionalRegexMatch, RequiredRegexMatch, validateRegexMatch } from './regex-match'

describe('Regex', () => {
  describe('validateRegex', () => {
    it('requires value to be a string', function() {
      expect(validateRegexMatch('foo', /^.*$/)).toStrictEqual([])
      expect(validateRegexMatch('', /^.*$/)).toStrictEqual([])
      expect(validateRegexMatch(1, /^.*$/)).toStrictEqual([new NotStringError('Must be a string (received "1")')])
      expect(validateRegexMatch({}, /^.*$/)).toStrictEqual([
        new NotStringError('Must be a string (received "[object Object]")')
      ])
      expect(validateRegexMatch([], /^.*$/)).toStrictEqual([new NotStringError('Must be a string (received "")')])
      expect(validateRegexMatch(true, /^.*$/)).toStrictEqual([new NotStringError('Must be a string (received "true")')])
      expect(validateRegexMatch(false, /^.*$/)).toStrictEqual([
        new NotStringError('Must be a string (received "false")')
      ])
    })

    it('requires match', function() {
      expect(validateRegexMatch('', /^abcde/)).toStrictEqual([
        new DoesNotMatchRegexError(`Did not match '/^abcde/' (received "")`)
      ])
      expect(validateRegexMatch('abcd', /^abcde/)).toStrictEqual([
        new DoesNotMatchRegexError(`Did not match '/^abcde/' (received "abcd")`)
      ])
      expect(validateRegexMatch('abcde', /^abcde/)).toStrictEqual([])
      expect(validateRegexMatch('abcdef', /^abcde/)).toStrictEqual([])
    })
  })

  describe('OptionalRegex', () => {
    it('accepts empty value', function() {
      const validator = new RequiredRegexMatch(/^.*$/)
      expect(validator.validate(null)).toStrictEqual([new RequiredError('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredError('Is required')])
    })
  })

  describe('OptionalRegex', () => {
    it('accepts empty value', function() {
      const validator = new OptionalRegexMatch(/^.*$/)
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
