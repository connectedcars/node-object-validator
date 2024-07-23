import { AssertEqual } from '../common'
import { NotNullFail, RequiredFail } from '../errors'
import { isNull, OptionalNull, RequiredNull, validateNull } from './null'

describe('Null', () => {
  describe('validateNull', () => {
    it('requires value to be null', () => {
      const value = null as unknown
      expect(validateNull(value)).toStrictEqual([])
    })
  })

  describe('isNull', () => {
    it('should cast value to null', () => {
      const value = null as unknown
      if (isNull(value)) {
        expect(true as AssertEqual<typeof value, null>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isNull(value)).toEqual(false)
    })
  })

  describe('RequiredNull', () => {
    it('should return a function body', () => {
      const validator = new RequiredNull({ optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredNull({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredNull({ optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new RequiredNull({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('null')
    })
  })
})

describe.each([false, true])('Null (optimize: %s)', optimize => {
  describe('RequiredNull', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredNull({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate(null)
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredNull({ optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredNull()')
      } else {
        expect(code).toEqual('new RequiredNull({ optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredNull({ optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, null>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredNull({ optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(false)).toStrictEqual([new NotNullFail('Must be null', false)])
      expect(validator.validate(1)).toStrictEqual([new NotNullFail('Must be null', 1)])
      expect(validator.validate(123.9)).toStrictEqual([new NotNullFail('Must be null', 123.9)])
      expect(validator.validate('1')).toStrictEqual([new NotNullFail('Must be null', '1')])
      expect(validator.validate('')).toStrictEqual([new NotNullFail('Must be null', '')])
      expect(validator.validate({})).toStrictEqual([new NotNullFail('Must be null', {})])
      expect(validator.validate([])).toStrictEqual([new NotNullFail('Must be null', [])])
      expect(true as AssertEqual<typeof validator.tsType, null>).toEqual(true)
    })

    it('rejects undefined', () => {
      const validator = new RequiredNull({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })
  })

  describe('OptionalNull', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNull({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, null | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalNull({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalNull({ required: false, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalNull({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('null | undefined')
    })
  })
})

describe('Rust Types', () => {
  it('Error', () => {
    expect(() => {
      new RequiredNull().toString({ types: true, language: 'rust' })
    }).toThrow(`Null is not supported in Rust`)
  })
})
