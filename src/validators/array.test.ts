import { RequiredError } from '../errors'
import { OptionalArray, RequiredArray } from './array'

describe('Array', () => {
  describe('validateArray', () => {})

  describe('OptionalArray', () => {
    it('accepts empty value', function() {
      const validator = new RequiredArray()
      expect(validator.validate((null as unknown) as number)).toStrictEqual(new RequiredError('Is required'))
      expect(validator.validate((undefined as unknown) as number)).toStrictEqual(new RequiredError('Is required'))
    })
  })

  describe('OptionalArray', () => {
    it('accepts empty value', function() {
      const validator = new OptionalArray()
      expect(validator.validate((null as unknown) as number)).toStrictEqual(null)
      expect(validator.validate((undefined as unknown) as number)).toStrictEqual(null)
    })
  })
})
