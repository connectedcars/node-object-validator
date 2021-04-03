import { AssertEqual } from '../common'
import { DoesNotMatchRegexFail, NotStringFail, RequiredFail } from '../errors'
import {
  isRegexMatch,
  OptionalRegexMatch,
  RegexMatchValidator,
  RequiredRegexMatch,
  validateRegexMatch
} from './regex-match'

describe.each([false, true])('Regex (optimize: %s)', () => {
  describe('validateRegex', () => {
    it('requires value to be a string', () => {
      expect(validateRegexMatch('foo', /^.*$/)).toStrictEqual([])
    })
  })
  describe('validateRegex', () => {
    it('requires value to be a string', () => {
      const value = 'foo' as unknown
      if (isRegexMatch<'foo' | 'bar'>(value, /^(foo|bar)$/)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, 'foo' | 'bar'> = true
      } else {
        fail('did not validate but should')
      }
    })
  })
})

describe.each([false, true])('Regex (optimize: %s)', optimize => {
  describe('validateRegex', () => {
    it('requires value to be a string', () => {
      expect(validateRegexMatch('foo', /^.*$/)).toStrictEqual([])
    })
  })

  describe('RegexValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RegexMatchValidator(/^.*$/, { optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate('2018-08-06T13:37:00Z')
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RegexMatchValidator(/^.*$/i, { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RegexMatchValidator(/^.*$/i, { optimize: true })')
      } else {
        expect(code).toEqual('new RegexMatchValidator(/^.*$/i)')
      }
    })

    it('should export types', () => {
      const validator = new RegexMatchValidator(/^.*$/i, { optimize })
      const code = validator.toString({ types: true })
      expect(code).toEqual(`string`)
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
      expect(validator.validate('', 'myRegex').map(e => e.toString())).toStrictEqual([
        `DoesNotMatchRegexFail: Field 'myRegex' did not match '/^abcde/' (received "")`
      ])
    })
  })

  describe('OptionalRegex', () => {
    it('rejects empty value', () => {
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
})
