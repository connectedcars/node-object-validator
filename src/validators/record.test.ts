import { RequiredFloat, RequiredInteger } from '..'
import { AssertEqual, ValidatorExportOptions } from '../common'
import { NotIntegerFail, NotObjectFail, RequiredFail } from '../errors'
import {
  isRecord,
  NullableRecord,
  OptionalNullableRecord,
  OptionalRecord,
  RequiredRecord,
  validateRecord
} from './record'

describe('Record', () => {
  describe('validateRecord', () => {
    it('should validate simple record', () => {
      expect(validateRecord(new RequiredInteger(1, 2), { int: 1 })).toEqual([])
    })
  })

  describe('isRecord', () => {
    it('should cast to simple Record', () => {
      const value = { int: 1 } as unknown
      if (isRecord(new RequiredInteger(1, 2), value)) {
        expect(true as AssertEqual<typeof value, Record<string, number>>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })
  })

  it('should fail validation', () => {
    const value = 'string' as unknown
    expect(isRecord(new RequiredInteger(1, 2), value)).toEqual(false)
  })

  describe('RequiredInteger', () => {
    it('should return an function body', () => {
      const validator = new RequiredRecord(new RequiredInteger(1, 2), { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredRecord(new RequiredInteger(1, 2))
      const code = validator.toString()
      expect(code).toEqual(`new RequiredRecord(new RequiredInteger(1, 2))`)
    })

    it('toString, typescript', () => {
      const validator = new RequiredRecord(new RequiredInteger(1, 2))
      const code = validator.toString({ types: true })
      expect(code).toEqual(`Record<string, number>`)
    })
  })
})

describe.each([false, true])('Record (optimize: %s)', optimize => {
  describe('RecordValidator', () => {
    it('should generate validation code and give same result', () => {
      const objectValidator = new RequiredRecord(new RequiredInteger(1, 2), { optimize })

      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        optionalArray: 1
      }
      if (optimize) {
        expect(objectValidator['optimizedValidate']).not.toBeNull()
      } else {
        expect(objectValidator['optimizedValidate']).toBeNull()
      }
      const errors = objectValidator.validate(unknownValue)
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredRecord(new RequiredFloat(), { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual(`new RequiredRecord(new RequiredFloat())`)
      } else {
        expect(code).toEqual(`new RequiredRecord(new RequiredFloat(), { optimize: false })`)
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredRecord(new RequiredInteger(1, 2), { optimize })
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1
      }
      expect(validator.validate(unknownValue)).toEqual([])
    })

    it('rejects invalid values', () => {
      const validator = new RequiredRecord(new RequiredInteger(1, 2), { optimize })
      const unknownValue: unknown = {
        requiredObject: {
          int: 1,
          optionalInt: '1'
        },
        optionalArray: ['1'],
        optionalArrayArray: [1]
      }
      expect(validator.validate(unknownValue)).toEqual([
        new NotIntegerFail(`Must be an integer`, { int: 1, optionalInt: '1' }, 'requiredObject'),
        new NotIntegerFail(`Must be an integer`, ['1'], 'optionalArray'),
        new NotIntegerFail(`Must be an integer`, [1], 'optionalArrayArray')
      ])
      expect(validator.validate(null)).toStrictEqual([new NotObjectFail('Must be an object', null)])
    })

    it('rejects undefined', () => {
      const validator = new RequiredRecord(new RequiredInteger(), { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('should cast type guard correctly for isType', () => {
      const validator = new RequiredRecord(new RequiredInteger(1, 2), { optimize })
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1
      }
      const errors = validator.validate(unknownValue)
      if (validator.isType(unknownValue, errors)) {
        expect(true as AssertEqual<typeof unknownValue, Record<string, number>>).toEqual(true)
      } else {
        expect('did not validate but should').toBe('')
      }
    })

    it('should cast type guard correctly for isValid', () => {
      const validator = new RequiredRecord(new RequiredInteger(1, 2), { optimize })

      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1
      }
      if (validator.isValid(unknownValue)) {
        expect(true as AssertEqual<typeof unknownValue, Record<string, number>>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    describe('OptionalRecord', () => {
      it('accepts empty value', () => {
        const validator = new OptionalRecord(new RequiredInteger(1, 2), { optimize })
        expect(validator.validate({})).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, Record<string, any> | undefined>).toEqual(true)
      })

      it('toString, constructor', () => {
        const validator = new OptionalRecord(new RequiredInteger(1, 2))
        const code = validator.toString()
        expect(code).toEqual(`new OptionalRecord(new RequiredInteger(1, 2), { required: false })`)
      })

      it('toString, typescript', () => {
        const validator = new OptionalRecord(new RequiredInteger(1, 2))
        const code = validator.toString({ types: true })
        expect(code).toEqual(`Record<string, number> | undefined`)
      })
    })

    describe('NullableRecord', () => {
      it('accepts empty value', () => {
        const validator = new NullableRecord(new RequiredInteger(1, 2), { optimize })
        expect(validator.validate({})).toStrictEqual([])
        expect(validator.validate(null)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, Record<string, any> | null>).toEqual(true)
      })

      it('toString, constructor', () => {
        const validator = new NullableRecord(new RequiredInteger(1, 2))
        const code = validator.toString()
        expect(code).toEqual(`new NullableRecord(new RequiredInteger(1, 2), { nullable: true })`)
      })

      it('toString, typescript', () => {
        const validator = new NullableRecord(new RequiredInteger(1, 2))
        const code = validator.toString({ types: true })
        expect(code).toEqual(`Record<string, number> | null`)
      })
    })

    describe('OptionalNullableRecord', () => {
      it('accepts empty value', () => {
        const validator = new OptionalNullableRecord(new RequiredInteger(1, 2), { optimize })
        expect(validator.validate({})).toStrictEqual([])
        expect(validator.validate(undefined)).toStrictEqual([])
        expect(validator.validate(null)).toStrictEqual([])
        expect(true as AssertEqual<typeof validator.tsType, Record<string, any> | null | undefined>).toEqual(true)
      })

      it('toString, constructor', () => {
        const validator = new OptionalNullableRecord(new RequiredInteger(1, 2))
        const code = validator.toString()
        expect(code).toEqual(
          `new OptionalNullableRecord(new RequiredInteger(1, 2), { required: false, nullable: true })`
        )
      })

      it('toString, typescript', () => {
        const validator = new OptionalNullableRecord(new RequiredInteger(1, 2))
        const code = validator.toString({ types: true })
        expect(code).toEqual(`Record<string, number> | undefined | null`)
      })
    })
  })
})

describe('Rust Types', () => {
  const options: ValidatorExportOptions = {
    types: true,
    language: 'rust'
  }

  it('Required', () => {
    const validator = new RequiredRecord(new RequiredInteger())
    expect(validator.toString(options)).toEqual(`HashMap<String, i64>`)
  })

  it('Option', () => {
    const rustType1 = new OptionalRecord(new RequiredInteger()).toString(options)
    expect(rustType1).toEqual('Option<HashMap<String, i64>>')

    const rustType2 = new NullableRecord(new RequiredInteger()).toString(options)
    expect(rustType2).toEqual('Option<HashMap<String, i64>>')

    const rustType3 = new OptionalNullableRecord(new RequiredInteger()).toString(options)
    expect(rustType3).toEqual('Option<HashMap<String, i64>>')
  })

  it('Unknown Language', () => {
    expect(() => {
      new RequiredRecord(new RequiredInteger()).toString({ types: true, language: 'bingo' as any })
    }).toThrow(`Language: 'bingo' unknown`)
  })
})
