import { RequiredError } from '../errors'
import { OptionalObject, RequiredObject } from './object'

describe('Object', () => {
  describe('validateObject', () => {})

  describe('OptionalObject', () => {
    it('accepts empty value', function() {
      const validator = new RequiredObject()
      expect(validator.validate((null as unknown) as number)).toStrictEqual(new RequiredError('Is required'))
      expect(validator.validate((undefined as unknown) as number)).toStrictEqual(new RequiredError('Is required'))
    })
  })

  describe('OptionalObject', () => {
    it('accepts empty value', function() {
      const validator = new OptionalObject()
      expect(validator.validate((null as unknown) as number)).toStrictEqual(null)
      expect(validator.validate((undefined as unknown) as number)).toStrictEqual(null)
    })
  })
})
