import { AssertEqual } from '../common'
import { RequiredFail } from '../errors'
import { ArrayValidator, isArray, OptionalArray, RequiredArray, validateArray } from './array'
import { RequiredInteger } from './integer'
import { RequiredObject } from './object'

describe('Array', () => {
  describe('validateArray', () => {
    it('should validate simple array', () => {
      const value = [1, 2, 3, 4] as unknown
      const errors = validateArray(new RequiredInteger(), value)
      expect(errors).toEqual([])
    })
  })

  describe('isArray', () => {
    it('should cast value to number array', () => {
      const value = [1, 2, 3, 4] as unknown
      if (isArray<number[]>(new RequiredInteger(), value)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, number[]> = true
      } else {
        fail('did not validate but should')
      }
    })
  })
})

describe.each([false, true])('Array (optimize: %s)', optimize => {
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
