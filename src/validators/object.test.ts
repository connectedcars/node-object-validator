import { RequiredError } from '../errors'
import { OptionalObject, RequiredObject } from './object'

describe('Object', () => {
  describe('validateObject', () => {})

  describe('RequiredObject', () => {
    it('accepts empty value', function() {
      const validator = new RequiredObject({})
      expect(validator.validate(null)).toStrictEqual([new RequiredError('Is required')])
      expect(validator.validate(undefined as unknown)).toStrictEqual([new RequiredError('Is required')])
    })
  })

  describe('OptionalObject', () => {
    it('accepts empty value', function() {
      const validator = new OptionalObject({})
      expect(validator.validate(null)).toStrictEqual(null)
      expect(validator.validate(undefined)).toStrictEqual(null)
    })
  })
})
