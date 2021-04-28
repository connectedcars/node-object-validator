import { AssertEqual } from '../common'
import {
  NotDatetimeOrDateFail,
  NotExactStringFail,
  NotFloatOrFloatStringFail,
  NotIntegerOrIntegerStringFail,
  NotStringFail,
  RequiredFail,
  UnionFail
} from '../errors'
import { RequiredExactString } from './exact-string'
import { RequiredFloat } from './float'
import { RequiredObject } from './object'
import { RequiredRegexMatch } from './regex-match'
import { RequiredString } from './string'
import {
  isUnion,
  OptionalDateTimeOrDate,
  OptionalEnum,
  OptionalFloatOrFloatString,
  OptionalIntegerOrIntegerString,
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
    it('should return an function body', () => {
      const validator = new RequiredUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('should export types', () => {
      const validator = new RequiredUnion([new RequiredString(), new RequiredFloat()], { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('string | number')
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
        [
          new RequiredObject({
            type: new RequiredExactString('number'),
            value: new RequiredFloat()
          }),
          new RequiredObject({
            type: new RequiredExactString('string'),
            value: new RequiredString()
          }),
          new RequiredObject({
            type: new RequiredExactString('error'),
            error: new RequiredString()
          })
        ],
        { optimize }
      )

      const errors = validator.validate(undefined)
      expect(errors).toEqual([])
      expect(
        true as AssertEqual<
          typeof validator.tsType,
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
          | undefined
        >
      ).toEqual(true)
    })
  })

  describe('Enum', () => {
    describe('RequiredEnum', () => {
      const enumValidator = new RequiredEnum(['stuff', 'hello', 'more'] as const, { optimize })
      it('should validate message of type string', () => {
        const errors = enumValidator.validate('hello')
        expect(errors).toEqual([])
        expect(true as AssertEqual<typeof enumValidator.tsType, 'stuff' | 'hello' | 'more'>).toEqual(true)
      })
    })

    describe('OptionalEnum', () => {
      const enumValidator = new OptionalEnum(['stuff', 'hello', 'more'] as const, { optimize })

      it('should validate null to give no failures', () => {
        expect(enumValidator.validate(undefined)).toEqual([])
        expect(true as AssertEqual<typeof enumValidator.tsType, 'stuff' | 'hello' | 'more' | undefined>).toEqual(true)
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
    })

    describe('OptionalDateTimeOrDate', () => {
      it('accepts empty value', () => {
        const validator = new OptionalDateTimeOrDate({ optimize })
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
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
    })
    it('rejects empty value', () => {
      const validator = new RequiredFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float larger than 0', null)
      ])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    describe('OptionalFloatString', () => {
      it('accepts empty value', () => {
        const validator = new OptionalFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate(null)).toStrictEqual([
          new NotFloatOrFloatStringFail('Must be a float or a string formatted float larger than 0', null)
        ])
        expect(validator.validate(undefined)).toStrictEqual([])
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
    })

    describe('OptionalIntegerString', () => {
      it('accepts empty value', () => {
        const validator = new OptionalIntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, { optimize })
        expect(validator.validate(undefined)).toStrictEqual([])
      })
    })
  })
})
