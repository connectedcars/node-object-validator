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
      expect(validator.validate(null)).toEqual([])
      expect(validator.validate('Anything')).toEqual([])
      expect(validator.validate(1)).toEqual([])
      expect(validator.validate(true)).toEqual([])
      expect(validator.validate([])).toEqual([])
      expect(validator.validate({})).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new UnknownValidator({ optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new UnknownValidator()')
      } else {
        expect(code).toEqual('new UnknownValidator({ optimize: false })')
      }
    })

    it('should export types', () => {
      const validator = new UnknownValidator({ optimize })
      const code = validator.toString({ types: true })
      expect(code).toEqual(`unknown`)
    })

    describe('RequiredUnknown', () => {
      it('rejects empty value', () => {
        const validator = new RequiredUnknown()
        expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
      })
    })

    describe('OptionalUnknown', () => {
      it('accepts empty value', () => {
        const validator = new OptionalUnknown()
        expect(validator.validate(undefined)).toStrictEqual([])
      })
    })
  })
})
