import { RequiredError } from '../errors'
import { OptionalArray, RequiredArray } from './array'
import { RequiredObject } from './object'

describe('Array', () => {
  describe('validateArray', () => {
    // TODO: Write tests
  })

  describe('RequiredArray', () => {
    it('accepts empty value', function() {
      // TODO: Support multidimensional [{ .Scheme }, RequiredString(), etc. ]
      const validator = new RequiredArray(new RequiredObject({}))
      expect(validator.validate(null)).toStrictEqual([new RequiredError('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredError('Is required')])
    })
  })

  describe('OptionalArray', () => {
    it('accepts empty value', function() {
      const validator = new OptionalArray(new RequiredObject({}))
      expect(validator.validate(null)).toStrictEqual(null)
      expect(validator.validate(undefined)).toStrictEqual(null)
    })
  })
})
