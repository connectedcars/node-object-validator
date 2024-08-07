import { AssertEqual } from '../common'
import { NotRfc3339Fail, NotStringFail, RequiredFail, WrongLengthFail } from '../errors'
import {
  isDateTime,
  NullableDateTime,
  OptionalDateTime,
  OptionalNullableDateTime,
  RequiredDateTime,
  validateDateTime
} from './datetime'

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
        expect(true as AssertEqual<typeof value, string>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })
  })

  describe('RequiredBoolean', () => {
    it('should return a function body', () => {
      const booleanValidator = new RequiredDateTime({ optimize: false })
      expect(booleanValidator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredDateTime({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredDateTime({ optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new RequiredDateTime({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string')
    })
  })
})

describe.each([false, true])('DateTime (optimize: %s)', optimize => {
  describe('DateTimeValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredDateTime({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate('2018-08-06T13:37:00Z')
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredDateTime({ optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredDateTime()')
      } else {
        expect(code).toEqual('new RequiredDateTime({ optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredDateTime({ optimize })
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000000Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00+00:00')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000+00:00')).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredDateTime({ optimize })
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
      expect(validator.validate(null)).toStrictEqual([new NotStringFail('Must be a string', null)])
      expect(true as AssertEqual<typeof validator.tsType, string>).toEqual(true)
    })

    it('rejects undefined', () => {
      const validator = new RequiredDateTime({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredDateTime({ optimize })
      expect(validator.validate('', 'myDate').map(e => e.toString())).toStrictEqual([
        `WrongLengthFail: Field 'myDate' must contain between 20 and 30 characters (received "")`
      ])
    })
  })

  describe('OptionalDateTime', () => {
    it('accepts empty value', () => {
      const validator = new OptionalDateTime({ optimize })
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalDateTime({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalDateTime({ required: false, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalDateTime({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | undefined')
    })
  })

  describe('NullableDateTime', () => {
    it('accepts empty value', () => {
      const validator = new NullableDateTime({ optimize })
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | null>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new NullableDateTime({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new NullableDateTime({ nullable: true, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new NullableDateTime({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | null')
    })
  })

  describe('OptionalNullableDateTime', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableDateTime({ optimize })
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, string | null | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalNullableDateTime({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalNullableDateTime({ required: false, nullable: true, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalNullableDateTime({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | undefined | null')
    })
  })
})

describe('Rust Types', () => {
  it('Required', () => {
    const rustType = new RequiredDateTime().toString({ types: true, language: 'rust' })
    expect(rustType).toEqual('DateTime<Utc>')
  })

  it('Option', () => {
    const rustType1 = new OptionalDateTime().toString({ types: true, language: 'rust' })
    expect(rustType1).toEqual('Option<DateTime<Utc>>')

    const rustType2 = new NullableDateTime().toString({ types: true, language: 'rust' })
    expect(rustType2).toEqual('Option<DateTime<Utc>>')

    const rustType3 = new OptionalNullableDateTime().toString({ types: true, language: 'rust' })
    expect(rustType3).toEqual('Option<DateTime<Utc>>')
  })

  it('Unknown Language', () => {
    expect(() => {
      new RequiredDateTime().toString({ types: true, language: 'bingo' as any })
    }).toThrow(`Language: 'bingo' unknown`)
  })
})
