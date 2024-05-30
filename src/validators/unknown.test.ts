import { AssertEqual } from '../common'
import { RequiredFail } from '../errors'
import { OptionalUnknown, RequiredUnknown } from './unknown'

describe('Unknown', () => {
  describe('RequiredUnknown', () => {
    it('should return an function body', () => {
      const validator = new RequiredUnknown({ optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredUnknown({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredUnknown({ optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new RequiredUnknown({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('unknown')
    })
  })
})

describe.each([false, true])('Unknown (optimize: %s)', optimize => {
  describe('Unknown', () => {
    describe('RequiredUnknown', () => {
      it('should generate validation code and give same result', () => {
        const validator = new RequiredUnknown({ optimize })
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
        expect(true as AssertEqual<typeof validator.tsType, unknown>).toEqual(true)
      })

      it('should export validator code with options', () => {
        const validator = new RequiredUnknown({ optimize })
        const code = validator.toString()
        if (optimize) {
          expect(code).toEqual('new RequiredUnknown()')
        } else {
          expect(code).toEqual('new RequiredUnknown({ optimize: false })')
        }
      })

      it('rejects empty value', () => {
        const validator = new RequiredUnknown()
        expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
        expect(true as AssertEqual<typeof validator.tsType, unknown>).toEqual(true)
      })
    })

    describe('OptionalUnknown', () => {
      it('accepts empty value', () => {
        const validator = new OptionalUnknown()
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, unknown | undefined>).toEqual(true)
      })

      it('toString, constructor', () => {
        const validator = new OptionalUnknown({ optimize: false })
        const code = validator.toString()
        expect(code).toEqual('new OptionalUnknown({ required: false, optimize: false })')
      })

      it('toString, typescript', () => {
        const validator = new OptionalUnknown({ optimize: false })
        const code = validator.toString({ types: true })
        expect(code).toEqual('unknown | undefined')
      })
    })
  })
})
