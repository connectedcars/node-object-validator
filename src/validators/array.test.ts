import { AssertEqual } from '../common'
import { NotArrayFail, NotIntegerFail, RequiredFail } from '../errors'
import { ArrayValidator, isArray, OptionalArray, RequiredArray, validateArray } from './array'
import { RequiredInteger } from './integer'
import { RequiredObject } from './object'

describe('Array', () => {
  describe('validateArray', () => {
    it('should validate simple array', () => {
      const value = [1, 2, 3, 4] as unknown
      const errors = validateArray(new RequiredInteger(), value)
      expect(errors).toEqual([])
    })
  })

  describe('isArray', () => {
    it('should cast value to number array', () => {
      const value = [1, 2, 3, 4] as unknown
      if (isArray<number[]>(new RequiredInteger(), value)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const itShouldCastNumberArray: AssertEqual<typeof value, number[]> = true
      } else {
        fail('did not validate but should')
      }
    })
    it('should fail validation', () => {
      const value = [1, 2, 3, 'string'] as unknown
      expect(isArray<number[]>(new RequiredInteger(), value)).toEqual(false)
    })
  })

  describe('ArrayValidator', () => {
    it('should return an function body', () => {
      const arrayValidator = new ArrayValidator(new RequiredInteger(), 0, 10, { optimize: false })
      expect(arrayValidator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('should export types', () => {
      const arrayValidator = new ArrayValidator(new RequiredInteger(), 0, 10, { optimize: false })
      const code = arrayValidator.toString({ types: true })
      expect(code).toEqual('Array<number>')
    })
  })
})

describe.each([false, true])('Array (optimize: %s)', optimize => {
  describe('ArrayValidator', () => {
    it('should validate a valid integer array in both optimized and no optimized form', () => {
      const arrayValidator = new ArrayValidator(new RequiredInteger(), 0, 10, { optimize })
      if (optimize) {
        expect(arrayValidator['optimizedValidate']).not.toBeNull()
      } else {
        expect(arrayValidator['optimizedValidate']).toBeNull()
      }
      const errors = arrayValidator.validate([1, 2, 4, 5])
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const arrayValidator = new ArrayValidator(new RequiredInteger(), 0, 10, { optimize })
      const code = arrayValidator.toString()
      if (optimize) {
        expect(code).toEqual('new ArrayValidator(new RequiredInteger(), 0, 10, { optimize: true })')
      } else {
        expect(code).toEqual('new ArrayValidator(new RequiredInteger(), 0, 10)')
      }
    })

    it('should fail validation of object', () => {
      const arrayValidator = new ArrayValidator(new RequiredInteger(), 0, 10, { optimize })
      const value = { hello: 'stuff' }
      const errors = arrayValidator.validate(value)
      expect(errors).toEqual([new NotArrayFail('Must be an array', value)])
    })

    it('should fail validation of array of objects', () => {
      const arrayValidator = new ArrayValidator(new RequiredInteger(), 0, 10, { optimize })
      const errors = arrayValidator.validate([{ hello: 'stuff' }, { hello: 'more' }])
      expect(errors).toEqual([
        new NotIntegerFail('Must be an integer', { hello: 'stuff' }, '[0]'),
        new NotIntegerFail('Must be an integer', { hello: 'more' }, '[1]')
      ])
    })

    it('should fail early validation of array of objects', () => {
      const arrayValidator = new ArrayValidator(new RequiredInteger(), 0, 10, { optimize, earlyFail: true })
      const errors = arrayValidator.validate([{ hello: 'stuff' }, { hello: 'more' }])
      expect(errors).toEqual([new NotIntegerFail('Must be an integer', { hello: 'stuff' }, '[0]')])
    })
  })

  describe('RequiredArray', () => {
    it('rejects empty value', () => {
      const validator = new RequiredArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([new RequiredFail('Is required', null)])
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })
  })

  describe('OptionalArray', () => {
    it('accepts empty value', () => {
      const validator = new OptionalArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
    })
  })
})
