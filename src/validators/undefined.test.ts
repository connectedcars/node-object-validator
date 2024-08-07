import { AssertEqual } from '../common'
import { NotUndefinedFail } from '../errors'
import { isUndefined, NullableUndefined, OptionalUndefined, RequiredUndefined, validateUndefined } from './undefined'

describe('Undefined', () => {
  describe('validateUndefined', () => {
    it('requires value to be undefined', () => {
      expect(validateUndefined(undefined)).toStrictEqual([])
    })
  })

  describe('isUndefined', () => {
    it('should cast value to undefined', () => {
      const value = undefined as unknown
      if (isUndefined(value)) {
        expect(true as AssertEqual<typeof value, undefined>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isUndefined(value)).toEqual(false)
    })
  })

  describe('RequiredBoolean', () => {
    it('should return a function body', () => {
      const validator = new RequiredUndefined({ optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, typescript', () => {
      const validator = new RequiredUndefined({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('undefined')
    })

    it('toString, constructor', () => {
      const validator = new RequiredUndefined({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredUndefined({ optimize: false })')
    })
  })
})

describe.each([false, true])('Undefined (optimize: %s)', optimize => {
  describe('UndefinedValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredUndefined({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate(undefined)
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredUndefined({ optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredUndefined()')
      } else {
        expect(code).toEqual('new RequiredUndefined({ optimize: false })')
      }
    })

    it('should export types', () => {
      const validator = new RequiredUndefined({ optimize })
      const code = validator.toString({ types: true })
      expect(code).toEqual('undefined')
    })

    it('accepts valid values', () => {
      const validator = new RequiredUndefined({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
    })

    it('rejects invalid values', () => {
      const validator = new RequiredUndefined({ optimize })
      expect(validator.validate(null)).toStrictEqual([new NotUndefinedFail('Must be undefined', null)])
      expect(validator.validate(false)).toStrictEqual([new NotUndefinedFail('Must be undefined', false)])
      expect(validator.validate(1)).toStrictEqual([new NotUndefinedFail('Must be undefined', 1)])
      expect(validator.validate(123.9)).toStrictEqual([new NotUndefinedFail('Must be undefined', 123.9)])
      expect(validator.validate('1')).toStrictEqual([new NotUndefinedFail('Must be undefined', '1')])
      expect(validator.validate('')).toStrictEqual([new NotUndefinedFail('Must be undefined', '')])
      expect(validator.validate({})).toStrictEqual([new NotUndefinedFail('Must be undefined', {})])
      expect(validator.validate([])).toStrictEqual([new NotUndefinedFail('Must be undefined', [])])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredUndefined({ optimize })
      expect(validator.validate('', 'undef').map(e => e.toString())).toStrictEqual([
        `NotUndefinedFail: Field 'undef' must be undefined (received "")`
      ])
    })
  })

  describe('OptionalUndefined', () => {
    it('accepts valid values', () => {
      const validator = new OptionalUndefined({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, undefined>).toEqual(true)
    })

    it('toString, typescript', () => {
      const validator = new OptionalUndefined({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('undefined')
    })

    it('toString, constructor', () => {
      const validator = new OptionalUndefined({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalUndefined({ optimize: false })')
    })
  })

  describe('NullableUndefined', () => {
    it('accepts valid values', () => {
      const validator = new NullableUndefined({ optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, null | undefined>).toEqual(true)
    })

    it('toString, typescript', () => {
      const validator = new NullableUndefined({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('undefined | null')
    })

    it('toString, constructor', () => {
      const validator = new NullableUndefined({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new NullableUndefined({ nullable: true, optimize: false })')
    })
  })
})

describe('Rust Types', () => {
  it('Error', () => {
    expect(() => {
      new RequiredUndefined().toString({ types: true, language: 'rust' })
    }).toThrow(`Undefined is not supported in Rust`)
  })
})
