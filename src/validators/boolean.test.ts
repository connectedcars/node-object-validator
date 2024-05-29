import { AssertEqual } from '../common'
import { NotBooleanFail, RequiredFail } from '../errors'
import {
  isBoolean,
  NullableBoolean,
  OptionalBoolean,
  OptionalNullableBoolean,
  RequiredBoolean,
  validateBoolean
} from './boolean'

describe('Boolean', () => {
  describe('validateBoolean', () => {
    it('requires value to be a boolean', () => {
      expect(validateBoolean(true)).toStrictEqual([])
    })
  })

  describe('isBoolean', () => {
    it('should cast value to boolean', () => {
      const value = true as unknown
      if (isBoolean(value)) {
        expect(true as AssertEqual<typeof value, boolean>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isBoolean(value)).toEqual(false)
    })
  })

  describe('RequiredBoolean', () => {
    it('should return an function body', () => {
      const validator = new RequiredBoolean({ optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredBoolean({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredBoolean({ optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new RequiredBoolean({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('boolean')
    })
  })
})

describe.each([false, true])('Boolean (optimize: %s)', optimize => {
  describe('RequiredBoolean', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredBoolean({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      expect(validator.validate(true)).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredBoolean({ optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredBoolean()')
      } else {
        expect(code).toEqual('new RequiredBoolean({ optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredBoolean({ optimize })
      expect(validator.validate(true)).toStrictEqual([])
      expect(validator.validate(false)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, boolean>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredBoolean({ optimize })
      expect(validator.validate(1)).toStrictEqual([new NotBooleanFail('Must be an boolean', 1)])
      expect(validator.validate(123.9)).toStrictEqual([new NotBooleanFail('Must be an boolean', 123.9)])
      expect(validator.validate('1')).toStrictEqual([new NotBooleanFail('Must be an boolean', '1')])
      expect(validator.validate('')).toStrictEqual([new NotBooleanFail('Must be an boolean', '')])
      expect(validator.validate({})).toStrictEqual([new NotBooleanFail('Must be an boolean', {})])
      expect(validator.validate([])).toStrictEqual([new NotBooleanFail('Must be an boolean', [])])
      expect(validator.validate(null)).toStrictEqual([new NotBooleanFail('Must be an boolean', null)])
      expect(true as AssertEqual<typeof validator.tsType, boolean>).toEqual(true)
    })

    it('rejects undefined', () => {
      const validator = new RequiredBoolean({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredBoolean({ optimize })
      expect(validator.validate('', 'bool').map(e => e.toString())).toStrictEqual([
        `NotBooleanFail: Field 'bool' must be an boolean (received "")`
      ])
    })
  })

  describe('OptionalBoolean', () => {
    it('accepts valid value', () => {
      const validator = new OptionalBoolean({ optimize })
      expect(validator.validate(true)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, boolean | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalBoolean({ optimize })
      const res = validator.toString()
      let expected

      if (optimize) {
        expected = `new OptionalBoolean({ required: false })`
      } else {
        expected = `new OptionalBoolean({ required: false, optimize: false })`
      }

      expect(res).toEqual(expected)
    })

    it('toString, typescript', () => {
      const validator = new OptionalBoolean({ optimize })
      const res = validator.toString({ types: true })
      const expected = `boolean | undefined`

      expect(res).toEqual(expected)
    })
  })

  describe('NullableBoolean', () => {
    it('accepts valid values', () => {
      const validator = new NullableBoolean({ optimize })
      expect(validator.validate(true)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, boolean | null>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new NullableBoolean({ optimize })
      const res = validator.toString()
      let expected

      if (optimize) {
        expected = `new NullableBoolean({ nullable: true })`
      } else {
        expected = `new NullableBoolean({ nullable: true, optimize: false })`
      }

      expect(res).toEqual(expected)
    })

    it('toString, typescript', () => {
      const validator = new NullableBoolean({ optimize })
      const res = validator.toString({ types: true })
      const expected = `boolean | null`

      expect(res).toEqual(expected)
    })
  })

  describe('OptionalNullableBoolean', () => {
    it('accepts valid values', () => {
      const validator = new OptionalNullableBoolean({ optimize })
      expect(validator.validate(true)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, boolean | null | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalNullableBoolean({ optimize })
      const res = validator.toString()
      let expected

      if (optimize) {
        expected = `new OptionalNullableBoolean({ required: false, nullable: true })`
      } else {
        expected = `new OptionalNullableBoolean({ required: false, nullable: true, optimize: false })`
      }

      expect(res).toEqual(expected)
    })

    it('toString, typescript', () => {
      const validator = new OptionalNullableBoolean({ optimize })
      const res = validator.toString({ types: true })
      const expected = `boolean | undefined | null`

      expect(res).toEqual(expected)
    })
  })
})
