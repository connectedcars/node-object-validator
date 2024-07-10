import { AssertEqual, ValidatorExportOptions } from '../common'
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

    it('toString, constructor', () => {
      const validator = new RequiredRegexMatch(/hello/, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredRegexMatch(/hello/, { optimize: false })')
    })

    it('toString, typescript', () => {
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

    it('toString, constructor', () => {
      const validator = new OptionalRegexMatch(/hello/, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalRegexMatch(/hello/, { required: false, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalRegexMatch(/hello/, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | undefined')
    })
  })

  describe('NullableRegexMatch', () => {
    it('accepts empty value', () => {
      const validator = new NullableRegexMatch(/^.*$/, { optimize })
      expect(validator.validate('hello')).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | null>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new NullableRegexMatch(/hello/, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new NullableRegexMatch(/hello/, { nullable: true, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new NullableRegexMatch(/hello/, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | null')
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

    it('toString, constructor', () => {
      const validator = new OptionalNullableRegexMatch(/hello/, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual(
        'new OptionalNullableRegexMatch(/hello/, { required: false, nullable: true, optimize: false })'
      )
    })

    it('toString, typescript', () => {
      const validator = new OptionalNullableRegexMatch(/hello/, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | undefined | null')
    })
  })
})

describe('Rust Types', () => {
  const options: ValidatorExportOptions = { types: true, language: 'rust' }

  it('Required', () => {
    const rustType = new RequiredRegexMatch(/hello/).toString(options)
    expect(rustType).toEqual('String')
  })

  it('Option', () => {
    const rustType1 = new OptionalRegexMatch(/hello/).toString(options)
    expect(rustType1).toEqual('Option<String>')

    const rustType2 = new NullableRegexMatch(/hello/).toString(options)
    expect(rustType2).toEqual('Option<String>')

    const rustType3 = new OptionalNullableRegexMatch(/hello/).toString(options)
    expect(rustType3).toEqual('Option<String>')
  })

  it('Unknown Language', () => {
    expect(() => {
      new RequiredRegexMatch(/hello/).toString({ types: true, language: 'bingo' as any })
    }).toThrow(`Language: 'bingo' unknown`)
  })
})
