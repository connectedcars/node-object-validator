import { AssertEqual, ValidatorExportOptions } from '../common'
import {
  NotDatetimeOrDateFail,
  NotExactStringFail,
  NotFloatOrFloatStringFail,
  NotIntegerOrIntegerStringFail,
  NotStringFail,
  RequiredFail,
  UnionFail
} from '../errors'
import { OptionalBoolean, RequiredBoolean } from './boolean'
import { RequiredExactString } from './exact-string'
import { RequiredFloat } from './float'
import { RequiredInteger } from './integer'
import { RequiredObject } from './object'
import { RequiredRegexMatch } from './regex-match'
import { RequiredString } from './string'
import { RequiredTuple } from './tuple'
import {
  isUnion,
  NullableDateTimeOrDate,
  NullableEnum,
  NullableFloatOrFloatString,
  NullableIntegerOrIntegerString,
  NullableUnion,
  OptionalDateTimeOrDate,
  OptionalEnum,
  OptionalFloatOrFloatString,
  OptionalIntegerOrIntegerString,
  OptionalNullableDateTimeOrDate,
  OptionalNullableEnum,
  OptionalNullableFloatOrFloatString,
  OptionalNullableIntegerOrIntegerString,
  OptionalNullableUnion,
  OptionalUnion,
  RequiredDateTimeOrDate,
  RequiredEnum,
  RequiredFloatOrFloatString,
  RequiredIntegerOrIntegerString,
  RequiredUnion,
  validateUnion
} from './union'

interface NumberMessage {
  type: 'number'
  value: number
}

interface StringMessage {
  type: 'string'
  value: string
}

interface ErrorMessage {
  type: 'error'
  error: string
}

type Message = ErrorMessage | StringMessage | NumberMessage

describe('Union', () => {
  describe('validateUnion', () => {
    it('should validate simple union', () => {
      const schema = [new RequiredRegexMatch(/^\d+$/), new RequiredFloat()]
      const errors1 = validateUnion(schema, '1244')
      expect(errors1).toEqual([])
      const errors2 = validateUnion(schema, 1244)
      expect(errors2).toEqual([])
    })
  })

  describe('isUnion', () => {
    it('should cast value to boolean', () => {
      const value = 1244 as unknown
      if (isUnion([new RequiredString(), new RequiredFloat()], value)) {
        expect(true as AssertEqual<typeof value, string | number>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isUnion([new RequiredRegexMatch(/^\d+$/), new RequiredFloat()], value)).toEqual(false)
    })
  })

  describe('RequiredUnion', () => {
    it('should return a function body', () => {
      const validator = new RequiredUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, typescript', () => {
      const validator = new RequiredUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | number')
    })

    it('toString, constructor', () => {
      const validator = new RequiredUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      const code = validator.toString()
      expect(code).toEqual(`new RequiredUnion([
  new RequiredString(),
  new RequiredFloat()
], { optimize: false })`)
    })
  })
})

describe.each([false, true])('Union (optimize: %s)', optimize => {
  describe('RequiredUnion', () => {
    const numberMessageValidator = new RequiredObject({
      type: new RequiredExactString('number'),
      value: new RequiredFloat()
    })

    const stringMessageValidator = new RequiredObject({
      type: new RequiredExactString('string'),
      value: new RequiredString()
    })

    const errorMessageValidator = new RequiredObject({
      type: new RequiredExactString('error'),
      error: new RequiredString()
    })

    const messageValidator = new RequiredUnion(
      [numberMessageValidator, stringMessageValidator, errorMessageValidator],
      { optimize }
    )

    it('should validate generate the optimized function', () => {
      if (optimize) {
        expect(messageValidator['optimizedValidate']).not.toBeNull()
      } else {
        expect(messageValidator['optimizedValidate']).toBeNull()
      }
    })

    it('should export validator code with options', () => {
      const code = messageValidator.toString()
      if (optimize) {
        expect(code).toEqual(
          [
            'new RequiredUnion([',
            '  new RequiredObject({',
            `    'type': new RequiredExactString('number'),`,
            `    'value': new RequiredFloat()`,
            '  }),',
            '  new RequiredObject({',
            `    'type': new RequiredExactString('string'),`,
            `    'value': new RequiredString()`,
            '  }),',
            '  new RequiredObject({',
            `    'type': new RequiredExactString('error'),`,
            `    'error': new RequiredString()`,
            '  })',
            '])'
          ].join('\n')
        )
      } else {
        expect(code).toEqual(
          [
            'new RequiredUnion([',
            '  new RequiredObject({',
            `    'type': new RequiredExactString('number'),`,
            `    'value': new RequiredFloat()`,
            '  }),',
            '  new RequiredObject({',
            `    'type': new RequiredExactString('string'),`,
            `    'value': new RequiredString()`,
            '  }),',
            '  new RequiredObject({',
            `    'type': new RequiredExactString('error'),`,
            `    'error': new RequiredString()`,
            '  })',
            '], { optimize: false })'
          ].join('\n')
        )
      }
    })

    it('should export types', () => {
      const code = messageValidator.toString({ types: true })
      expect(code).toEqual(
        [
          '{',
          `  'type': 'number'`,
          `  'value': number`,
          '} | {',
          `  'type': 'string'`,
          `  'value': string`,
          '} | {',
          `  'type': 'error'`,
          `  'error': string`,
          '}'
        ].join('\n')
      )
    })

    it('should validate message of type string', () => {
      const errors = messageValidator.validate({
        type: 'string',
        value: 'hello'
      })
      expect(errors).toEqual([])
      expect(
        true as AssertEqual<
          typeof messageValidator.tsType,
          | {
              type: 'number'
              value: number
            }
          | {
              type: 'string'
              value: string
            }
          | {
              type: 'error'
              error: string
            }
        >
      ).toEqual(true)
    })

    it('should validate message of type string', () => {
      const errors = messageValidator.validate({
        type: 'string',
        value: 'hello'
      })
      expect(errors).toEqual([])
    })

    it('should validate message of type number', () => {
      const errors = messageValidator.validate({
        type: 'number',
        value: 1.0
      })
      expect(errors).toEqual([])
    })

    it('should validate message of type error', () => {
      const errors = messageValidator.validate({
        type: 'error',
        error: 'some error'
      })
      expect(errors).toEqual([])
    })

    it('should cast message to Message type', () => {
      const unknownValue: unknown = {
        type: 'error',
        error: 'some error'
      }

      if (messageValidator.isValid<Message>(unknownValue)) {
        expect(true as AssertEqual<typeof unknownValue, Message>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation will all error messages', () => {
      const everyMessageValidator = new RequiredUnion(
        [numberMessageValidator, stringMessageValidator, errorMessageValidator],
        { optimize, every: true }
      )

      const value: unknown = {
        type: 'error',
        value: 1.0
      }

      const errors = everyMessageValidator.validate(value)
      expect(errors).toEqual([
        new UnionFail(
          `Union entry failed validation with 1 errors`,
          [new NotExactStringFail('Must strictly equal "number"', 'error', `(0)['type']`)],
          value,
          '(0)'
        ),
        new UnionFail(
          `Union entry failed validation with 2 errors`,
          [
            new NotExactStringFail('Must strictly equal "string"', 'error', `(1)['type']`),
            new NotStringFail('Must be a string', 1.0, `(1)['value']`)
          ],
          value,
          '(1)'
        ),
        new UnionFail(
          `Union entry failed validation with 1 errors`,
          [new RequiredFail('Is required', undefined, `(2)['error']`)],
          value,
          '(2)'
        )
      ])
    })

    it('should fail validation with only one error message', () => {
      const errors = messageValidator.validate({
        type: 'error',
        value: 1.0
      })
      expect(errors).toEqual([new RequiredFail(`Is required`, undefined, 'error')])
    })
  })

  describe('OptionalUnion', () => {
    it('should validate null to give no failures', () => {
      const validator = new OptionalUnion(
        [new RequiredExactString('number'), new RequiredExactString('string'), new RequiredExactString('error')],
        { optimize }
      )
      expect(validator.validate('number')).toEqual([])
      expect(validator.validate(undefined)).toEqual([])
      expect(true as AssertEqual<typeof validator.tsType, 'number' | 'string' | 'error' | undefined>).toEqual(true)
    })

    it('toString, typescript', () => {
      const validator = new OptionalUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | number | undefined')
    })

    it('toString, constructor', () => {
      const validator = new OptionalUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      const code = validator.toString()
      expect(code).toEqual(`new OptionalUnion([
  new RequiredString(),
  new RequiredFloat()
], { required: false, optimize: false })`)
    })
  })

  describe('NullableUnion', () => {
    it('should validate null to give no failures', () => {
      const validator = new NullableUnion(
        [new RequiredExactString('number'), new RequiredExactString('string'), new RequiredExactString('error')],
        { optimize }
      )
      expect(validator.validate('number')).toEqual([])
      expect(validator.validate(null)).toEqual([])
      expect(true as AssertEqual<typeof validator.tsType, 'number' | 'string' | 'error' | null>).toEqual(true)
    })

    it('toString, typescript', () => {
      const validator = new NullableUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | number | null')
    })

    it('toString, constructor', () => {
      const validator = new NullableUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      const code = validator.toString()
      expect(code).toEqual(`new NullableUnion([
  new RequiredString(),
  new RequiredFloat()
], { nullable: true, optimize: false })`)
    })
  })

  describe('OptionalNullableUnion', () => {
    it('should validate null to give no failures', () => {
      const validator = new OptionalNullableUnion(
        [new RequiredExactString('number'), new RequiredExactString('string'), new RequiredExactString('error')],
        { optimize }
      )
      expect(validator.validate('number')).toEqual([])
      expect(validator.validate(null)).toEqual([])
      expect(validator.validate(undefined)).toEqual([])
      expect(true as AssertEqual<typeof validator.tsType, 'number' | 'string' | 'error' | null | undefined>).toEqual(
        true
      )
    })

    it('toString, typescript', () => {
      const validator = new OptionalNullableUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | number | undefined | null')
    })

    it('toString, constructor', () => {
      const validator = new OptionalNullableUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      const code = validator.toString()
      expect(code).toEqual(`new OptionalNullableUnion([
  new RequiredString(),
  new RequiredFloat()
], { required: false, nullable: true, optimize: false })`)
    })
  })

  describe('Enum', () => {
    describe('RequiredEnum', () => {
      const enumValidator = new RequiredEnum(['stuff', 'hello', 'more'] as const, { optimize })
      it('should validate message of type string', () => {
        expect(enumValidator.validate('hello')).toEqual([])
        expect(true as AssertEqual<typeof enumValidator.tsType, 'stuff' | 'hello' | 'more'>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new RequiredEnum(['a1', 'b2'], {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`'a1' | 'b2'`)
      })

      it('toString, constructor', () => {
        const validator = new RequiredEnum(['a1', 'b2'], {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new RequiredEnum([
  new RequiredExactString('a1'),
  new RequiredExactString('b2')
], { optimize: false })`)
      })
    })

    describe('OptionalEnum', () => {
      it('should validate null to give no failures', () => {
        const enumValidator = new OptionalEnum(['stuff', 'hello', 'more'] as const, { optimize })
        expect(enumValidator.validate('hello')).toEqual([])
        expect(enumValidator.validate(undefined)).toEqual([])
        expect(true as AssertEqual<typeof enumValidator.tsType, 'stuff' | 'hello' | 'more' | undefined>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new OptionalEnum(['a1', 'b2'], {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`'a1' | 'b2' | undefined`)
      })

      it('toString, constructor', () => {
        const validator = new OptionalEnum(['a1', 'b2'], {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new OptionalEnum([
  new RequiredExactString('a1'),
  new RequiredExactString('b2')
], { required: false, optimize: false })`)
      })
    })

    describe('NullableEnum', () => {
      it('should validate null to give no failures', () => {
        const enumValidator = new NullableEnum(['stuff', 'hello', 'more'] as const, { optimize })
        expect(enumValidator.validate('hello')).toEqual([])
        expect(enumValidator.validate(null)).toEqual([])
        expect(true as AssertEqual<typeof enumValidator.tsType, 'stuff' | 'hello' | 'more' | null>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new NullableEnum(['a1', 'b2'], {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`'a1' | 'b2' | null`)
      })

      it('toString, constructor', () => {
        const validator = new NullableEnum(['a1', 'b2'], {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new NullableEnum([
  new RequiredExactString('a1'),
  new RequiredExactString('b2')
], { nullable: true, optimize: false })`)
      })
    })

    describe('OptionalNullableEnum', () => {
      it('should validate null to give no failures', () => {
        const enumValidator = new OptionalNullableEnum(['stuff', 'hello', 'more'] as const, { optimize })
        expect(enumValidator.validate('hello')).toEqual([])
        expect(enumValidator.validate(undefined)).toEqual([])
        expect(true as AssertEqual<typeof enumValidator.tsType, 'stuff' | 'hello' | 'more' | null | undefined>).toEqual(
          true
        )
      })

      it('toString, typescript', () => {
        const validator = new OptionalNullableEnum(['a1', 'b2'], {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`'a1' | 'b2' | undefined | null`)
      })

      it('toString, constructor', () => {
        const validator = new OptionalNullableEnum(['a1', 'b2'], {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new OptionalNullableEnum([
  new RequiredExactString('a1'),
  new RequiredExactString('b2')
], { required: false, nullable: true, optimize: false })`)
      })
    })
  })

  describe('DateTimeOrDate', () => {
    describe('RequiredDateTimeOrDate', () => {
      it('requires value to be an RFC 3339 timestamp', () => {
        const validator = new RequiredDateTimeOrDate({ optimize })
        expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
        expect(validator.validate('2018-08-06T13:37:00.000Z')).toStrictEqual([])
        expect(validator.validate('2018-08-06T13:37:00+00:00')).toStrictEqual([])
        expect(validator.validate('2018-08-06T13:37:00.000+00:00')).toStrictEqual([])
        expect(validator.validate('')).toStrictEqual([
          new NotDatetimeOrDateFail('Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp', '')
        ])
        expect(validator.validate('2018-08-06')).toStrictEqual([
          new NotDatetimeOrDateFail(
            'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp',
            '2018-08-06'
          )
        ])
        expect(validator.validate('2018-08-06T13:37:00')).toStrictEqual([
          new NotDatetimeOrDateFail(
            'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp',
            '2018-08-06T13:37:00'
          )
        ])
        expect(validator.validate('13:37:00')).toStrictEqual([
          new NotDatetimeOrDateFail(
            'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp',
            '13:37:00'
          )
        ])
        expect(validator.validate('2018-08-ABT13:37:00Z')).toStrictEqual([
          new NotDatetimeOrDateFail(
            'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp',
            '2018-08-ABT13:37:00Z'
          )
        ])
      })

      it('requires value to be a Date object', () => {
        const validator = new RequiredDateTimeOrDate({ optimize })
        expect(validator.validate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual([])
        expect(validator.validate(new Date('2018-08-06'))).toStrictEqual([])
        expect(validator.validate(new Date('13:37:00'))).toStrictEqual([])
        expect(validator.validate(500)).toStrictEqual([
          new NotDatetimeOrDateFail('Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp', 500)
        ])
        expect(validator.validate('')).toStrictEqual([
          new NotDatetimeOrDateFail('Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp', '')
        ])
        expect(validator.validate(true)).toStrictEqual([
          new NotDatetimeOrDateFail('Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp', true)
        ])
        expect(validator.validate(false)).toStrictEqual([
          new NotDatetimeOrDateFail('Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp', false)
        ])
      })

      it('rejects empty value', () => {
        const validator = new RequiredDateTimeOrDate({ optimize })
        expect(validator.validate(null)).toStrictEqual([
          new NotDatetimeOrDateFail('Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp', null)
        ])
        expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
      })

      it('toString, typescript', () => {
        const validator = new RequiredDateTimeOrDate({
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`string | Date`)
      })

      it('toString, constructor', () => {
        const validator = new RequiredDateTimeOrDate({
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new RequiredDateTimeOrDate([
  new RequiredDateTime(),
  new RequiredDate()
], { optimize: false })`)
      })
    })

    describe('OptionalDateTimeOrDate', () => {
      it('accepts empty value', () => {
        const validator = new OptionalDateTimeOrDate({ optimize })
        expect(validator.validate(new Date())).toStrictEqual([])
        expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, Date | string | undefined>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new OptionalDateTimeOrDate({
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`string | Date | undefined`)
      })

      it('toString, constructor', () => {
        const validator = new OptionalDateTimeOrDate({
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new OptionalDateTimeOrDate([
  new RequiredDateTime(),
  new RequiredDate()
], { required: false, optimize: false })`)
      })
    })

    describe('NullableDateTimeOrDate', () => {
      it('accepts empty value', () => {
        const validator = new NullableDateTimeOrDate({ optimize })
        expect(validator.validate(new Date())).toStrictEqual([])
        expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
        expect(validator.validate(null)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, Date | string | null>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new NullableDateTimeOrDate({
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`string | Date | null`)
      })

      it('toString, constructor', () => {
        const validator = new NullableDateTimeOrDate({
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new NullableDateTimeOrDate([
  new RequiredDateTime(),
  new RequiredDate()
], { nullable: true, optimize: false })`)
      })
    })

    describe('OptionalNullableDateTimeOrDate', () => {
      it('accepts empty value', () => {
        const validator = new OptionalNullableDateTimeOrDate({ optimize })
        expect(validator.validate(new Date())).toStrictEqual([])
        expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, Date | string | null | undefined>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new OptionalNullableDateTimeOrDate({
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`string | Date | undefined | null`)
      })

      it('toString, constructor', () => {
        const validator = new OptionalNullableDateTimeOrDate({
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new OptionalNullableDateTimeOrDate([
  new RequiredDateTime(),
  new RequiredDate()
], { required: false, nullable: true, optimize: false })`)
      })
    })
  })

  describe('FloatOrFloatString', () => {
    describe('RequiredFloatOrFloatString', () => {
      it('requires value to be a float', () => {
        const validator = new RequiredFloatOrFloatString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate(0.0001)).toStrictEqual([])
        expect(validator.validate(1)).toStrictEqual([])
        expect(validator.validate(1.25)).toStrictEqual([])
        expect(validator.validate(123)).toStrictEqual([])
        expect(validator.validate('0.0001')).toStrictEqual([])
        expect(validator.validate('1')).toStrictEqual([])
        expect(validator.validate('1.25')).toStrictEqual([])
        expect(validator.validate('123')).toStrictEqual([])
        expect(validator.validate('')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float', '')
        ])
        expect(validator.validate('a')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float', 'a')
        ])
        expect(validator.validate({})).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float', {})
        ])
        expect(validator.validate([])).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float', [])
        ])
        expect(validator.validate(true)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float', true)
        ])
        expect(validator.validate(false)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float', false)
        ])
      })

      it('requires min value', () => {
        const validator = new RequiredFloatOrFloatString(0.5, 500, { optimize })
        expect(validator.validate(-0.1)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', -0.1)
        ])
        expect(validator.validate(0)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', 0)
        ])
        expect(validator.validate(0.1)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', 0.1)
        ])
        expect(validator.validate(0.2)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', 0.2)
        ])
        expect(validator.validate(0.3)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', 0.3)
        ])
        expect(validator.validate(0.4)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', 0.4)
        ])
        expect(validator.validate(0.49999999)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', 0.49999999)
        ])
        expect(validator.validate('0.5')).toStrictEqual([])
        expect(validator.validate('0.6')).toStrictEqual([])
        expect(validator.validate('123.456')).toStrictEqual([])

        expect(validator.validate('-0.1')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', '-0.1')
        ])
        expect(validator.validate('0')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', '0')
        ])
        expect(validator.validate('0.1')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', '0.1')
        ])
        expect(validator.validate('0.2')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', '0.2')
        ])
        expect(validator.validate('0.3')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', '0.3')
        ])
        expect(validator.validate('0.4')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', '0.4')
        ])
        expect(validator.validate('0.49999999')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500', '0.49999999')
        ])
        expect(validator.validate('0.5')).toStrictEqual([])
        expect(validator.validate('0.6')).toStrictEqual([])
        expect(validator.validate('123.456')).toStrictEqual([])
      })

      it('requires value to be a float', () => {
        const validator = new RequiredFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate(-0.1)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float larger than 0', -0.1)
        ])
        expect(validator.validate(1)).toStrictEqual([])
      })

      it('requires value to be a float', () => {
        const validator = new RequiredFloatOrFloatString(Number.MIN_SAFE_INTEGER, 10, { optimize })
        expect(validator.validate(20)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float smaller than 10', 20)
        ])
        expect(validator.validate(1)).toStrictEqual([])
      })

      it('requires max value', () => {
        const validator = new RequiredFloatOrFloatString(-500, 0.5, { optimize })
        expect(validator.validate(-0.1)).toStrictEqual([])
        expect(validator.validate(0)).toStrictEqual([])
        expect(validator.validate(0.1)).toStrictEqual([])
        expect(validator.validate(0.2)).toStrictEqual([])
        expect(validator.validate(0.3)).toStrictEqual([])
        expect(validator.validate(0.4)).toStrictEqual([])
        expect(validator.validate(0.5)).toStrictEqual([])
        expect(validator.validate(0.500000001)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between -500 and 0.5', 0.500000001)
        ])
        expect(validator.validate(0.6)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between -500 and 0.5', 0.6)
        ])
        expect(validator.validate(0.7)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between -500 and 0.5', 0.7)
        ])
        expect(validator.validate('-0.1')).toStrictEqual([])
        expect(validator.validate('0')).toStrictEqual([])
        expect(validator.validate('0.1')).toStrictEqual([])
        expect(validator.validate('0.2')).toStrictEqual([])
        expect(validator.validate('0.3')).toStrictEqual([])
        expect(validator.validate('0.4')).toStrictEqual([])
        expect(validator.validate('0.5')).toStrictEqual([])
        expect(validator.validate('0.500000001')).toStrictEqual([
          new NotFloatOrFloatStringFail(
            'Must be a float or a string formatted float between -500 and 0.5',
            '0.500000001'
          )
        ])
        expect(validator.validate('0.6')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between -500 and 0.5', '0.6')
        ])
        expect(validator.validate('0.7')).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float between -500 and 0.5', '0.7')
        ])
      })

      it('rejects empty value', () => {
        const validator = new RequiredFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate(null)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float larger than 0', null)
        ])
        expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
      })

      it('toString, typescript', () => {
        const validator = new RequiredFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`number | string`)
      })

      it('toString, constructor', () => {
        const validator = new RequiredFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new RequiredFloatOrFloatString([
  new RequiredFloat(0),
  new RequiredFloatString(0)
], { optimize: false })`)
      })
    })

    describe('OptionalFloatOrFloatString', () => {
      it('accepts empty value', () => {
        const validator = new OptionalFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate('0.6')).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, string | number | undefined>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new OptionalFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`number | string | undefined`)
      })

      it('toString, constructor', () => {
        const validator = new OptionalFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new OptionalFloatOrFloatString([
  new RequiredFloat(0),
  new RequiredFloatString(0)
], { required: false, optimize: false })`)
      })
    })

    describe('NullableFloatOrFloatString', () => {
      it('accepts empty value', () => {
        const validator = new NullableFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate('0.6')).toStrictEqual([])
        expect(validator.validate(null)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, string | number | null>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new NullableFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`number | string | null`)
      })

      it('toString, constructor', () => {
        const validator = new NullableFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new NullableFloatOrFloatString([
  new RequiredFloat(0),
  new RequiredFloatString(0)
], { nullable: true, optimize: false })`)
      })
    })

    describe('OptionalNullableFloatOrFloatString', () => {
      it('accepts empty value', () => {
        const validator = new OptionalNullableFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate('0.6')).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(validator.validate(null)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, string | number | null | undefined>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new OptionalNullableFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`number | string | undefined | null`)
      })

      it('toString, constructor', () => {
        const validator = new OptionalNullableFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new OptionalNullableFloatOrFloatString([
  new RequiredFloat(0),
  new RequiredFloatString(0)
], { required: false, nullable: true, optimize: false })`)
      })
    })
  })

  describe('IntegerOrIntegerString', () => {
    describe('RequiredIntegerOrIntegerString', () => {
      it('requires value to be a integer', () => {
        const validator = new RequiredIntegerOrIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
          optimize
        })
        expect(validator.validate(0)).toStrictEqual([])
        expect(validator.validate(1)).toStrictEqual([])
        expect(validator.validate(5)).toStrictEqual([])
        expect(validator.validate(123)).toStrictEqual([])
        expect(validator.validate('0')).toStrictEqual([])
        expect(validator.validate('1')).toStrictEqual([])
        expect(validator.validate('5')).toStrictEqual([])
        expect(validator.validate('123')).toStrictEqual([])
        expect(validator.validate('')).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer', '')
        ])
        expect(validator.validate('0.1')).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer', '0.1')
        ])
        expect(validator.validate(0.1)).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer', 0.1)
        ])
        expect(validator.validate('a')).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer', 'a')
        ])
        expect(validator.validate({})).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer', {})
        ])
        expect(validator.validate([])).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer', [])
        ])
        expect(validator.validate(true)).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer', true)
        ])
        expect(validator.validate(false)).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer', false)
        ])
      })

      it('requires min value', () => {
        const validator = new RequiredIntegerOrIntegerString(1, 500, { optimize })
        expect(validator.validate(-1)).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer between 1 and 500', -1)
        ])
        expect(validator.validate(0)).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer between 1 and 500', 0)
        ])
        expect(validator.validate('5')).toStrictEqual([])
        expect(validator.validate(6)).toStrictEqual([])
        expect(validator.validate('123')).toStrictEqual([])

        expect(validator.validate('-1')).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer between 1 and 500', '-1')
        ])
        expect(validator.validate('0')).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer between 1 and 500', '0')
        ])
        expect(validator.validate('1.5')).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer between 1 and 500', '1.5')
        ])
      })

      it('requires value to be a integer larger than', () => {
        const validator = new RequiredIntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate(-1)).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer larger than 0', -1)
        ])
        expect(validator.validate(1)).toStrictEqual([])
      })

      it('requires value to be a integer smaller than', () => {
        const validator = new RequiredIntegerOrIntegerString(Number.MIN_SAFE_INTEGER, 10, { optimize })
        expect(validator.validate(20)).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer smaller than 10', 20)
        ])
        expect(validator.validate(1)).toStrictEqual([])
      })

      it('requires max value', () => {
        const validator = new RequiredIntegerOrIntegerString(-500, 1, { optimize })
        expect(validator.validate(-1)).toStrictEqual([])
        expect(validator.validate(0)).toStrictEqual([])
        expect(validator.validate(2)).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer between -500 and 1', 2)
        ])
        expect(validator.validate('-1')).toStrictEqual([])
        expect(validator.validate('0')).toStrictEqual([])
        expect(validator.validate('2')).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer between -500 and 1', '2')
        ])
      })

      it('rejects empty value', () => {
        const validator = new RequiredIntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate(null)).toStrictEqual([
          new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer larger than 0', null)
        ])
        expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
      })

      it('toString, typescript', () => {
        const validator = new RequiredIntegerOrIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`number | string`)
      })

      it('toString, constructor', () => {
        const validator = new RequiredIntegerOrIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new RequiredIntegerOrIntegerString([
  new RequiredInteger(),
  new RequiredIntegerString()
], { optimize: false })`)
      })
    })

    describe('OptionalIntegerOrIntegerString', () => {
      it('accepts empty value', () => {
        const validator = new OptionalIntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate('10')).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, string | number | undefined>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new OptionalIntegerOrIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`number | string | undefined`)
      })

      it('toString, constructor', () => {
        const validator = new OptionalIntegerOrIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new OptionalIntegerOrIntegerString([
  new RequiredInteger(),
  new RequiredIntegerString()
], { required: false, optimize: false })`)
      })
    })

    describe('NullableIntegerOrIntegerString', () => {
      it('accepts empty value', () => {
        const validator = new NullableIntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate('10')).toStrictEqual([])
        expect(validator.validate(null)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, string | number | null>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new NullableIntegerOrIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`number | string | null`)
      })

      it('toString, constructor', () => {
        const validator = new NullableIntegerOrIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new NullableIntegerOrIntegerString([
  new RequiredInteger(),
  new RequiredIntegerString()
], { nullable: true, optimize: false })`)
      })
    })

    describe('OptionalNullableIntegerOrIntegerString', () => {
      it('accepts empty value', () => {
        const validator = new OptionalNullableIntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate('10')).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, string | number | null | undefined>).toEqual(true)
      })

      it('toString, typescript', () => {
        const validator = new OptionalNullableIntegerOrIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString({ types: true })
        expect(code).toEqual(`number | string | undefined | null`)
      })

      it('toString, constructor', () => {
        const validator = new OptionalNullableIntegerOrIntegerString(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
          optimize: false
        })
        const code = validator.toString()
        expect(code).toEqual(`new OptionalNullableIntegerOrIntegerString([
  new RequiredInteger(),
  new RequiredIntegerString()
], { required: false, nullable: true, optimize: false })`)
      })
    })
  })
})

describe('Rust Types', () => {
  let typeDefinitions: Record<string, string>
  let options: ValidatorExportOptions

  beforeEach(() => {
    typeDefinitions = {}
    options = {
      types: true,
      language: 'rust',
      typeDefinitions
    }
  })

  it('Required, only ExactString', () => {
    // Big 'S', and small 's'
    const validator = new RequiredUnion([new RequiredExactString('Sut'), new RequiredExactString('sut2')], {
      typeName: 'RustEnum'
    })
    const expectedType = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum RustEnum {
    #[serde(rename = "Sut")]
    Sut,
    #[serde(rename = "sut2")]
    Sut2,
}

`
    expect(validator.toString(options)).toEqual(`RustEnum`)
    expect(typeDefinitions).toEqual({
      RustEnum: expectedType
    })
  })

  it('Required, tagged union, inline', () => {
    const validator = new RequiredUnion(
      [
        new RequiredObject({ bingoTag: new RequiredExactString('kat'), ja: new RequiredBoolean() }),
        new RequiredObject({ bingoTag: new RequiredExactString('mis'), ja: new OptionalBoolean() })
      ],
      {
        typeName: 'RustEnum'
      }
    )

    const expectedKat = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RustEnumKatData {
    pub ja: bool,
}

`
    const expectedMis = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RustEnumMisData {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ja: Option<bool>,
}

`
    const expectedEnum = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "bingoTag")]
pub enum RustEnum {
    #[serde(rename = "kat")]
    Kat(RustEnumKatData),
    #[serde(rename = "mis")]
    Mis(RustEnumMisData),
}

`
    expect(validator.toString(options)).toEqual(`RustEnum`)
    expect(typeDefinitions).toEqual({
      RustEnumKatData: expectedKat,
      RustEnumMisData: expectedMis,
      RustEnum: expectedEnum
    })
  })

  it('Required, tagged union, forceHeap', () => {
    const validator = new RequiredUnion(
      [
        new RequiredObject(
          { bingoTag: new RequiredExactString('kat'), ja: new RequiredBoolean() },
          { forceHeap: true }
        ),
        new RequiredObject({ bingoTag: new RequiredExactString('mis'), ja: new OptionalBoolean() })
      ],
      {
        typeName: 'RustEnum'
      }
    )

    const expectedKat = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RustEnumKatData {
    pub ja: bool,
}

`
    const expectedMis = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RustEnumMisData {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ja: Option<bool>,
}

`
    const expectedEnum = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "bingoTag")]
pub enum RustEnum {
    #[serde(rename = "kat")]
    Kat(Box<RustEnumKatData>),
    #[serde(rename = "mis")]
    Mis(RustEnumMisData),
}

`
    expect(validator.toString(options)).toEqual(`RustEnum`)
    expect(typeDefinitions).toEqual({
      RustEnumKatData: expectedKat,
      RustEnumMisData: expectedMis,
      RustEnum: expectedEnum
    })
  })

  it('Required, tag with empty objects', () => {
    const validator = new RequiredUnion(
      [
        new RequiredObject({ bingoTag: new RequiredExactString('kat') }),
        new RequiredObject({ bingoTag: new RequiredExactString('mis') })
      ],
      {
        typeName: 'RustEnum'
      }
    )

    const expectedEnum = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "bingoTag")]
pub enum RustEnum {
    #[serde(rename = "kat")]
    Kat,
    #[serde(rename = "mis")]
    Mis,
}

`

    expect(validator.toString(options)).toEqual(`RustEnum`)
    expect(typeDefinitions).toEqual({
      RustEnum: expectedEnum
    })
  })

  it('Required, tag with empty objects, mixed with 1 object', () => {
    const validator = new RequiredUnion(
      [
        new RequiredObject({ bingoTag: new RequiredExactString('kat') }),
        new RequiredObject({ bingoTag: new RequiredExactString('mis'), a: new RequiredBoolean() })
      ],
      {
        typeName: 'RustEnum'
      }
    )

    const expectedMis = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RustEnumMisData {
    pub a: bool,
}

`
    const expectedEnum = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "bingoTag")]
pub enum RustEnum {
    #[serde(rename = "kat")]
    Kat,
    #[serde(rename = "mis")]
    Mis(RustEnumMisData),
}

`
    expect(validator.toString(options)).toEqual(`RustEnum`)
    expect(typeDefinitions).toEqual({
      RustEnumMisData: expectedMis,
      RustEnum: expectedEnum
    })
  })

  it('Required, tag with empty objects, mixed with 1 object, with renaming', () => {
    const validator = new RequiredUnion(
      [
        new RequiredObject(
          { bingoTag: new RequiredExactString('kat', { typeName: 'Renamed1' }) },
          { typeName: 'Renamed2' } // Should get ignored
        ),
        new RequiredObject(
          { bingoTag: new RequiredExactString('mis', { typeName: 'Renamed3' }), a: new RequiredBoolean() },
          { typeName: 'Renamed4' }
        )
      ],
      {
        typeName: 'RustEnum'
      }
    )

    const expectedRenamed4 = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Renamed4 {
    pub a: bool,
}

`
    const expectedEnum = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "bingoTag")]
pub enum RustEnum {
    #[serde(rename = "kat")]
    Renamed1,
    #[serde(rename = "mis")]
    Renamed3(Renamed4),
}

`
    expect(validator.toString(options)).toEqual(`RustEnum`)
    expect(typeDefinitions).toEqual({
      Renamed4: expectedRenamed4,
      RustEnum: expectedEnum
    })
  })

  it('Required, no tags, still with values', () => {
    const validator = new RequiredUnion(
      [new RequiredObject({ kat: new RequiredBoolean() }), new RequiredObject({ mis: new RequiredBoolean() })],
      {
        typeName: 'RustEnum'
      }
    )

    const expectedEnum = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum RustEnum {
    #[serde(rename = "kat")]
    Kat(bool),
    #[serde(rename = "mis")]
    Mis(bool),
}

`
    expect(validator.toString(options)).toEqual(`RustEnum`)
    expect(typeDefinitions).toEqual({
      RustEnum: expectedEnum
    })
  })

  it('Required, tagged union, outside, and overwrite typename', () => {
    const outside1Validator = new RequiredObject({
      bingoTag: new RequiredExactString('Kat'),
      ja: new RequiredBoolean()
    })
    const outside2Validator = new RequiredObject({
      bingoTag: new RequiredExactString('Mis'),
      ja: new OptionalBoolean()
    })
    const outside3Validator = new RequiredObject(
      {
        bingoTag: new RequiredExactString('Specific'),
        ja: new OptionalBoolean()
      },
      {
        typeName: 'SpecificTypeName' // Will get used on the type inside
      }
    )

    const validator = new RequiredUnion([outside1Validator, outside2Validator, outside3Validator], {
      typeName: 'RustEnum'
    })

    const expectedOutside1 = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RustEnumKatData {
    pub ja: bool,
}

`
    const expectedOutside2 = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RustEnumMisData {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ja: Option<bool>,
}

`
    const expectedOutside3 = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SpecificTypeName {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ja: Option<bool>,
}

`
    const expectedEnum = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "bingoTag")]
pub enum RustEnum {
    #[serde(rename = "Kat")]
    Kat(RustEnumKatData),
    #[serde(rename = "Mis")]
    Mis(RustEnumMisData),
    #[serde(rename = "Specific")]
    Specific(SpecificTypeName),
}

`
    expect(validator.toString(options)).toEqual(`RustEnum`)
    expect(typeDefinitions).toEqual({
      RustEnumKatData: expectedOutside1,
      RustEnumMisData: expectedOutside2,
      SpecificTypeName: expectedOutside3,
      RustEnum: expectedEnum
    })
  })

  it('Required exactstring (in a union), rename', () => {
    const unionValidator = new RequiredUnion(
      [new RequiredExactString('bingo1'), new RequiredExactString('bIngo2-yes', { typeName: 'Bingo2' })],
      {
        typeName: 'UnionName'
      }
    )
    expect(unionValidator.toString(options)).toEqual('UnionName')

    const expectedNeededUnion = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum UnionName {
    #[serde(rename = "bingo1")]
    Bingo1,
    #[serde(rename = "bIngo2-yes")]
    Bingo2,
}

`
    expect(typeDefinitions).toEqual({
      UnionName: expectedNeededUnion
    })
  })

  it('Required object (in a union), rename', () => {
    const unionValidator = new RequiredUnion(
      [
        new RequiredObject({
          bingo: new RequiredExactString(`computerKatten`, { typeName: 'JaMand' }),
          hello: new OptionalBoolean()
        })
      ],
      {
        typeName: 'UnionName'
      }
    )
    expect(unionValidator.toString(options)).toEqual('UnionName')

    const expectedJaMand = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UnionNameJaMandData {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hello: Option<bool>,
}

`
    const expectedNeededUnion = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "bingo")]
pub enum UnionName {
    #[serde(rename = "computerKatten")]
    JaMand(UnionNameJaMandData),
}

`
    expect(typeDefinitions).toEqual({
      UnionNameJaMandData: expectedJaMand,
      UnionName: expectedNeededUnion
    })
  })

  it('Required object (in a union), double rename', () => {
    const unionValidator1 = new RequiredUnion(
      [
        new RequiredObject(
          {
            bingo: new RequiredExactString(`computerKatten`, { typeName: 'JaMand' }),
            hello: new OptionalBoolean()
          },
          { typeName: 'DoubleRenameFun' }
        ),
        new RequiredObject({ bingo: new RequiredExactString('computerHunden'), hej: new RequiredBoolean() })
      ],
      {
        typeName: 'UnionName'
      }
    )
    type UnionValidatorType = typeof unionValidator1.tsType
    expect(unionValidator1.toString(options)).toEqual('UnionName')

    const expectedDoubleRenameFun = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DoubleRenameFun {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hello: Option<bool>,
}

`

    const expectedAutoNaming = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UnionNameComputerHundenData {
    pub hej: bool,
}

`

    const expectedNeededUnion = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "bingo")]
pub enum UnionName {
    #[serde(rename = "computerKatten")]
    JaMand(DoubleRenameFun),
    #[serde(rename = "computerHunden")]
    ComputerHunden(UnionNameComputerHundenData),
}

`
    expect(typeDefinitions).toEqual({
      DoubleRenameFun: expectedDoubleRenameFun,
      UnionNameComputerHundenData: expectedAutoNaming,
      UnionName: expectedNeededUnion
    })

    // Also make sure that the TypeScript type validates on computerKatten
    const obj1: UnionValidatorType = { bingo: 'computerKatten' }
    const validationErrors1 = unionValidator1.validate(obj1)
    expect(validationErrors1.length).toEqual(0)
  })

  it('Required, Inline data types (single value, tuple inside, tuple outside)', () => {
    const misseKatValidator = new RequiredTuple(
      [new RequiredInteger(0, 255), new RequiredInteger(0, 255), new RequiredInteger(0, 255)],
      { typeName: 'MisseKatTuple' }
    )
    const validator = new RequiredUnion(
      [
        new RequiredObject({ kat: new RequiredInteger(0, 255) }),
        new RequiredObject({ mis: new RequiredTuple([new RequiredInteger(0, 255), new RequiredBoolean()]) }),
        new RequiredObject({ misseKat: misseKatValidator })
      ],
      {
        typeName: 'RustEnum'
      }
    )

    const expectedMisseKat = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MisseKatTuple(u8, u8, u8);

`
    const expectedEnum = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum RustEnum {
    #[serde(rename = "kat")]
    Kat(u8),
    #[serde(rename = "mis")]
    Mis(u8, bool),
    #[serde(rename = "misseKat")]
    MisseKat(MisseKatTuple),
}

`
    expect(validator.toString(options)).toEqual(`RustEnum`)
    expect(typeDefinitions).toEqual({
      MisseKatTuple: expectedMisseKat,
      RustEnum: expectedEnum
    })
  })

  it('Required, comparable, hashable', () => {
    const misseKatValidator = new RequiredTuple(
      [new RequiredInteger(0, 255), new RequiredInteger(0, 255), new RequiredInteger(0, 255)],
      { typeName: 'MisseKatTuple' }
    )
    const validator = new RequiredUnion(
      [
        new RequiredObject({ kat: new RequiredInteger(0, 255) }),
        new RequiredObject({ mis: new RequiredTuple([new RequiredInteger(0, 255), new RequiredBoolean()]) }),
        new RequiredObject({ misseKat: misseKatValidator })
      ],
      {
        typeName: 'RustEnum',
        hashable: true,
        comparable: true
      }
    )

    const expectedMisseKat = `#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub struct MisseKatTuple(u8, u8, u8);

`
    const expectedEnum = `#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum RustEnum {
    #[serde(rename = "kat")]
    Kat(u8),
    #[serde(rename = "mis")]
    Mis(u8, bool),
    #[serde(rename = "misseKat")]
    MisseKat(MisseKatTuple),
}

`
    expect(validator.toString(options)).toEqual(`RustEnum`)
    expect(typeDefinitions).toEqual({
      MisseKatTuple: expectedMisseKat,
      RustEnum: expectedEnum
    })
  })

  it('Optional', () => {
    const validator = new OptionalUnion([new RequiredExactString('Sut'), new RequiredExactString('Sut2')], {
      typeName: 'RustEnum'
    })
    const expectedType = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum RustEnum {
    #[serde(rename = "Sut")]
    Sut,
    #[serde(rename = "Sut2")]
    Sut2,
}

`
    expect(validator.toString(options)).toEqual(`Option<RustEnum>`)
    expect(typeDefinitions).toEqual({
      RustEnum: expectedType
    })
  })

  it('Unknown Language', () => {
    expect(() => {
      new RequiredUnion([new RequiredExactString('SampleString')]).toString({ types: true, language: 'bingo' as any })
    }).toThrow(`Language: 'bingo' unknown`)
  })

  it('No typeName', () => {
    expect(() => {
      new OptionalUnion([new RequiredExactString('Sut')]).toString(options)
    }).toThrow(`'typeName' option is not set`)
  })

  it('No typeDefinitions', () => {
    expect(() => {
      new OptionalUnion([new RequiredExactString('Sut')], { typeName: 'jaNavn' }).toString({
        types: true,
        language: 'rust'
      })
    }).toThrow(`'typeDefinitions' is not set`)
  })
})
