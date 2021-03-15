import { AssertEqual } from '../common'
import { NotBooleanFail, RequiredFail } from '../errors'
import { BooleanValidator, isBoolean, OptionalBoolean, RequiredBoolean, validateBoolean } from './boolean'

describe('Boolean', () => {
  describe('validateBoolean', () => {
    it('requires value to be a boolean', () => {
      const value = true as unknown
      expect(validateBoolean(value)).toStrictEqual([])
    })
  })

  describe('isBoolean', () => {
    it('should cast value to boolean', () => {
      const value = true as unknown
      if (isBoolean(value)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, boolean> = true
      } else {
        fail('did not validate but should')
      }
    })
  })
})

describe.each([false, true])('Boolean (optimize: %s)', optimize => {
  describe('BooleanValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new BooleanValidator({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate(true)
      expect(errors).toEqual([])
    })

    it('requires value to be an boolean', () => {
      const validator = new BooleanValidator({ optimize })
      expect(validator.validate(true)).toStrictEqual([])
      expect(validator.validate(false)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([new NotBooleanFail('Must be an boolean (received "1")')])
      expect(validator.validate(123.9)).toStrictEqual([new NotBooleanFail('Must be an boolean (received "123.9")')])
      expect(validator.validate('1')).toStrictEqual([new NotBooleanFail('Must be an boolean (received "1")')])
      expect(validator.validate('')).toStrictEqual([new NotBooleanFail('Must be an boolean (received "")')])
      expect(validator.validate({})).toStrictEqual([
        new NotBooleanFail('Must be an boolean (received "[object Object]")')
      ])
      expect(validator.validate([])).toStrictEqual([new NotBooleanFail('Must be an boolean (received "")')])
    })
  })

  describe('RequiredBoolean', () => {
    it('rejects empty value', () => {
      const validator = new RequiredBoolean({ optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalBoolean', () => {
    it('accepts empty value', () => {
      const validator = new OptionalBoolean({ optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
