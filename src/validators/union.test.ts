import { RequiredExactString } from './exact-string'
import { RequiredFloat } from './float'
import { RequiredObject } from './object'
import { RequiredRegexMatch } from './regex-match'
import { RequiredString } from './string'
import { UnionValidator, validateUnion } from './union'

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
  value: new RequiredString()
})

describe.each([false, true])('Union (optimize: %s)', optimize => {
  describe('validateUnion', () => {
    it('should validate simple union', () => {
      const errors1 = validateUnion([new RequiredRegexMatch(/^\d+$/), new RequiredFloat()], '1244')
      expect(errors1).toEqual([])
      const errors2 = validateUnion([new RequiredRegexMatch(/^\d+$/), new RequiredFloat()], 1244)
      expect(errors2).toEqual([])
    })
  })

  describe('ObjectUnion', () => {
    it('should validation and give expected result', () => {
      const messageValidator = new UnionValidator<Message>(
        [numberMessageValidator, stringMessageValidator, errorMessageValidator],
        { optimize }
      )
      const errors = messageValidator.validate({
        type: 'string',
        value: 'hello'
      })
      expect(errors).toEqual([])
    })
  })
})
