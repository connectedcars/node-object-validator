import { AssertEqual } from '../common'
import { NotDateFail, RequiredFail } from '../errors'
import { isDate, NullableDate, OptionalDate, OptionalNullableDate, RequiredDate, validateDate } from './date'

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
        expect(true as AssertEqual<typeof value, Date>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })
    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isDate(value)).toEqual(false)
    })
  })

  describe('RequiredDate', () => {
    it('should return an function body', () => {
      const validator = new RequiredDate({ optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })


    it('toString, constructor', () => {
      // TODO: yes
    })

    it('toString, typescript', () => {
      // TODO: yes
    })

    it('should export types', () => {
      const validator = new RequiredDate({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('Date')
    })
  })
})

describe.each([false, true])('Date (optimize: %s)', optimize => {
  describe('RequiredDate', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredDate({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate(new Date())
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredDate({ optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredDate()')
      } else {
        expect(code).toEqual('new RequiredDate({ optimize: false })')
      }
    })

    it('should export types', () => {
      const validator = new RequiredDate({ optimize })
      const code = validator.toString({ types: true })
      expect(code).toEqual('Date')
    })

    it('accepts valid values', () => {
      const validator = new RequiredDate({ optimize })
      expect(validator.validate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual([])
      expect(validator.validate(new Date('2018-08-06'))).toStrictEqual([])
      expect(validator.validate(new Date('13:37:00'))).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Date>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredDate({ optimize })
      expect(validator.validate(500)).toStrictEqual([new NotDateFail('Must be a Date object', 500)])
      expect(validator.validate('')).toStrictEqual([new NotDateFail('Must be a Date object', '')])
      expect(validator.validate(true)).toStrictEqual([new NotDateFail('Must be a Date object', true)])
      expect(validator.validate(false)).toStrictEqual([new NotDateFail('Must be a Date object', false)])
      expect(validator.validate(null)).toStrictEqual([new NotDateFail('Must be a Date object', null)])
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([
        new NotDateFail('Must be a Date object', '2018-08-06T13:37:00Z')
      ])

      expect(true as AssertEqual<typeof validator.tsType, Date>).toEqual(true)
    })

    it('rejects undefined', () => {
      const validator = new RequiredDate({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredDate({ optimize })
      expect(validator.validate('', 'myDate').map(e => e.toString())).toStrictEqual([
        `NotDateFail: Field 'myDate' must be a Date object (received "")`
      ])
    })
  })

  describe('OptionalDate', () => {
    it('accepts empty value', () => {
      const validator = new OptionalDate({ optimize })
      expect(validator.validate(new Date())).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Date | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      // TODO: yes
    })

    it('toString, typescript', () => {
      // TODO: yes
    })
  })

  describe('NullableDate', () => {
    it('accepts empty value', () => {
      const validator = new NullableDate({ optimize })
      expect(validator.validate(new Date())).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Date | null>).toEqual(true)
    })

    it('toString, constructor', () => {
      // TODO: yes
    })

    it('toString, typescript', () => {
      // TODO: yes
    })
  })

  describe('OptionalNullableDate', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableDate({ optimize })
      expect(validator.validate(new Date())).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Date | null | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      // TODO: yes
    })

    it('toString, typescript', () => {
      // TODO: yes
    })
  })
})
