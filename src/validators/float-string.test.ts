import { AssertEqual } from '../common'
import { NotFloatStringFail, OutOfRangeFail, RequiredFail, WrongLengthFail } from '../errors'
import { isFloatString, OptionalFloatString, RequiredFloatString, validateFloatString } from './float-string'

describe('FloatString', () => {
  describe('validateFloatString', () => {
    it('requires value to be a float', () => {
      expect(validateFloatString('0.0001', 0, 1)).toStrictEqual([])
    })
  })

  describe('isFloatString', () => {
    it('should cast value to boolean', () => {
      const value = '1.0' as unknown
      if (isFloatString(value)) {
        expect(true as AssertEqual<typeof value, string>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isFloatString(value)).toEqual(false)
    })
  })

  describe('RequiredFloatString', () => {
    it('should return an function body', () => {
      const validator = new RequiredFloatString(0, 10, { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('should export types', () => {
      const validator = new RequiredFloatString(0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string')
    })
  })
})

describe.each([false, true])('Float (optimize: %s)', optimize => {
  describe('FloatStringValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredFloatString(0, 10, { optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      expect(validator.validate('1.0')).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredFloatString(0, 10, { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredFloatString(0, 10)')
      } else {
        expect(code).toEqual('new RequiredFloatString(0, 10, { optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredFloatString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('0.0001')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('1.25')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredFloatString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(0.0001)).toStrictEqual([
        new NotFloatStringFail(`Must be a string with a float`, 0.0001)
      ])
      expect(validator.validate(1)).toStrictEqual([new NotFloatStringFail(`Must be a string with a float`, 1)])
      expect(validator.validate(1.25)).toStrictEqual([new NotFloatStringFail(`Must be a string with a float`, 1.25)])
      expect(validator.validate(0)).toStrictEqual([new NotFloatStringFail(`Must be a string with a float`, 0)])
      expect(validator.validate('')).toStrictEqual([new WrongLengthFail('Must be a string with a float', '')])
      expect(validator.validate('a')).toStrictEqual([new NotFloatStringFail('Must be a string with a float', 'a')])
      expect(validator.validate({})).toStrictEqual([new NotFloatStringFail('Must be a string with a float', {})])
      expect(validator.validate([])).toStrictEqual([new NotFloatStringFail('Must be a string with a float', [])])
      expect(validator.validate(true)).toStrictEqual([new NotFloatStringFail('Must be a string with a float', true)])
      expect(validator.validate(false)).toStrictEqual([new NotFloatStringFail('Must be a string with a float', false)])
      expect(validator.validate(null)).toStrictEqual([new NotFloatStringFail('Must be a string with a float', null)])
    })

    it('requires min value', () => {
      const validator = new RequiredFloatString(0.5, 500, { optimize })
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.6')).toStrictEqual([])
      expect(validator.validate('123.456')).toStrictEqual([])

      expect(validator.validate('-0.1')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', '-0.1')])
      expect(validator.validate('0')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', '0')])
      expect(validator.validate('0.1')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', '0.1')])
      expect(validator.validate('0.2')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', '0.2')])
      expect(validator.validate('0.3')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', '0.3')])
      expect(validator.validate('0.4')).toStrictEqual([new OutOfRangeFail('Must be between 0.5 and 500', '0.4')])
      expect(validator.validate('0.49999999')).toStrictEqual([
        new OutOfRangeFail('Must be between 0.5 and 500', '0.49999999')
      ])
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.6')).toStrictEqual([])
      expect(validator.validate('123.456')).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new RequiredFloatString(-500, 0.5, { optimize })
      expect(validator.validate('-0.1')).toStrictEqual([])
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('0.1')).toStrictEqual([])
      expect(validator.validate('0.2')).toStrictEqual([])
      expect(validator.validate('0.3')).toStrictEqual([])
      expect(validator.validate('0.4')).toStrictEqual([])
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.500000001')).toStrictEqual([
        new OutOfRangeFail('Must be between -500 and 0.5', '0.500000001')
      ])
      expect(validator.validate('0.6')).toStrictEqual([new OutOfRangeFail('Must be between -500 and 0.5', '0.6')])
      expect(validator.validate('0.7')).toStrictEqual([new OutOfRangeFail('Must be between -500 and 0.5', '0.7')])
    })

    it('rejects undefined', () => {
      const validator = new RequiredFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('', 'myFloat').map(e => e.toString())).toStrictEqual([
        `WrongLengthFail: Field 'myFloat' must be a string with a float (received "")`
      ])
    })
  })

  describe('OptionalFloatString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | undefined>).toEqual(true)
    })
  })
})
