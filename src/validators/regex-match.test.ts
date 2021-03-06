import { DoesNotMatchRegexFail, NotStringFail, RequiredFail } from '../errors'
import {
  OptionalRegexMatch,
  RegexMatch,
  RegexMatchValidator,
  RequiredRegexMatch,
  validateRegexMatch
} from './regex-match'

describe.each([false, true])('Regex (optimize: %s)', optimize => {
  describe('validateRegex', () => {
    it('requires value to be a string', () => {
      expect(validateRegexMatch('foo', /^.*$/)).toStrictEqual([])
    })
  })

  describe('RegexValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RegexMatchValidator(/^.*$/, { optimize })
      const str = validator.validate.toString()
      if (optimize) {
        expect(str).toMatch(/generatedFunction = true/)
      } else {
        expect(str).not.toMatch(/generatedFunction = true/)
      }
      const errors = validator.validate('2018-08-06T13:37:00Z')
      expect(errors).toEqual([])
    })

    it('requires value to be a string', () => {
      const validator = new RegexMatchValidator(/^.*$/, { optimize })
      expect(validator.validate('foo')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([new NotStringFail('Must be a string (received "1")')])
      expect(validator.validate({})).toStrictEqual([new NotStringFail('Must be a string (received "[object Object]")')])
      expect(validator.validate([])).toStrictEqual([new NotStringFail('Must be a string (received "")')])
      expect(validator.validate(true)).toStrictEqual([new NotStringFail('Must be a string (received "true")')])
      expect(validator.validate(false)).toStrictEqual([new NotStringFail('Must be a string (received "false")')])
    })

    it('requires match', () => {
      const validator = new RegexMatchValidator(/^abcde/, { optimize })
      expect(validator.validate('')).toStrictEqual([
        new DoesNotMatchRegexFail(`Did not match '/^abcde/' (received "")`)
      ])
      expect(validator.validate('abcd')).toStrictEqual([
        new DoesNotMatchRegexFail(`Did not match '/^abcde/' (received "abcd")`)
      ])
      expect(validator.validate('abcde')).toStrictEqual([])
      expect(validator.validate('abcdef')).toStrictEqual([])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RegexMatchValidator(/^abcde/, { optimize })
      expect(validator.validate('', { key: 'myRegex' }).map(e => e.toString())).toStrictEqual([
        `DoesNotMatchRegexFail: Field 'myRegex' did not match '/^abcde/' (received "")`
      ])
    })
  })

  describe('OptionalRegex', () => {
    it('accepts empty value', () => {
      const validator = new RequiredRegexMatch(/^.*$/, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalRegex', () => {
    it('accepts empty value', () => {
      const validator = new OptionalRegexMatch(/^.*$/, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })

  describe('RegexMatch', () => {
    it('accepts empty value', () => {
      const validator = RegexMatch(/^.*$/, false)
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })

    it('rejects empty value', () => {
      const validator = RegexMatch(/^.*$/)
      expect(validator.validate(null).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
      expect(validator.validate(undefined).map(e => e.toString())).toStrictEqual(['RequiredFail: Is required'])
    })
  })
})
