import { AssertEqual, ValidatorExportOptions } from '../common'
import { NotArrayFail, NotIntegerFail, RequiredFail } from '../errors'
import { isArray, NullableArray, OptionalArray, OptionalNullableArray, RequiredArray, validateArray } from './array'
import { OptionalInteger, RequiredInteger } from './integer'
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
      if (isArray(new RequiredInteger(), value)) {
        expect(true as AssertEqual<typeof value, number[]>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })
    it('should fail validation', () => {
      const value = [1, 2, 3, 'string'] as unknown
      expect(isArray(new RequiredInteger(), value)).toEqual(false)
    })
  })

  describe('RequiredArray', () => {
    it('should return a function body', () => {
      const validator = new RequiredArray(new RequiredInteger(), 0, 10, { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredArray(new RequiredInteger(), 0, 10, { optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredArray(new RequiredInteger(), 0, 10, { optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new RequiredArray(new RequiredInteger(), 0, 10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('Array<number>')
    })
  })
})

describe.each([false, true])('Array (optimize: %s)', optimize => {
  describe('RequiredArray', () => {
    it('should validate a valid integer array in both optimized and no optimized form', () => {
      const validator = new RequiredArray(new RequiredInteger(), 0, 10, { optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      expect(validator.validate([1, 2, 4, 5])).toEqual([])
    })

    it('should export validator code with options', () => {
      const arrayValidator = new RequiredArray(new RequiredInteger(), 0, 10, { optimize })
      const code = arrayValidator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredArray(new RequiredInteger(), 0, 10)')
      } else {
        expect(code).toEqual('new RequiredArray(new RequiredInteger(), 0, 10, { optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredArray(new RequiredInteger(), 0, 5, { optimize })
      expect(validator.validate([])).toStrictEqual([])
      expect(validator.validate([0, 1, 2, 3])).toEqual([])
      expect(validator.validate([0])).toEqual([])
      expect(validator.validate([0, 1, 2, 3, 4])).toEqual([])
      validator.AssertType<number[], true>()
    })

    it('rejects invalid values', () => {
      const validator = new RequiredArray(new RequiredInteger(), 0, 10, { optimize })
      expect(validator.validate(1)).toStrictEqual([new NotArrayFail('Must be an array', 1)])
      expect(validator.validate(123.9)).toStrictEqual([new NotArrayFail('Must be an array', 123.9)])
      expect(validator.validate('1')).toStrictEqual([new NotArrayFail('Must be an array', '1')])
      expect(validator.validate('')).toStrictEqual([new NotArrayFail('Must be an array', '')])
      expect(validator.validate({})).toStrictEqual([new NotArrayFail('Must be an array', {})])
      expect(validator.validate(null)).toStrictEqual([new NotArrayFail('Must be an array', null)])
      expect(validator.validate({ hello: 'stuff' })).toEqual([new NotArrayFail('Must be an array', { hello: 'stuff' })])
      expect(validator.validate([{ hello: 'stuff' }, { hello: 'more' }])).toEqual([
        new NotIntegerFail('Must be an integer', { hello: 'stuff' }, '[0]'),
        new NotIntegerFail('Must be an integer', { hello: 'more' }, '[1]')
      ])
      validator.AssertType<number[], true>()
    })

    it('should fail early validation of array of objects', () => {
      const validator = new RequiredArray(new RequiredInteger(), 0, 10, { optimize, earlyFail: true })
      expect(validator.validate([{ hello: 'stuff' }, { hello: 'more' }])).toEqual([
        new NotIntegerFail('Must be an integer', { hello: 'stuff' }, '[0]')
      ])
    })

    it('rejects undefined', () => {
      const validator = new RequiredArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
      validator.AssertType<Record<string, any>[], true>()
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate('', 'myArray').map(e => e.toString())).toStrictEqual([
        `NotArrayFail: Field 'myArray' must be an array (received "")`
      ])
    })
  })

  describe('OptionalArray', () => {
    it('accepts empty value', () => {
      const validator = new OptionalArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate([])).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      validator.AssertType<Record<string, any>[] | undefined, true>()
    })

    it('toString, constructor', () => {
      const validator = new OptionalArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      const res = validator.toString()

      if (optimize) {
        const expected = `new OptionalArray(new RequiredObject({

}), { required: false })`
        expect(res).toEqual(expected)
      } else {
        const expected = `new OptionalArray(new RequiredObject({

}), { required: false, optimize: false })`
        expect(res).toEqual(expected)
      }
    })

    it('toString, typescript', () => {
      const validator = new OptionalArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      const res = validator.toString({ types: true })

      const expected = `Array<{

}> | undefined`
      expect(res).toEqual(expected)
    })
  })

  describe('NullableArray', () => {
    it('accepts valid values', () => {
      const validator = new NullableArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate([])).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      validator.AssertType<Record<string, any>[] | null, true>()
    })

    it('toString, constructor', () => {
      const validator = new NullableArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      const res = validator.toString()

      if (optimize) {
        const expected = `new NullableArray(new RequiredObject({

}), { nullable: true })`
        expect(res).toEqual(expected)
      } else {
        const expected = `new NullableArray(new RequiredObject({

}), { nullable: true, optimize: false })`
        expect(res).toEqual(expected)
      }
    })

    it('toString, typescript', () => {
      const validator = new NullableArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      const res = validator.toString({ types: true })

      const expected = `Array<{

}> | null`
      expect(res).toEqual(expected)
    })
  })

  describe('OptionalNullableArray', () => {
    it('accepts valid values', () => {
      const validator = new OptionalNullableArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      expect(validator.validate([])).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      validator.AssertType<Record<string, any>[] | null | undefined, true>()
    })

    it('toString, constructor', () => {
      const validator = new OptionalNullableArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      const res = validator.toString()

      if (optimize) {
        const expected = `new OptionalNullableArray(new RequiredObject({

}), { required: false, nullable: true })`
        expect(res).toEqual(expected)
      } else {
        const expected = `new OptionalNullableArray(new RequiredObject({

}), { required: false, nullable: true, optimize: false })`
        expect(res).toEqual(expected)
      }
    })

    it('toString, typescript', () => {
      const validator = new NullableArray(new RequiredObject({}), 0, Number.MAX_SAFE_INTEGER, { optimize })
      const res = validator.toString({ types: true })

      const expected = `Array<{

}> | null`
      expect(res).toEqual(expected)
    })
  })
})

describe('Rust Types', () => {
  const options: ValidatorExportOptions = { types: true, language: 'rust' }

  it('Vec', () => {
    const rustType = new RequiredArray(new RequiredInteger()).toString(options)
    expect(rustType).toEqual('Vec<i64>')
  })

  it('Option<Vec>', () => {
    const rustType = new OptionalArray(new OptionalInteger()).toString(options)
    expect(rustType).toEqual('Option<Vec<Option<i64>>>')
  })

  it('Unknown Language', () => {
    expect(() => {
      new RequiredArray(new RequiredInteger()).toString({ types: true, language: 'bingo' as any })
    }).toThrow(`Language: 'bingo' unknown`)
  })
})
