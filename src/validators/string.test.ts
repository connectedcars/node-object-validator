import { AssertEqual } from '../common'
import { NotStringFail, RequiredFail, WrongLengthFail } from '../errors'
import {
  isString,
  NullableString,
  OptionalNullableString,
  OptionalString,
  RequiredString,
  validateString
} from './string'

describe('String (optimize: %s)', () => {
  describe('validateString', () => {
    it('requires value to be a string', () => {
      expect(validateString('foo')).toStrictEqual([])
    })
  })
  describe('isString', () => {
    it('requires value to be a string', () => {
      const value = 'foo' as unknown
      if (isString(value)) {
        expect(true as AssertEqual<typeof value, string>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 10 as unknown
      expect(isString(value)).toEqual(false)
    })
  })

  describe('RequiredString', () => {
    it('should return an function body', () => {
      const validator = new RequiredString(0, 10, { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredString(0, 10, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredString(0, 10, { optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new RequiredString(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string')
    })
  })
})

describe.each([false, true])('String (optimize: %s)', optimize => {
  describe('StringValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredString(1, 30, { optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate('MyString')
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredString(1, 30, { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredString(1, 30)')
      } else {
        expect(code).toEqual('new RequiredString(1, 30, { optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('foo')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(1)).toStrictEqual([new NotStringFail('Must be a string', 1)])
      expect(validator.validate({})).toStrictEqual([new NotStringFail('Must be a string', {})])
      expect(validator.validate([])).toStrictEqual([new NotStringFail('Must be a string', [])])
      expect(validator.validate(true)).toStrictEqual([new NotStringFail('Must be a string', true)])
      expect(validator.validate(false)).toStrictEqual([new NotStringFail('Must be a string', false)])
      expect(validator.validate(null)).toStrictEqual([new NotStringFail('Must be a string', null)])
      expect(true as AssertEqual<typeof validator.tsType, string>).toEqual(true)
    })

    it('rejects undefined', () => {
      const validator = new RequiredString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('requires min value length', () => {
      const validator = new RequiredString(5, 500, { optimize })
      expect(validator.validate('')).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters', '')
      ])
      expect(validator.validate('a')).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters', 'a')
      ])
      expect(validator.validate('ab')).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters', 'ab')
      ])
      expect(validator.validate('abc')).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters', 'abc')
      ])
      expect(validator.validate('abcd')).toStrictEqual([
        new WrongLengthFail('Must contain between 5 and 500 characters', 'abcd')
      ])
      expect(validator.validate('abcde')).toStrictEqual([])
      expect(validator.validate('abcdef')).toStrictEqual([])
      expect(validator.validate('this is a long string')).toStrictEqual([])
    })

    it('requires max value length', () => {
      const validator = new RequiredString(0, 5, { optimize })
      expect(validator.validate('')).toStrictEqual([])
      expect(validator.validate('a')).toStrictEqual([])
      expect(validator.validate('ab')).toStrictEqual([])
      expect(validator.validate('abc')).toStrictEqual([])
      expect(validator.validate('abcd')).toStrictEqual([])
      expect(validator.validate('abcde')).toStrictEqual([])
      expect(validator.validate('abcdef')).toStrictEqual([
        new WrongLengthFail('Must contain between 0 and 5 characters', 'abcdef')
      ])
      expect(validator.validate('abcdefg')).toStrictEqual([
        new WrongLengthFail('Must contain between 0 and 5 characters', 'abcdefg')
      ])
      expect(validator.validate('this is a long string')).toStrictEqual([
        new WrongLengthFail('Must contain between 0 and 5 characters', 'this is a long string')
      ])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredString(0, 10, { optimize })
      expect(validator.validate(10, 'str').map(e => e.toString())).toStrictEqual([
        `NotStringFail: Field 'str' must be a string (received "10")`
      ])
    })
  })

  describe('OptionalString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalString()
      expect(validator.validate('')).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalString(0, 10, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalString(0, 10, { required: false, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalString(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | undefined')
    })
  })

  describe('NullableString', () => {
    it('accepts empty value', () => {
      const validator = new NullableString()
      expect(validator.validate('')).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | null>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new NullableString(0, 10, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new NullableString(0, 10, { nullable: true, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new NullableString(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | null')
    })
  })

  describe('OptionalNullableString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableString()
      expect(validator.validate('')).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | null | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalNullableString(0, 10, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalNullableString(0, 10, { required: false, nullable: true, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalNullableString(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | undefined | null')
    })
  })
})

describe('Rust Types', () => {
  it('Required', () => {
    const rustType = new RequiredString().toString({ types: true, language: 'rust' })
    expect(rustType).toEqual('String')
  })

  it('Option', () => {
    const rustType1 = new OptionalString().toString({ types: true, language: 'rust' })
    expect(rustType1).toEqual('Option<String>')

    const rustType2 = new NullableString().toString({ types: true, language: 'rust' })
    expect(rustType2).toEqual('Option<String>')

    const rustType3 = new OptionalNullableString().toString({ types: true, language: 'rust' })
    expect(rustType3).toEqual('Option<String>')
  })

  it('Unknown Language', () => {
    expect(() => {
      new RequiredString().toString({ types: true, language: 'bingo' as any })
    }).toThrow(`Language: 'bingo' unknown`)
  })
})
