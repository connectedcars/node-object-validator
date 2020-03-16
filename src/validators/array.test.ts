import { RequiredError } from '../errors'
import { isArray, OptionalArray, RequiredArray } from './array'

describe('Array', () => {
  describe('validateArray', () => {
    // TODO: Write tests
  })

  describe('isArray', () => {
    it('accepts unknown array', () => {
      expect(isArray([])).toBeTruthy()
    })
  })

  describe('RequiredArray', () => {
    it('accepts empty value', function() {
      // TODO: Support multidimensional [{ .Scheme }, RequiredString(), etc. ]
      const validator = new RequiredArray({})
      expect(validator.validate(null)).toStrictEqual(new RequiredError('Is required'))
      expect(validator.validate(undefined)).toStrictEqual(new RequiredError('Is required'))
    })
  })

  describe('OptionalArray', () => {
    it('accepts empty value', function() {
      const validator = new OptionalArray({})
      expect(validator.validate(null)).toStrictEqual(null)
      expect(validator.validate(undefined)).toStrictEqual(null)
    })
  })
})
