import { RequiredObject, RequiredUnion } from '..'
import { AssertEqual, ValidatorExportOptions } from '../common'
import { NotExactStringFail, RequiredFail } from '../errors'
import {
  isExactString,
  NullableExactString,
  OptionalExactString,
  OptionalNullableExactString,
  RequiredExactString,
  validateExactString
} from './exact-string'

describe('validateExactString (optimize: %s)', () => {
  describe('validateExactString', () => {
    it('requires value to be exact string', () => {
      const value = 'MyString' as unknown
      expect(validateExactString(value, 'MyString')).toStrictEqual([])
    })
  })

  describe('isExactString', () => {
    it('should cast value to string', () => {
      const value = 'MyString' as unknown
      if (isExactString(value, 'MyString')) {
        expect(true as AssertEqual<typeof value, 'MyString'>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })
    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isExactString(value, 'MyString')).toEqual(false)
    })
  })

  describe('RequiredExactString', () => {
    it('should return a function body', () => {
      const validator = new RequiredExactString('MyString', { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredExactString('MyString', { optimize: false })
      const code = validator.toString()
      expect(code).toEqual(`new RequiredExactString('MyString', { optimize: false })`)
    })

    it('toString, typescript', () => {
      const validator = new RequiredExactString('MyString', { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual("'MyString'")
    })
  })
})

describe.each([false, true])('validateExactString (optimize: %s)', optimize => {
  describe('ExactStringValidator', () => {
    it('should generate code for validation and give same result', () => {
      const validator = new RequiredExactString('MyString', { optimize })
      if (optimize) {
        expect(validator['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['optimizedValidate']).toBeNull()
      }
      const errors = validator.validate('MyString')
      expect(errors).toEqual([])
    })

    it('should export validator code with options', () => {
      const validator = new RequiredExactString('MyString', { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual(`new RequiredExactString('MyString')`)
      } else {
        expect(code).toEqual(`new RequiredExactString('MyString', { optimize: false })`)
      }
    })

    it('accepts values', () => {
      const validator = new RequiredExactString('MyString', { optimize })
      expect(validator.validate('MyString')).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, 'MyString'>).toEqual(true)
    })

    it('rejects invalid values', () => {
      const validator = new RequiredExactString('MyString', { optimize })
      expect(validator.validate('')).toStrictEqual([new NotExactStringFail('Must strictly equal "MyString"', '')])
      expect(validator.validate('mystring')).toStrictEqual([
        new NotExactStringFail('Must strictly equal "MyString"', 'mystring')
      ])
      expect(validator.validate('MyString ')).toStrictEqual([
        new NotExactStringFail('Must strictly equal "MyString"', 'MyString ')
      ])
      expect(validator.validate(' MyString')).toStrictEqual([
        new NotExactStringFail('Must strictly equal "MyString"', ' MyString')
      ])
      expect(validator.validate('bogus')).toStrictEqual([
        new NotExactStringFail('Must strictly equal "MyString"', 'bogus')
      ])
      expect(validator.validate(null)).toStrictEqual([new NotExactStringFail('Must strictly equal "MyString"', null)])
      expect(true as AssertEqual<typeof validator.tsType, 'MyString'>).toEqual(true)
    })

    it('rejects undefined', () => {
      const validator = new RequiredExactString('MyString', { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })
  })

  describe('OptionalExactString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalExactString('MyString', { optimize })
      expect(validator.validate('MyString')).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, 'MyString' | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalExactString('MyString', { optimize: false })
      const code = validator.toString()
      expect(code).toEqual(`new OptionalExactString('MyString', { required: false, optimize: false })`)
    })

    it('toString, typescript', () => {
      const validator = new OptionalExactString('MyString', { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual("'MyString' | undefined")
    })
  })

  describe('NullableExactString', () => {
    it('accepts empty value', () => {
      const validator = new NullableExactString('MyString', { optimize })
      expect(validator.validate('MyString')).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, 'MyString' | null>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new NullableExactString('MyString', { optimize: false })
      const code = validator.toString()
      expect(code).toEqual(`new NullableExactString('MyString', { nullable: true, optimize: false })`)
    })

    it('toString, typescript', () => {
      const validator = new NullableExactString('MyString', { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual("'MyString' | null")
    })
  })

  describe('OptionalNullableExactString', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableExactString('MyString', { optimize })
      expect(validator.validate('MyString')).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, 'MyString' | undefined | null>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalNullableExactString('MyString', { optimize: false })
      const code = validator.toString()
      expect(code).toEqual(
        `new OptionalNullableExactString('MyString', { required: false, nullable: true, optimize: false })`
      )
    })

    it('toString, typescript', () => {
      const validator = new OptionalNullableExactString('MyString', { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual("'MyString' | undefined | null")
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

  it('Required (in a union)', () => {
    const unionValidator = new RequiredUnion([new RequiredExactString(`computerKatten`)], { typeName: 'NeededUnion' })
    expect(unionValidator.toString(options)).toEqual('NeededUnion')

    const expectedNeededUnion = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum NeededUnion {
    ComputerKatten,
}

`
    expect(typeDefinitions).toEqual({
      NeededUnion: expectedNeededUnion
    })
  })

  it('Required (in a union), rename', () => {
    const unionValidator = new RequiredUnion([new RequiredExactString(`computerKatten`, {typeName: 'JaMand'})], { typeName: 'NeededUnion' })
    expect(unionValidator.toString(options)).toEqual('NeededUnion')

    const expectedNeededUnion = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum NeededUnion {
    #[serde(rename = "JaMand")]
    ComputerKatten,
}

`
    expect(typeDefinitions).toEqual({
      NeededUnion: expectedNeededUnion
    })
  })

  it('Required, Err, in object without a union (taggedunion member, no parent)', () => {
    const objValidator = new RequiredObject({ a: new RequiredExactString(`computerKatten`) }, { typeName: 'ObjName' })

    expect(() => {
      objValidator.toString(options)
    }).toThrow(`ExactString in an object, has to be part of a taggedUnion. str: computerKatten`)
  })

  it('Required, Err, alone', () => {
    const validator = new RequiredExactString(`computerKatten`)

    expect(() => {
      validator.toString(options)
    }).toThrow(`ExactString has to be in an object/union. str: computerKatten`)
  })

  it('Option', () => {
    expect(() => {
      new OptionalExactString('computerKatten').toString(options)
    }).toThrow(`Rust does not support optional ExactString`)

    expect(() => {
      new NullableExactString('computerKatten').toString(options)
    }).toThrow(`Rust does not support optional ExactString`)

    expect(() => {
      new OptionalNullableExactString('computerKatten').toString(options)
    }).toThrow(`Rust does not support optional ExactString`)
  })

  it('Unknown Language', () => {
    expect(() => {
      new RequiredExactString('computerKatten').toString({ types: true, language: 'bingo' as any })
    }).toThrow(`Language: 'bingo' unknown`)
  })
})
