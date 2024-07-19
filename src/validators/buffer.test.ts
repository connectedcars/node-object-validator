import { AssertEqual, ValidatorExportOptions } from '../common'
import { NotBufferFail, RequiredFail } from '../errors'
import {
  isBuffer,
  NullableBuffer,
  OptionalBuffer,
  OptionalNullableBuffer,
  RequiredBuffer,
  validateBuffer
} from './buffer'

describe('Buffer', () => {
  describe('validateBuffer', () => {
    it('requires value to be a Buffer', () => {
      expect(validateBuffer(Buffer.from('abcd'))).toStrictEqual([])
    })
  })

  describe('isBuffer', () => {
    it('should cast value to Buffer', () => {
      const value = Buffer.from('abcd') as unknown
      if (isBuffer(value)) {
        expect(true as AssertEqual<typeof value, Buffer>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isBuffer(value)).toEqual(false)
    })
  })

  describe('RequiredBuffer', () => {
    it('toString, constructor', () => {
      const validator = new RequiredBuffer({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new RequiredBuffer({ optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new RequiredBuffer({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('Buffer')
    })
  })
})

describe.each([false, true])('Buffer (optimize: %s)', optimize => {
  describe('RequiredBuffer', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredBuffer({ optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      expect(validator.validate(Buffer.from('abcd'))).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredBuffer({ optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual('new RequiredBuffer()')
      } else {
        expect(code).toEqual('new RequiredBuffer({ optimize: false })')
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredBuffer({ optimize })
      expect(validator.validate(Buffer.from('abcd'))).toStrictEqual([])
      expect(validator.validate(Buffer.from(''))).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Buffer>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredBuffer({ optimize })
      expect(validator.validate(1)).toStrictEqual([new NotBufferFail('Must be an Buffer', 1)])
      expect(validator.validate(123.9)).toStrictEqual([new NotBufferFail('Must be an Buffer', 123.9)])
      expect(validator.validate('1')).toStrictEqual([new NotBufferFail('Must be an Buffer', '1')])
      expect(validator.validate('')).toStrictEqual([new NotBufferFail('Must be an Buffer', '')])
      expect(validator.validate({})).toStrictEqual([new NotBufferFail('Must be an Buffer', {})])
      expect(validator.validate([])).toStrictEqual([new NotBufferFail('Must be an Buffer', [])])
      expect(validator.validate(null)).toStrictEqual([new NotBufferFail('Must be an Buffer', null)])
      expect(true as AssertEqual<typeof validator.tsType, Buffer>).toEqual(true)
    })

    it('rejects undefined', () => {
      const validator = new RequiredBuffer({ optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredBuffer({ optimize })
      expect(validator.validate('', 'bool').map(e => e.toString())).toStrictEqual([
        `NotBufferFail: Field 'bool' must be an Buffer (received "")`
      ])
    })
  })

  describe('OptionalBuffer', () => {
    it('accepts valid value', () => {
      const validator = new OptionalBuffer({ optimize })
      expect(validator.validate(Buffer.from('abcd'))).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Buffer | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalBuffer({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalBuffer({ required: false, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalBuffer({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('Buffer | undefined')
    })
  })

  describe('NullableBuffer', () => {
    it('accepts valid values', () => {
      const validator = new NullableBuffer({ optimize })
      expect(validator.validate(Buffer.from('abcd'))).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Buffer | null>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new NullableBuffer({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new NullableBuffer({ nullable: true, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new NullableBuffer({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('Buffer | null')
    })
  })

  describe('OptionalNullableBuffer', () => {
    it('accepts valid values', () => {
      const validator = new OptionalNullableBuffer({ optimize })
      expect(validator.validate(Buffer.from('abcd'))).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Buffer | null | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalNullableBuffer({ optimize: false })
      const code = validator.toString()
      expect(code).toEqual('new OptionalNullableBuffer({ required: false, nullable: true, optimize: false })')
    })

    it('toString, typescript', () => {
      const validator = new OptionalNullableBuffer({ optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('Buffer | undefined | null')
    })
  })
})

describe('Rust Types', () => {
  const options: ValidatorExportOptions = { types: true, language: 'rust' }

  it('Required', () => {
    expect(() => {
      new RequiredBuffer().toString(options)
    }).toThrow(`Cannot serialize buffers`)
  })

  it('Option', () => {
    expect(() => {
      new RequiredBuffer().toString(options)
    }).toThrow(`Cannot serialize buffers`)
  })

  it('Unknown Language', () => {
    expect(() => {
      new RequiredBuffer().toString({ types: true, language: 'bingo' as any })
    }).toThrow(`Language: 'bingo' unknown`)
  })
})
