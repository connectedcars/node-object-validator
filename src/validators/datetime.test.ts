import { AssertEqual } from '../common'
import { NotRfc3339Fail, RequiredFail, WrongLengthFail } from '../errors'
import { DateTimeValidator, isDateTime, OptionalDateTime, RequiredDateTime, validateDateTime } from './datetime'

describe('DateTime (optimize: %s)', () => {
  describe('validateDateTime', () => {
    it('requires value to be an RFC 3339 timestamp', () => {
      const value = '2018-08-06T13:37:00Z' as unknown
      expect(validateDateTime(value)).toStrictEqual([])
    })
  })

  describe('isDateTime', () => {
    it('should cast to string', () => {
      const value = '2018-08-06T13:37:00Z' as unknown
      if (isDateTime(value)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, string> = true
      } else {
        fail('did not validate but should')
      }
    })
  })
})

describe.each([false, true])('DateTime (optimize: %s)', optimize => {
  describe('DateTimeValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new DateTimeValidator({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate('2018-08-06T13:37:00Z')
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new DateTimeValidator({ optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new DateTimeValidator()')
      } else {
        expect(code).toEqual('new DateTimeValidator({ optimize: false })')
      }
    })

    it('should export types', () => {
      const validator = new DateTimeValidator({ optimize })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string')
    })

    it('requires value to be an RFC 3339 timestamp', () => {
      const validator = new DateTimeValidator({ optimize })
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000000Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00+00:00')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000+00:00')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 30 characters', '')
      ])
      expect(validator.validate('2018-08-06')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 30 characters', '2018-08-06')
      ])
      expect(validator.validate('2018-08-06T13:37:00')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 30 characters', '2018-08-06T13:37:00')
      ])
      expect(validator.validate('13:37:00')).toStrictEqual([
        new WrongLengthFail('Must contain between 20 and 30 characters', '13:37:00')
      ])
      expect(validator.validate('2018-08-ABT13:37:00Z')).toStrictEqual([
        new NotRfc3339Fail('Must be formatted as an RFC 3339 timestamp', '2018-08-ABT13:37:00Z')
      ])
    })

    it('requires value to show correct context on error', () => {
      const validator = new DateTimeValidator({ optimize })
      expect(validator.validate('', 'myDate').map(e => e.toString())).toStrictEqual([
        `WrongLengthFail: Field 'myDate' must contain between 20 and 30 characters (received "")`
      ])
    })
  })

  describe('RequiredDateTime', () => {
    it('rejects empty value', () => {
      const validator = new RequiredDateTime({ optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required', null)])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })
  })

  describe('OptionalDateTime', () => {
    it('accepts empty value', () => {
      const validator = new OptionalDateTime({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
