import { RequiredFail } from '../errors'
import { ArrayValidator, OptionalArray, RequiredArray, validateArray } from './array'
import { RequiredInteger } from './integer'
import { RequiredObject } from './object'

describe.each([false, true])('Array (optimize: %s)', optimize => {
  describe('validateArray', () => {
    it('should validate simple array', () => {
      const errors = validateArray(new RequiredInteger(), [1, 2, 3, 4])
      expect(errors).toEqual([])
    })
  })

  describe('ArrayValidator', () => {
    it('should validate and give correct result', () => {
      const arrayValidator = new ArrayValidator(new RequiredInteger(), 0, 10, { optimize })
      const str = arrayValidator.validate.toString()
      if (optimize) {
        expect(str).toMatch(/generatedFunction = true/)
      } else {
        expect(str).not.toMatch(/generatedFunction = true/)
      }
      const errors = arrayValidator.validate([1, 2, 4, 5])
      expect(errors).toEqual([])
    })
  })

  describe('RequiredArray', () => {
    it('accepts empty value', () => {
      // TODO: Support multidimensional [{ .Scheme }, RequiredString(), etc. ]
      const validator = new RequiredArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalArray', () => {
    it('accepts empty value', () => {
      const validator = new OptionalArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
