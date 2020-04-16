import { DoesNotMatchRegexFail, NotStringFail, RequiredFail } from '../errors'
import { OptionalRegexMatch, RegexMatchValidator, RequiredRegexMatch, validateRegexMatch } from './regex-match'

describe('Regex', () => {
  describe('validateRegex', () => {
    it('requires value to be a string', function() {
      expect(validateRegexMatch('foo', /^.*$/)).toStrictEqual([])
      expect(validateRegexMatch('', /^.*$/)).toStrictEqual([])
      expect(validateRegexMatch(1, /^.*$/)).toStrictEqual([new NotStringFail('Must be a string (received "1")')])
      expect(validateRegexMatch({}, /^.*$/)).toStrictEqual([
        new NotStringFail('Must be a string (received "[object Object]")')
      ])
      expect(validateRegexMatch([], /^.*$/)).toStrictEqual([new NotStringFail('Must be a string (received "")')])
      expect(validateRegexMatch(true, /^.*$/)).toStrictEqual([new NotStringFail('Must be a string (received "true")')])
      expect(validateRegexMatch(false, /^.*$/)).toStrictEqual([
        new NotStringFail('Must be a string (received "false")')
      ])
    })

    it('requires match', function() {
      expect(validateRegexMatch('', /^abcde/)).toStrictEqual([
        new DoesNotMatchRegexFail(`Did not match '/^abcde/' (received "")`)
      ])
      expect(validateRegexMatch('abcd', /^abcde/)).toStrictEqual([
        new DoesNotMatchRegexFail(`Did not match '/^abcde/' (received "abcd")`)
      ])
      expect(validateRegexMatch('abcde', /^abcde/)).toStrictEqual([])
      expect(validateRegexMatch('abcdef', /^abcde/)).toStrictEqual([])
    })
  })

  describe('RegexValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RegexMatchValidator(/^.*$/, { optimize: true })
      const str = validator.validate.toString()
      expect(str).toMatch(/generatedFunction = true/)
      const errors = validator.validate('2018-08-06T13:37:00Z')
      expect(errors).toEqual([])
    })
  })

  describe('OptionalRegex', () => {
    it('accepts empty value', function() {
      const validator = new RequiredRegexMatch(/^.*$/)
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
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
