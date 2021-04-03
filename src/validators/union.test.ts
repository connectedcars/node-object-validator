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
  DateTimeOrDateValidator,
  EnumValidator,
  FloatOrFloatStringValidator,
  IntegerOrIntegerStringValidator,
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
  UnionValidator,
  validateUnion
} from './union'

interface NumberMessage {
  type: 'number'
  value: number
}

interface StringMessage {
  type: 'string'
  value: number
}

interface ErrorMessage {
  type: 'error'
  error: string
}

type Message = ErrorMessage | StringMessage | NumberMessage

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

describe('Union (optimize: %s)', () => {
  describe('validateUnion', () => {
    it('should validate simple union', () => {
      const schema = [new RequiredRegexMatch(/^\d+$/), new RequiredFloat()]
      const errors1 = validateUnion(schema, '1244')
      expect(errors1).toEqual([])
      const errors2 = validateUnion(schema, 1244)
      expect(errors2).toEqual([])
    })
  })
})

describe.each([false, true])('Union (optimize: %s)', optimize => {
  describe('ObjectUnion', () => {
    const messageValidator = new UnionValidator<Message>(
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
            'new UnionValidator([',
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
            '], { optimize: true })'
          ].join('\n')
        )
      } else {
        expect(code).toEqual(
          [
            'new UnionValidator([',
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

    it('should fail validation will all error messages', () => {
      const everyMessageValidator = new UnionValidator<Message>(
        [numberMessageValidator, stringMessageValidator, errorMessageValidator],
        { optimize, every: true }
      )
      const errors = everyMessageValidator.validate({
        type: 'error',
        value: 1.0
      })
      expect(errors).toEqual([
        new UnionFail(
          `Union entry failed validation with 1 errors`,
          [new NotExactStringFail('Must strictly equal "number" (received "error")', `(0)['type']`)],
          '(0)'
        ),
        new UnionFail(
          `Union entry failed validation with 2 errors`,
          [
            new NotExactStringFail('Must strictly equal "string" (received "error")', `(1)['type']`),
            new NotStringFail('Must be a string (received "1")', `(1)['value']`)
          ],
          '(1)'
        ),
        new UnionFail(
          `Union entry failed validation with 1 errors`,
          [new RequiredFail('Is required', `(2)['error']`)],
          '(2)'
        )
      ])
    })

    it('should fail validation with only one error message', () => {
      const errors = messageValidator.validate({
        type: 'error',
        value: 1.0
      })
      expect(errors).toEqual([new RequiredFail(`Is required`, 'error')])
    })
  })

  describe('RequiredUnion', () => {
    const messageValidator = new RequiredUnion<Message>(
      [numberMessageValidator, stringMessageValidator, errorMessageValidator],
      { optimize }
    )

    it('should validate message of type string', () => {
      const errors = messageValidator.validate({
        type: 'string',
        value: 'hello'
      })
      expect(errors).toEqual([])
    })
  })

  describe('OptionalUnion', () => {
    const messageValidator = new OptionalUnion<Message>(
      [numberMessageValidator, stringMessageValidator, errorMessageValidator],
      { optimize }
    )

    it('should validate null to give no failures', () => {
      const errors = messageValidator.validate(null)
      expect(errors).toEqual([])
    })

    it('should validate null to give no failures', () => {
      const errors = messageValidator.validate(undefined)
      expect(errors).toEqual([])
    })
  })

  describe('Enum', () => {
    const enumValidator = new EnumValidator<'stuff' | 'hello' | 'more'>(['stuff', 'hello', 'more'], { optimize })
    it('should validate message of type string', () => {
      const errors = enumValidator.validate('stuff')
      expect(errors).toEqual([])
    })
  })

  describe('RequiredEnum', () => {
    const enumValidator = new RequiredEnum<'stuff' | 'hello' | 'more'>(['stuff', 'hello', 'more'], { optimize })
    it('should validate message of type string', () => {
      const errors = enumValidator.validate('hello')
      expect(errors).toEqual([])
    })
  })

  describe('OptionalUnion', () => {
    const enumValidator = new OptionalEnum<'stuff' | 'hello' | 'more'>(['stuff', 'hello', 'more'], { optimize })
    it('should validate null to give no failures', () => {
      const errors = enumValidator.validate(null)
      expect(errors).toEqual([])
    })

    it('should validate null to give no failures', () => {
      const errors = enumValidator.validate(undefined)
      expect(errors).toEqual([])
    })
  })

  describe('DateTimeOrDateValidator', () => {
    it('requires value to be an RFC 3339 timestamp', () => {
      const validator = new DateTimeOrDateValidator({ optimize })
      expect(validator.validate('2018-08-06T13:37:00Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000Z')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00+00:00')).toStrictEqual([])
      expect(validator.validate('2018-08-06T13:37:00.000+00:00')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "")'
        )
      ])
      expect(validator.validate('2018-08-06')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "2018-08-06")'
        )
      ])
      expect(validator.validate('2018-08-06T13:37:00')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "2018-08-06T13:37:00")'
        )
      ])
      expect(validator.validate('13:37:00')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "13:37:00")'
        )
      ])
      expect(validator.validate('2018-08-ABT13:37:00Z')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "2018-08-ABT13:37:00Z")'
        )
      ])
    })

    it('requires value to be a Date object', () => {
      const validator = new DateTimeOrDateValidator({ optimize })
      expect(validator.validate(new Date('2018-08-06T13:37:00Z'))).toStrictEqual([])
      expect(validator.validate(new Date('2018-08-06'))).toStrictEqual([])
      expect(validator.validate(new Date('13:37:00'))).toStrictEqual([])
      expect(validator.validate(500)).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "500")'
        )
      ])
      expect(validator.validate('')).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "")'
        )
      ])
      expect(validator.validate(true)).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "true")'
        )
      ])
      expect(validator.validate(false)).toStrictEqual([
        new NotDatetimeOrDateFail(
          'Must be a ISO 8601 date or a string formatted as an RFC 3339 timestamp (received "false")'
        )
      ])
    })
  })

  describe('RequiredDateTimeOrDate', () => {
    it('rejects empty value', () => {
      const validator = new RequiredDateTimeOrDate({ optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalDateTimeOrDate', () => {
    it('accepts empty value', () => {
      const validator = new OptionalDateTimeOrDate({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })

  describe('FloatOrFloatStringValidator', () => {
    it('requires value to be a float', () => {
      const validator = new FloatOrFloatStringValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(0.0001)).toStrictEqual([])
      expect(validator.validate(1)).toStrictEqual([])
      expect(validator.validate(1.25)).toStrictEqual([])
      expect(validator.validate(123)).toStrictEqual([])
      expect(validator.validate('0.0001')).toStrictEqual([])
      expect(validator.validate('1')).toStrictEqual([])
      expect(validator.validate('1.25')).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])
      expect(validator.validate('')).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "")')
      ])
      expect(validator.validate('a')).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "a")')
      ])
      expect(validator.validate({})).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "[object Object]")')
      ])
      expect(validator.validate([])).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "")')
      ])
      expect(validator.validate(true)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "true")')
      ])
      expect(validator.validate(false)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float (received "false")')
      ])
    })

    it('requires min value', () => {
      const validator = new FloatOrFloatStringValidator(0.5, 500, { optimize })
      expect(validator.validate(-0.1)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "-0.1")'
        )
      ])
      expect(validator.validate(0)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500 (received "0")')
      ])
      expect(validator.validate(0.1)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.1")'
        )
      ])
      expect(validator.validate(0.2)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.2")'
        )
      ])
      expect(validator.validate(0.3)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.3")'
        )
      ])
      expect(validator.validate(0.4)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.4")'
        )
      ])
      expect(validator.validate(0.49999999)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.49999999")'
        )
      ])
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.6')).toStrictEqual([])
      expect(validator.validate('123.456')).toStrictEqual([])

      expect(validator.validate('-0.1')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "-0.1")'
        )
      ])
      expect(validator.validate('0')).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float between 0.5 and 500 (received "0")')
      ])
      expect(validator.validate('0.1')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.1")'
        )
      ])
      expect(validator.validate('0.2')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.2")'
        )
      ])
      expect(validator.validate('0.3')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.3")'
        )
      ])
      expect(validator.validate('0.4')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.4")'
        )
      ])
      expect(validator.validate('0.49999999')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between 0.5 and 500 (received "0.49999999")'
        )
      ])
      expect(validator.validate('0.5')).toStrictEqual([])
      expect(validator.validate('0.6')).toStrictEqual([])
      expect(validator.validate('123.456')).toStrictEqual([])
    })

    it('requires value to be a float', () => {
      const validator = new FloatOrFloatStringValidator(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(-0.1)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float larger than 0 (received "-0.1")')
      ])
      expect(validator.validate(1)).toStrictEqual([])
    })

    it('requires value to be a float', () => {
      const validator = new FloatOrFloatStringValidator(Number.MIN_SAFE_INTEGER, 10, { optimize })
      expect(validator.validate(20)).toStrictEqual([
        new NotFloatOrFloatStringFail('Must be a float or a string formatted float smaller than 10 (received "20")')
      ])
      expect(validator.validate(1)).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new FloatOrFloatStringValidator(-500, 0.5, { optimize })
      expect(validator.validate(-0.1)).toStrictEqual([])
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(0.1)).toStrictEqual([])
      expect(validator.validate(0.2)).toStrictEqual([])
      expect(validator.validate(0.3)).toStrictEqual([])
      expect(validator.validate(0.4)).toStrictEqual([])
      expect(validator.validate(0.5)).toStrictEqual([])
      expect(validator.validate(0.500000001)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.500000001")'
        )
      ])
      expect(validator.validate(0.6)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.6")'
        )
      ])
      expect(validator.validate(0.7)).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.7")'
        )
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
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.500000001")'
        )
      ])
      expect(validator.validate('0.6')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.6")'
        )
      ])
      expect(validator.validate('0.7')).toStrictEqual([
        new NotFloatOrFloatStringFail(
          'Must be a float or a string formatted float between -500 and 0.5 (received "0.7")'
        )
      ])
    })
  })

  describe('RequiredFloatOrFloatString', () => {
    it('rejects empty value', () => {
      const validator = new RequiredFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalFloatString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalFloatOrFloatString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })

  describe('IntegerOrIntegerStringValidator', () => {
    it('requires value to be a integer', () => {
      const validator = new IntegerOrIntegerStringValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {
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
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "")')
      ])
      expect(validator.validate('0.1')).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "0.1")')
      ])
      expect(validator.validate(0.1)).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "0.1")')
      ])
      expect(validator.validate('a')).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "a")')
      ])
      expect(validator.validate({})).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer (received "[object Object]")'
        )
      ])
      expect(validator.validate([])).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "")')
      ])
      expect(validator.validate(true)).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "true")')
      ])
      expect(validator.validate(false)).toStrictEqual([
        new NotIntegerOrIntegerStringFail('Must be a integer or a string formatted integer (received "false")')
      ])
    })

    it('requires min value', () => {
      const validator = new IntegerOrIntegerStringValidator(1, 500, { optimize })
      expect(validator.validate(-1)).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between 1 and 500 (received "-1")'
        )
      ])
      expect(validator.validate(0)).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between 1 and 500 (received "0")'
        )
      ])
      expect(validator.validate('5')).toStrictEqual([])
      expect(validator.validate(6)).toStrictEqual([])
      expect(validator.validate('123')).toStrictEqual([])

      expect(validator.validate('-1')).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between 1 and 500 (received "-1")'
        )
      ])
      expect(validator.validate('0')).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between 1 and 500 (received "0")'
        )
      ])
      expect(validator.validate('1.5')).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between 1 and 500 (received "1.5")'
        )
      ])
    })

    it('requires value to be a integer larger than', () => {
      const validator = new IntegerOrIntegerStringValidator(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(-1)).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer larger than 0 (received "-1")'
        )
      ])
      expect(validator.validate(1)).toStrictEqual([])
    })

    it('requires value to be a integer smaller than', () => {
      const validator = new IntegerOrIntegerStringValidator(Number.MIN_SAFE_INTEGER, 10, { optimize })
      expect(validator.validate(20)).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer smaller than 10 (received "20")'
        )
      ])
      expect(validator.validate(1)).toStrictEqual([])
    })

    it('requires max value', () => {
      const validator = new IntegerOrIntegerStringValidator(-500, 1, { optimize })
      expect(validator.validate(-1)).toStrictEqual([])
      expect(validator.validate(0)).toStrictEqual([])
      expect(validator.validate(2)).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between -500 and 1 (received "2")'
        )
      ])
      expect(validator.validate('-1')).toStrictEqual([])
      expect(validator.validate('0')).toStrictEqual([])
      expect(validator.validate('2')).toStrictEqual([
        new NotIntegerOrIntegerStringFail(
          'Must be a integer or a string formatted integer between -500 and 1 (received "2")'
        )
      ])
    })
  })

  describe('RequiredIntegerOrIntegerString', () => {
    it('rejects empty value', () => {
      const validator = new RequiredIntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required')])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required')])
    })
  })

  describe('OptionalIntegerString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalIntegerOrIntegerString(0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
