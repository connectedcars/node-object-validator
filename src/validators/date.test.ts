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
    it('should return a function body', () => {
      const validator = new RequiredDate({ optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredDate({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredDate({ optimize: false })')
    })

    it('toString, typescript', () => {
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
      const validator = new OptionalDate({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalDate({ required: false, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalDate({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('Date | undefined')
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
      const validator = new NullableDate({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new NullableDate({ nullable: true, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new NullableDate({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('Date | null')
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
      const validator = new OptionalNullableDate({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalNullableDate({ required: false, nullable: true, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalNullableDate({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('Date | undefined | null')
    })
  })
})

describe('Rust Types', () => {
  it('Required', () => {
    const rustType = new RequiredDate().toString({ types: true, language: 'rust' })
    expect(rustType).toEqual('DateTime<Utc>')
  })

  it('Option', () => {
    const rustType1 = new OptionalDate().toString({ types: true, language: 'rust' })
    expect(rustType1).toEqual('Option<DateTime<Utc>>')

    const rustType2 = new NullableDate().toString({ types: true, language: 'rust' })
    expect(rustType2).toEqual('Option<DateTime<Utc>>')

    const rustType3 = new OptionalNullableDate().toString({ types: true, language: 'rust' })
    expect(rustType3).toEqual('Option<DateTime<Utc>>')
  })

  it('Unknown Language', () => {
    expect(() => {
      new RequiredDate().toString({ types: true, language: 'bingo' as any })
    }).toThrow(`Language: 'bingo' unknown`)
  })
})
