import { RequiredFail } from '../errors'
import { ArrayValidator, OptionalArray, RequiredArray } from './array'
import { RequiredInteger } from './integer'
import { RequiredObject } from './object'

describe('Array', () => {
  describe('validateArray', () => {
    // TODO: Write tests
  })

  describe('ArrayValidator', () => {
    const arrayValidator = new ArrayValidator(new RequiredInteger(), 0, 10, { optimize: true })

    it('should generate code for validation and give same result', () => {
      const str = arrayValidator.validate.toString()
      expect(str).toMatch(/generatedFunction = true/)
      const errors = arrayValidator.validate([1, 2, 4, 5])
      expect(errors).toEqual([])
    })
  })

  describe('RequiredArray', () => {
    it('accepts empty value', function() {
      // TODO: Support multidimensional [{ .Scheme }, RequiredString(), etc. ]
      const validator = new RequiredArray(new RequiredObject({}))
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalArray', () => {
    it('accepts empty value', function() {
      const validator = new OptionalArray(new RequiredObject({}))
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
