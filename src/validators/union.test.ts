import { NotExactStringFail, NotStringFail, RequiredFail, UnionFail } from '../errors'
import { RequiredExactString } from './exact-string'
import { RequiredFloat } from './float'
import { RequiredObject } from './object'
import { RequiredRegexMatch } from './regex-match'
import { RequiredString } from './string'
import {
  EnumValidator,
  OptionalEnum,
  OptionalUnion,
  RequiredEnum,
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

    it('should faile validation of error message', () => {
      const errors = messageValidator.validate({
        type: 'error',
        value: 1.0
      })
      expect(errors).toEqual([
        new UnionFail(
          `Union entry failed validation with 1 errors`,
          [new NotExactStringFail('Must strictly equal "number" (received "error")', { key: `(0)['type']` })],
          { key: '(0)' }
        ),
        new UnionFail(
          `Union entry failed validation with 2 errors`,
          [
            new NotExactStringFail('Must strictly equal "string" (received "error")', { key: `(1)['type']` }),
            new NotStringFail('Must be a string (received "1")', { key: `(1)['value']` })
          ],
          { key: '(1)' }
        ),
        new UnionFail(
          `Union entry failed validation with 1 errors`,
          [new RequiredFail('Is required', { key: `(2)['error']` })],
          { key: '(2)' }
        )
      ])
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
})
