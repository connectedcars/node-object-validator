import { AssertEqual } from '../common'
import { NotNullFail, RequiredFail } from '../errors'
import { isNull, NullValidator, OptionalNull, RequiredNull, validateNull } from './null'

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, null> = true
      } else {
        fail('did not validate but should')
      }
    })
  })
})

describe.each([false, true])('Null (optimize: %s)', optimize => {
  describe('NullValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new NullValidator({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate(null)
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new NullValidator({ optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new NullValidator({ optimize: true })')
      } else {
        expect(code).toEqual('new NullValidator()')
      }
    })

    it('should export types', () => {
      const validator = new NullValidator({ optimize })
      const code = validator.toString({ types: true })
      expect(code).toEqual('null')
    })

    it('requires value to be an Null', () => {
      const validator = new NullValidator({ optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(false)).toStrictEqual([new NotNullFail('Must be an null', false)])
      expect(validator.validate(1)).toStrictEqual([new NotNullFail('Must be an null', 1)])
      expect(validator.validate(123.9)).toStrictEqual([new NotNullFail('Must be an null', 123.9)])
      expect(validator.validate('1')).toStrictEqual([new NotNullFail('Must be an null', '1')])
      expect(validator.validate('')).toStrictEqual([new NotNullFail('Must be an null', '')])
      expect(validator.validate({})).toStrictEqual([new NotNullFail('Must be an null', {})])
      expect(validator.validate([])).toStrictEqual([new NotNullFail('Must be an null', [])])
    })
  })

  describe('RequiredNull', () => {
    it('rejects empty value', () => {
      const validator = new RequiredNull({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })
  })

  describe('OptionalNull', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNull({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
