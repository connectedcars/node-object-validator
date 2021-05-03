import { AssertEqual } from '../common'
import { DoesNotMatchRegexFail, NotStringFail, RequiredFail } from '../errors'
import {
  isRegexMatch,
  NullableRegexMatch,
  OptionalNullableRegexMatch,
  OptionalRegexMatch,
  RequiredRegexMatch,
  validateRegexMatch
} from './regex-match'

describe.each([false, true])('Regex (optimize: %s)', () => {
  describe('validateRegexMatch', () => {
    it('requires value to be a string', () => {
      expect(validateRegexMatch('foo', /^.*$/)).toStrictEqual([])
    })
  })

  describe('isRegexMatch', () => {
    it('requires value to be a string', () => {
      const value = 'foo' as unknown
      if (isRegexMatch<'foo' | 'bar'>(value, /^(foo|bar)$/)) {
        expect(true as AssertEqual<typeof value, 'foo' | 'bar'>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isRegexMatch(value, /hello/)).toEqual(false)
    })
  })

  describe('RequiredRegexMatch', () => {
    it('should return an function body', () => {
      const validator = new RequiredRegexMatch(/hello/, { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('should export types', () => {
      const validator = new RequiredRegexMatch(/hello/, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string')
    })
  })
})

describe.each([false, true])('Regex (optimize: %s)', optimize => {
  describe('RegexValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredRegexMatch(/^.*$/, { optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate('2018-08-06T13:37:00Z')
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredRegexMatch(/^.*$/i, { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredRegexMatch(/^.*$/i)')
      } else {
        expect(code).toEqual('new RequiredRegexMatch(/^.*$/i, { optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredRegexMatch(/^.*$/, { optimize })
      expect(validator.validate('foo')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredRegexMatch(/^.*$/, { optimize })
      expect(validator.validate(1)).toStrictEqual([new NotStringFail('Must be a string', 1)])
      expect(validator.validate({})).toStrictEqual([new NotStringFail('Must be a string', {})])
      expect(validator.validate([])).toStrictEqual([new NotStringFail('Must be a string', [])])
      expect(validator.validate(true)).toStrictEqual([new NotStringFail('Must be a string', true)])
      expect(validator.validate(false)).toStrictEqual([new NotStringFail('Must be a string', false)])
      expect(validator.validate(null)).toStrictEqual([new NotStringFail('Must be a string', null)])
      expect(true as AssertEqual<typeof validator.tsType, string>).toEqual(true)
    })

    it('rejects undefined', () => {
      const validator = new RequiredRegexMatch(/^.*$/, { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('requires match', () => {
      const validator = new RequiredRegexMatch(/^abcde/, { optimize })
      expect(validator.validate('')).toStrictEqual([new DoesNotMatchRegexFail(`Did not match '/^abcde/'`, '')])
      expect(validator.validate('abcd')).toStrictEqual([new DoesNotMatchRegexFail(`Did not match '/^abcde/'`, 'abcd')])
      expect(validator.validate('abcde')).toStrictEqual([])
      expect(validator.validate('abcdef')).toStrictEqual([])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredRegexMatch(/^abcde/, { optimize })
      expect(validator.validate('', 'myRegex').map(e => e.toString())).toStrictEqual([
        `DoesNotMatchRegexFail: Field 'myRegex' did not match '/^abcde/' (received "")`
      ])
    })
  })

  describe('OptionalRegexMatch', () => {
    it('accepts empty value', () => {
      const validator = new OptionalRegexMatch(/^.*$/, { optimize })
      expect(validator.validate('hello')).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | undefined>).toEqual(true)
    })
  })

  describe('NullableRegexMatch', () => {
    it('accepts empty value', () => {
      const validator = new NullableRegexMatch(/^.*$/, { optimize })
      expect(validator.validate('hello')).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | null>).toEqual(true)
    })
  })

  describe('OptionalNullableRegexMatch', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableRegexMatch(/^.*$/, { optimize })
      expect(validator.validate('hello')).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | undefined | null>).toEqual(true)
    })
  })
})
