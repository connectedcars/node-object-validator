import { RequiredError } from '../errors'
import { OptionalInteger, RequiredInteger } from './integer'

describe('Integer', () => {
  describe('validateInteger', () => {})

  describe('OptionalInteger', () => {
    it('accepts empty value', function() {
      const validator = new RequiredInteger()
      expect(validator.validate((null as unknown) as number)).toStrictEqual(new RequiredError('Is required'))
      expect(validator.validate((undefined as unknown) as number)).toStrictEqual(new RequiredError('Is required'))
    })
  })

  describe('OptionalInteger', () => {
    it('accepts empty value', function() {
      const validator = new OptionalInteger()
      expect(validator.validate((null as unknown) as number)).toStrictEqual(null)
      expect(validator.validate((undefined as unknown) as number)).toStrictEqual(null)
    })
  })
})
