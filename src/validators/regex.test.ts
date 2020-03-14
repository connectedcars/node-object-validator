import { RequiredError } from '../errors'
import { OptionalRegex, RequiredRegex } from './regex'

describe('Regex', () => {
  describe('validateRegex', () => {})

  describe('OptionalRegex', () => {
    it('accepts empty value', function() {
      const validator = new RequiredRegex()
      expect(validator.validate((null as unknown) as number)).toStrictEqual(new RequiredError('Is required'))
      expect(validator.validate((undefined as unknown) as number)).toStrictEqual(new RequiredError('Is required'))
    })
  })

  describe('OptionalRegex', () => {
    it('accepts empty value', function() {
      const validator = new OptionalRegex()
      expect(validator.validate((null as unknown) as number)).toStrictEqual(null)
      expect(validator.validate((undefined as unknown) as number)).toStrictEqual(null)
    })
  })
})
