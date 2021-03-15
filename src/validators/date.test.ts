import { AssertEqual } from '../common'
import { NotDateFail, RequiredFail } from '../errors'
import { DateValidator, isDate, OptionalDate, RequiredDate, validateDate } from './date'

describe('Date', () => {
  describe('validateDate', () => {
    it('should validate simple date', () => {
      const value = new Date('2018-08-06T13:37:00Z') as unknown
      expect(validateDate(value)).toStrictEqual([])
    })
  })

  describe('isDate', () => {
    it('should cast value to Date', () => {
      const value = new Date('2018-08-06T13:37:00Z') as unknown
      if (isDate(value)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, Date> = true
      } else {
        fail('did not validate but should')
      }
    })
  })
})

describe.each([false, true])('Date (optimize: %s)', optimize => {
  describe('DateValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new DateValidator({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate(new Date())
      expect(errors).toEqual([])
    })

    it('requires value to be a Date object', () => {
      const validator = new DateValidator({ optimize })
      expect(validator.validate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual([])
      expect(validator.validate(new Date('2018-08-06'))).toStrictEqual([])
      expect(validator.validate(new Date('13:37:00'))).toStrictEqual([])
      expect(validator.validate(500)).toStrictEqual([new NotDateFail('Must be a Date object')])
      expect(validator.validate('')).toStrictEqual([new NotDateFail('Must be a Date object')])
      expect(validator.validate(true)).toStrictEqual([new NotDateFail('Must be a Date object')])
      expect(validator.validate(false)).toStrictEqual([new NotDateFail('Must be a Date object')])
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([new NotDateFail('Must be a Date object')])
    })

    it('requires value to show correct context on error', () => {
      const validator = new DateValidator({ optimize })
      expect(validator.validate('', { key: 'myDate' }).map(e => e.toString())).toStrictEqual([
        `NotDateFail: Field 'myDate' must be a Date object`
      ])
    })
  })

  describe('OptionalStringValue', () => {
    it('rejects empty value', () => {
      const validator = new RequiredDate({ optimize })
      expect(validator.validate(null)).toEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalStringValue', () => {
    it('accepts empty value', () => {
      const validator = new OptionalDate({ optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
