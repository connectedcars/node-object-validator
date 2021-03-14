import { RequiredFail } from '../errors'
import { OptionalUnknown, RequiredUnknown, UnknownValidator } from './unknown'

describe.each([false, true])('Unknown (optimize: %s)', optimize => {
  describe('Unknown', () => {
    it('should generate validation code and give same result', () => {
      const validator = new UnknownValidator({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      expect(validator.validate('Anything')).toEqual([])
      expect(validator.validate(1)).toEqual([])
      expect(validator.validate(true)).toEqual([])
      expect(validator.validate([])).toEqual([])
      expect(validator.validate({})).toEqual([])
    })

    describe('RequiredUnknown', () => {
      it('requires empty value', () => {
        const validator = new RequiredUnknown()
        expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
        expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
      })
    })

    describe('OptionalString', () => {
      it('requires empty value', () => {
        const validator = new OptionalUnknown()
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
      })
    })
  })
})
