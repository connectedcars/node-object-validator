import { NotArrayFail, NotIntegerFail, NotStringFail, RequiredFail, WrongLengthFail } from '../errors'
import { OptionalArray } from './array'
import { RequiredExactString } from './exact-string'
import { RequiredInteger } from './integer'
import { RequiredString } from './string'
import { NullableTuple, OptionalNullableTuple, OptionalTuple, RequiredTuple, validateTuple } from './tuple'
import { RequiredUnion } from './union'

describe('Tuple', () => {
  describe('validateTuple', () => {
    it('valid', () => {
      const value = [1, 'cat']
      const res = validateTuple([new RequiredInteger(), new RequiredString()], value)
      expect(res).toEqual([])
    })

    it('error, wrong type', () => {
      const value = ['cat', 1]
      const res = validateTuple([new RequiredInteger(), new RequiredString()], value)
      expect(res).toEqual([
        new NotIntegerFail('Must be an integer', value[0], '[0]'),
        new NotStringFail('Must be a string', value[1], '[1]')
      ])
    })

    it('error, wrong amount', () => {
      const value = [1, 'cat', 3]
      const res = validateTuple([new RequiredInteger(), new RequiredString()], value)
      expect(res).toEqual([new WrongLengthFail('Must contain exactly 2 entries (found 3)', value)])
    })
  })

  describe('RequiredTuple', () => {
    // From the real life example:
    // type TupleEcu = ['ISOTP' | 'TP2' | 'ISOTP-NOPAD', string, InterfaceType[] | undefined]
    const validator = new RequiredTuple([
      new RequiredUnion([new RequiredExactString('TP2'), new RequiredExactString('ISOTP')]),
      new RequiredString(),
      new OptionalArray(
        new RequiredUnion([
          new RequiredExactString('CAN0'),
          new RequiredExactString('CAN1'),
          new RequiredExactString('CAN85')
        ])
      )
    ])

    it('Assert type', () => {
      validator.AssertType<['ISOTP' | 'TP2', string, Array<'CAN0' | 'CAN1' | 'CAN85'> | undefined], true>()
    })

    it('Valid, optional element exists', () => {
      const value = ['TP2', 'str-a', ['CAN1', 'CAN85']]
      expect(validator.validate(value)).toEqual([])
    })

    it('Valid, optional missing element', () => {
      const value = ['TP2', '', undefined]
      expect(validator.validate(value)).toEqual([])
    })

    it('Invalid, wrong type', () => {
      const value = ['TP2', 85, undefined]
      expect(validator.validate(value)).toEqual([new NotStringFail('Must be a string', value[1], '[1]')])
    })

    it('Invalid, wrong amount', () => {
      const value = ['TP2', 'str-c', undefined, undefined]
      expect(validator.validate(value)).toEqual([
        new WrongLengthFail('Must contain exactly 3 entries (found 4)', value)
      ])
    })

    it('toString, constructor', () => {
      const res = validator.toString()
      const expected = `new RequiredTuple([new RequiredUnion([
  new RequiredExactString('TP2'),
  new RequiredExactString('ISOTP')
]), new RequiredString(), new OptionalArray(new RequiredUnion([
  new RequiredExactString('CAN0'),
  new RequiredExactString('CAN1'),
  new RequiredExactString('CAN85')
]), { required: false })])`
      expect(res).toEqual(expected)
    })

    it('toString, typescript', () => {
      const res = validator.toString({ types: true })
      const expected = `['TP2' | 'ISOTP', string, Array<'CAN0' | 'CAN1' | 'CAN85'> | undefined]`
      expect(res).toEqual(expected)
    })
  })

  describe('OptionalTuple', () => {
    const validator = new OptionalTuple([new RequiredInteger(), new RequiredInteger()])

    it('Assert type', () => {
      validator.AssertType<[number, number] | undefined, true>()
    })

    it('Valid, value', () => {
      const value = [85, 83]
      expect(validator.validate(value)).toEqual([])
    })

    it('Valid, undefined', () => {
      const value = undefined
      expect(validator.validate(value)).toEqual([])
    })

    it('Invalid, null', () => {
      const value = null
      // A tuple is just an array, so this is correct
      expect(validator.validate(value)).toEqual([new NotArrayFail('Must be an array', null)])
    })

    it('toString, constructor', () => {
      const res = validator.toString()
      const expected = `new OptionalTuple([new RequiredInteger(), new RequiredInteger()], { required: false })`
      expect(res).toEqual(expected)
    })

    it('toString, typescript', () => {
      const res = validator.toString({ types: true })
      const expected = `[number, number] | undefined`
      expect(res).toEqual(expected)
    })

    it('toString, constructor', () => {
      // TODO: yes
    })

    it('toString, typescript', () => {
      // TODO: yes
    })
  })

  describe('NullableTuple', () => {
    const validator = new NullableTuple([new RequiredInteger(), new RequiredInteger()])

    it('Assert type', () => {
      validator.AssertType<[number, number] | null, true>()
    })

    it('Valid, value', () => {
      const value = [85, 83]
      expect(validator.validate(value)).toEqual([])
    })

    it('Valid, null', () => {
      const value = null
      expect(validator.validate(value)).toEqual([])
    })

    it('Invalid, undefined', () => {
      const value = undefined
      expect(validator.validate(value)).toEqual([new RequiredFail('Is required', value)])
    })

    it('toString, constructor', () => {
      const res = validator.toString()
      const expected = `new NullableTuple([new RequiredInteger(), new RequiredInteger()], { nullable: true })`
      expect(res).toEqual(expected)
    })

    it('toString, typescript', () => {
      const res = validator.toString({ types: true })
      const expected = `[number, number] | null`
      expect(res).toEqual(expected)
    })

  })

  describe('OptionalNullableTuple', () => {
    const validator = new OptionalNullableTuple([new RequiredInteger(), new RequiredInteger()])

    it('Assert type', () => {
      validator.AssertType<[number, number] | null | undefined, true>()
    })

    it('Valid, value', () => {
      const value = [85, 83]
      expect(validator.validate(value)).toEqual([])
    })

    it('Valid, null', () => {
      const value = null
      expect(validator.validate(value)).toEqual([])
    })

    it('Valid, undefined', () => {
      const value = undefined
      expect(validator.validate(value)).toEqual([])
    })

    it('toString, constructor', () => {
      const res = validator.toString()
      const expected = `new OptionalNullableTuple([new RequiredInteger(), new RequiredInteger()], { required: false, nullable: true })`
      expect(res).toEqual(expected)
    })

    it('toString, typescript', () => {
      const res = validator.toString({ types: true })
      const expected = `[number, number] | undefined | null`
      expect(res).toEqual(expected)
    })
  })
})
