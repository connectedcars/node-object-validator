import { AssertEqual } from '../common'
import { NotFloatFail, OutOfRangeFail, RequiredFail } from '../errors'
import { isFloat, NullableFloat, OptionalFloat, OptionalNullableFloat, RequiredFloat, validateFloat } from './float'

describe('Float', () => {
  describe('validateFloat', () => {
    it('requires value to be a float', () => {
      expect(validateFloat(0.0001)).toStrictEqual([])
    })
  })
  describe('isFloat', () => {
    it('should cast value to float', () => {
      const value = 0.0001 as unknown
      if (isFloat(value)) {
        expect(true as AssertEqual<typeof value, number>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isFloat(value)).toEqual(false)
    })
  })

  describe('RequiredFloat', () => {
    it('should return an function body', () => {
      const validator = new RequiredFloat(0, 10, { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('should export types', () => {
      const validator = new RequiredFloat(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('number')
    })
  })
})

describe.each([false, true])('Float (optimize: %s)', optimize => {
  describe('RequiredFloat', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredFloat(1, 2, { optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate(1.5)
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredFloat(1, 2, { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredFloat(1, 2)')
      } else {
        expect(code).toEqual('new RequiredFloat(1, 2, { optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredFloat(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(0.0001)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(1.25)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, number>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredFloat(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('1')).toStrictEqual([new NotFloatFail('Must be a float', '1')])
      expect(validator.validate('')).toStrictEqual([new NotFloatFail('Must be a float', '')])
      expect(validator.validate({})).toStrictEqual([new NotFloatFail('Must be a float', {})])
      expect(validator.validate([])).toStrictEqual([new NotFloatFail('Must be a float', [])])
      expect(validator.validate(true)).toStrictEqual([new NotFloatFail('Must be a float', true)])
      expect(validator.validate(false)).toStrictEqual([new NotFloatFail('Must be a float', false)])
      expect(validator.validate(null)).toStrictEqual([new NotFloatFail('Must be a float', null)])
      expect(true as AssertEqual<typeof validator.tsType, number>).toEqual(true)
    })

    it('requires min value', () => {
      const validator = new RequiredFloat(0.5, 500, { optimize })
      expect(validator.validate(-0.1)).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', -0.1)])
      expect(validator.validate(0)).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', 0)])
      expect(validator.validate(0.1)).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', 0.1)])
      expect(validator.validate(0.2)).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', 0.2)])
      expect(validator.validate(0.3)).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', 0.3)])
      expect(validator.validate(0.4)).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', 0.4)])
      expect(validator.validate(0.49999999)).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500', 0.49999999)
      ])
      expect(validator.validate(0.5)).toStrictEqual([])
      expect(validator.validate(0.6)).toStrictEqual([])
      expect(validator.validate(123.456)).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new RequiredFloat(-500, 0.5, { optimize })
      expect(validator.validate(-0.1)).toStrictEqual([])
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(0.1)).toStrictEqual([])
      expect(validator.validate(0.2)).toStrictEqual([])
      expect(validator.validate(0.3)).toStrictEqual([])
      expect(validator.validate(0.4)).toStrictEqual([])
      expect(validator.validate(0.5)).toStrictEqual([])
      expect(validator.validate(0.500000001)).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 0.5', 0.500000001)
      ])
      expect(validator.validate(0.6)).toStrictEqual([new OutOfRangeFail('Must be between -500 and 0.5', 0.6)])
      expect(validator.validate(0.7)).toStrictEqual([new OutOfRangeFail('Must be between -500 and 0.5', 0.7)])
    })

    it('rejects undefined', () => {
      const validator = new RequiredFloat(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredFloat(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('', 'float').map(e => e.toString())).toStrictEqual([
        `NotFloatFail: Field 'float' must be a float (received "")`
      ])
    })
  })

  describe('OptionalFloat', () => {
    it('accepts empty value', () => {
      const validator = new OptionalFloat(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(1.0)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, number | undefined>).toEqual(true)
    })
  })

  describe('NullableFloat', () => {
    it('accepts empty value', () => {
      const validator = new NullableFloat(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(1.0)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, number | null>).toEqual(true)
    })
  })

  describe('OptionalNullableFloat', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableFloat(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(1.0)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, number | null | undefined>).toEqual(true)
    })
  })
})
