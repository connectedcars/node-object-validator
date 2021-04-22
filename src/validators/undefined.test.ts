import { AssertEqual } from '../common'
import { NotUndefinedFail, RequiredFail } from '../errors'
import { isUndefined, OptionalUndefined, RequiredUndefined, UndefinedValidator, validateUndefined } from './undefined'

describe('Undefined', () => {
  describe('validateUndefined', () => {
    it('requires value to be Undefined', () => {
      const value = undefined as unknown
      expect(validateUndefined(value)).toStrictEqual([])
    })
  })

  describe('isUndefined', () => {
    it('should cast value to Undefined', () => {
      const value = undefined as unknown
      if (isUndefined(value)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, undefined> = true
      } else {
        fail('did not validate but should')
      }
    })
  })
})

describe.each([false, true])('Undefined (optimize: %s)', optimize => {
  describe('UndefinedValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new UndefinedValidator({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate(undefined)
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new UndefinedValidator({ optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new UndefinedValidator()')
      } else {
        expect(code).toEqual('new UndefinedValidator({ optimize: false })')
      }
    })

    it('should export types', () => {
      const validator = new UndefinedValidator({ optimize })
      const code = validator.toString({ types: true })
      expect(code).toEqual('undefined')
    })

    it('requires value to be an undefined', () => {
      const validator = new UndefinedValidator({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required', null)])
      expect(validator.validate(false)).toStrictEqual([new NotUndefinedFail('Must be an undefined', false)])
      expect(validator.validate(1)).toStrictEqual([new NotUndefinedFail('Must be an undefined', 1)])
      expect(validator.validate(123.9)).toStrictEqual([new NotUndefinedFail('Must be an undefined', 123.9)])
      expect(validator.validate('1')).toStrictEqual([new NotUndefinedFail('Must be an undefined', '1')])
      expect(validator.validate('')).toStrictEqual([new NotUndefinedFail('Must be an undefined', '')])
      expect(validator.validate({})).toStrictEqual([new NotUndefinedFail('Must be an undefined', {})])
      expect(validator.validate([])).toStrictEqual([new NotUndefinedFail('Must be an undefined', [])])
    })
  })

  describe('RequiredUndefined', () => {
    it('rejects empty value', () => {
      const validator = new RequiredUndefined({ optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required', null)])
    })
  })

  describe('OptionalUndefined', () => {
    it('accepts empty value', () => {
      const validator = new OptionalUndefined({ optimize })
      expect(validator.validate(null)).toStrictEqual([])
    })
  })
})
