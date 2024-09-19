import { OptionalString, RequiredExactString, RequiredString } from '..'
import { AssertEqual, ValidatorExportOptions } from '../common'
import { NotArrayFail, NotFloatFail, NotIntegerFail, NotObjectFail, RequiredFail } from '../errors'
import { OptionalArray, RequiredArray } from './array'
import { OptionalBoolean } from './boolean'
import { OptionalDate, RequiredDate } from './date'
import { OptionalDateTime } from './datetime'
import { RequiredFloat } from './float'
import { OptionalInteger, RequiredInteger } from './integer'
import {
  isObject,
  NullableObject,
  OptionalNullableObject,
  OptionalObject,
  RequiredObject,
  validateObject
} from './object'
import { RequiredRegexMatch } from './regex-match'
import { OptionalUnixDateTime, RequiredUnixDateTime } from './unixdatetime'

describe('Object', () => {
  describe('validateObject', () => {
    it('should validate simple object', () => {
      expect(
        validateObject(
          {
            int: new RequiredInteger(1, 2)
          },
          { int: 1 }
        )
      ).toEqual([])
    })
  })

  describe('isObject', () => {
    it('should cast to simple object', () => {
      const value = { int: 1 } as unknown
      if (
        isObject(
          {
            int: new RequiredInteger(1, 2)
          },
          value
        )
      ) {
        expect(true as AssertEqual<typeof value, { int: number }>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })
  })

  it('should fail validation', () => {
    const value = 'string' as unknown
    expect(
      isObject(
        {
          int: new RequiredInteger(1, 2)
        },
        value
      )
    ).toEqual(false)
  })

  it('should handle nested optimize', () => {
    const objectValidator = new RequiredObject(
      {
        requiredObject: new RequiredObject(
          {
            optionalInt: new OptionalInteger(1, 2)
          },
          { optimize: true }
        )
      },
      { optimize: false }
    )

    const unknownValue: unknown = {
      requiredObject: {
        optionalInt: '1'
      }
    }
    expect(objectValidator.validate(unknownValue)).toEqual([
      new NotIntegerFail(`Must be an integer`, '1', "requiredObject['optionalInt']")
    ])
  })

  describe('RequiredInteger', () => {
    it('should return a function body', () => {
      const validator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2)
        },
        { optimize: false }
      )
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('toString, constructor', () => {
      const validator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2)
        },
        { optimize: false }
      )
      const code = validator.toString()
      const expected = `new RequiredObject({
  'int': new RequiredInteger(1, 2),
  'float': new RequiredFloat(1, 2)
}, { optimize: false })`
      expect(code).toEqual(expected)
    })

    it('toString, typescript', () => {
      const validator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2)
        },
        { optimize: false }
      )
      const code = validator.toString({ types: true })
      expect(code).toEqual(`{\n  'int': number\n  'float': number\n}`)
    })
  })
})

describe.each([false, true])('Object (optimize: %s)', optimize => {
  describe('ObjectValidator', () => {
    it('should generate validation code and give same result', () => {
      const objectValidator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2),
          optionalInt: new OptionalInteger(1, 2),
          requiredObject: new RequiredObject({
            int: new RequiredInteger(1, 2),
            optionalInt: new OptionalInteger(1, 2)
          }),
          optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
          optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2))),
          optionalDate: new OptionalDate(),
          regexMatch: new RequiredRegexMatch(/^.*$/)
        },
        { optimize }
      )

      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]],
        optionalDate: new Date(),
        regexMatch: 'hello'
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
      const validator = new RequiredObject({ int: new RequiredInteger(), float: new RequiredFloat() }, { optimize })
      const code = validator.toString()
      if (optimize) {
        expect(code).toEqual(
          `new RequiredObject({\n  'int': new RequiredInteger(),\n  'float': new RequiredFloat()\n})`
        )
      } else {
        expect(code).toEqual(
          `new RequiredObject({\n  'int': new RequiredInteger(),\n  'float': new RequiredFloat()\n}, { optimize: false })`
        )
      }
    })

    it('accepts valid values', () => {
      const validator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2),
          optionalInt: new OptionalInteger(1, 2),
          requiredObject: new RequiredObject({
            int: new RequiredInteger(1, 2),
            optionalInt: new OptionalInteger(1, 2)
          }),
          optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
          optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2)))
        },
        { optimize }
      )
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]]
      }
      expect(validator.validate(unknownValue)).toEqual([])
    })

    it('rejects invalid values', () => {
      const validator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2),
          optionalInt: new OptionalInteger(1, 2),
          requiredObject: new RequiredObject({
            int: new RequiredInteger(1, 2),
            optionalInt: new OptionalInteger(1, 2)
          }),
          optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
          optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2)))
        },
        { optimize }
      )
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1,
          optionalInt: '1'
        },
        optionalArray: ['1'],
        optionalArrayArray: [1]
      }
      expect(validator.validate(unknownValue)).toEqual([
        new NotIntegerFail(`Must be an integer`, '1', "requiredObject['optionalInt']"),
        new NotIntegerFail(`Must be an integer`, '1', 'optionalArray[0]'),
        new NotArrayFail(`Must be an array`, 1, 'optionalArrayArray[0]')
      ])
      expect(validator.validate(null)).toStrictEqual([new NotObjectFail('Must be an object', null)])
    })

    it('rejects undefined', () => {
      const validator = new RequiredObject({}, { optimize })
      expect(validator.validate(undefined)).toStrictEqual([new RequiredFail('Is required', undefined)])
    })

    it('should fail validation of wrong key types', () => {
      const validator = new RequiredObject({ int: new RequiredInteger(), float: new RequiredFloat() }, { optimize })
      expect(validator.validate({ int: '', float: '' })).toStrictEqual([
        new NotIntegerFail('Must be an integer', '', 'int'),
        new NotFloatFail('Must be a float', '', 'float')
      ])
    })

    it('should fail validation early of wrong key types', () => {
      const validator = new RequiredObject(
        { int: new RequiredInteger(), float: new RequiredFloat() },
        { optimize, earlyFail: true }
      )
      const errors = validator.validate({ int: '', float: '' })
      expect(errors.length).toEqual(1)
    })

    it('should cast type guard correctly for isType', () => {
      const validator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2),
          optionalInt: new OptionalInteger(1, 2),
          requiredObject: new RequiredObject({
            int: new RequiredInteger(1, 2),
            optionalInt: new OptionalInteger(1, 2)
          }),
          optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
          optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2)))
        },
        { optimize }
      )
      const unknownValue: unknown = {
        int: 1,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]]
      }
      const errors = validator.validate(unknownValue)
      if (validator.isType(unknownValue, errors)) {
        expect(
          true as AssertEqual<
            typeof unknownValue,
            {
              int: number
              requiredObject: {
                int: number
                optionalInt?: number | undefined
              }
              optionalInt?: number | undefined
              optionalArray?: number[] | undefined
              optionalArrayArray?: number[][] | undefined
            }
          >
        ).toEqual(true)
      } else {
        expect('did not validate but should').toBe('')
      }
    })

    it('should cast type guard correctly for isValid', () => {
      const objectValidator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2),
          optionalInt: new OptionalInteger(1, 2),
          requiredObject: new RequiredObject({
            int: new RequiredInteger(1, 2),
            optionalInt: new OptionalInteger(1, 2)
          }),
          optionalArray: new OptionalArray(new RequiredInteger(1, 2)),
          optionalArrayArray: new OptionalArray(new RequiredArray(new RequiredInteger(1, 2)))
        },
        { optimize }
      )

      const unknownValue: unknown = {
        int: 1,
        float: 1.5,
        optionalInt: 1,
        requiredObject: {
          int: 1
        },
        optionalArray: [1],
        optionalArrayArray: [[1]]
      }
      if (objectValidator.isValid(unknownValue)) {
        expect(
          true as AssertEqual<
            typeof unknownValue,
            {
              int: number
              float: number
              requiredObject: {
                int: number
                optionalInt?: number | undefined
              }
              optionalInt?: number | undefined
              optionalArray?: number[] | undefined
              optionalArrayArray?: number[][] | undefined
            }
          >
        ).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should cast to known type', () => {
      const objectValidator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2)
        },
        { optimize }
      )

      const unknownValue: unknown = {
        int: 1
      }
      expect(() => {
        const knownValue = objectValidator.cast(unknownValue)
        expect(
          true as AssertEqual<
            typeof knownValue,
            {
              int: number
            }
          >
        ).toEqual(true)
      }).not.toThrow()
    })

    it('should fail to cast', () => {
      const objectValidator = new RequiredObject(
        {
          int: new RequiredInteger(1, 2)
        },
        { optimize }
      )

      const unknownValue: unknown = {
        int: '1'
      }
      expect(() => {
        const knownValue = objectValidator.cast(unknownValue)
        expect(
          true as AssertEqual<
            typeof knownValue,
            {
              int: number
            }
          >
        ).toEqual(true)
      }).toThrow()
    })

    it('requires value to show correct context on error', () => {
      const validator = new RequiredObject({}, { optimize })
      expect(validator.validate([]).map(e => e.toString())).toStrictEqual([
        'NotObjectFail: Must be an object (received "")'
      ])
      expect(validator.validate(1).map(e => e.toString())).toStrictEqual([
        'NotObjectFail: Must be an object (received "1")'
      ])
      expect(validator.validate(true).map(e => e.toString())).toStrictEqual([
        'NotObjectFail: Must be an object (received "true")'
      ])
      expect(validator.validate('').map(e => e.toString())).toStrictEqual([
        'NotObjectFail: Must be an object (received "")'
      ])
    })
  })

  describe('OptionalObject', () => {
    it('accepts empty value', () => {
      const validator = new OptionalObject({}, { optimize })
      expect(validator.validate({})).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Record<string, any> | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalObject(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2)
        },
        { optimize: false }
      )
      const code = validator.toString()
      const expected = `new OptionalObject({
  'int': new RequiredInteger(1, 2),
  'float': new RequiredFloat(1, 2)
}, { required: false, optimize: false })`
      expect(code).toEqual(expected)
    })

    it('toString, typescript', () => {
      const validator = new OptionalObject(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2)
        },
        { optimize: false }
      )
      const code = validator.toString({ types: true })
      expect(code).toEqual(`{\n  'int': number\n  'float': number\n} | undefined`)
    })
  })

  describe('NullableObject', () => {
    it('accepts empty value', () => {
      const validator = new NullableObject({}, { optimize })
      expect(validator.validate({})).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Record<string, any> | null>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new NullableObject(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2)
        },
        { optimize: false }
      )
      const code = validator.toString()
      const expected = `new NullableObject({
  'int': new RequiredInteger(1, 2),
  'float': new RequiredFloat(1, 2)
}, { nullable: true, optimize: false })`
      expect(code).toEqual(expected)
    })

    it('toString, typescript', () => {
      const validator = new NullableObject(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2)
        },
        { optimize: false }
      )
      const code = validator.toString({ types: true })
      expect(code).toEqual(`{\n  'int': number\n  'float': number\n} | null`)
    })
  })

  describe('OptionalNullableObject', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableObject({}, { optimize })
      expect(validator.validate({})).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, Record<string, any> | null | undefined>).toEqual(true)
    })

    it('toString, constructor', () => {
      const validator = new OptionalNullableObject(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2)
        },
        { optimize: false }
      )
      const code = validator.toString()
      const expected = `new OptionalNullableObject({
  'int': new RequiredInteger(1, 2),
  'float': new RequiredFloat(1, 2)
}, { required: false, nullable: true, optimize: false })`
      expect(code).toEqual(expected)
    })

    it('toString, typescript', () => {
      const validator = new OptionalNullableObject(
        {
          int: new RequiredInteger(1, 2),
          float: new RequiredFloat(1, 2)
        },
        { optimize: false }
      )
      const code = validator.toString({ types: true })
      expect(code).toEqual(`{\n  'int': number\n  'float': number\n} | undefined | null`)
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

  it('Required', () => {
    const validator = new RequiredObject({ propA: new RequiredInteger() }, { typeName: 'TypeName' })
    expect(validator.toString(options)).toEqual(`TypeName`)

    const expectedType = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TypeName {
    pub prop_a: i64,
}

`
    expect(typeDefinitions).toEqual({
      TypeName: expectedType
    })
  })

  it('Required, Nested, type definition outside', () => {
    const innerValidator = new RequiredObject({ innerA: new OptionalBoolean() }, { typeName: 'InnerType' })
    const outerValidator = new RequiredObject(
      { outerA: new RequiredFloat(), otherObj: innerValidator },
      { typeName: 'OuterType' }
    )

    const expectedInner = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InnerType {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inner_a: Option<bool>,
}

`
    const expectedOuter = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OuterType {
    pub outer_a: f32,
    pub other_obj: InnerType,
}

`

    expect(innerValidator.toString(options)).toEqual('InnerType')
    expect(outerValidator.toString(options)).toEqual('OuterType')
    expect(typeDefinitions).toEqual({
      InnerType: expectedInner,
      OuterType: expectedOuter
    })
  })

  it('Required, Nested, type definition nested, automatic name from key', () => {
    const outerValidator = new RequiredObject(
      {
        outerA: new RequiredFloat(),
        otherObj: new RequiredObject({ innerA: new OptionalBoolean() })
      },
      { typeName: 'OuterType' }
    )

    const expectedInner = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OtherObj {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inner_a: Option<bool>,
}

`
    const expectedOuter = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OuterType {
    pub outer_a: f32,
    pub other_obj: OtherObj,
}

`

    expect(outerValidator.toString(options)).toEqual('OuterType')
    expect(typeDefinitions).toEqual({
      OtherObj: expectedInner,
      OuterType: expectedOuter
    })
  })

  it('Required, Nested, type definition nested, manual name', () => {
    const outerValidator = new RequiredObject(
      {
        outerA: new RequiredFloat(),
        otherObj: new RequiredObject({ innerA: new OptionalBoolean() }, { typeName: 'InnerType' })
      },
      { typeName: 'OuterType' }
    )

    const expectedInner = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InnerType {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inner_a: Option<bool>,
}

`
    const expectedOuter = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OuterType {
    pub outer_a: f32,
    pub other_obj: InnerType,
}

`

    expect(outerValidator.toString(options)).toEqual('OuterType')
    expect(typeDefinitions).toEqual({
      InnerType: expectedInner,
      OuterType: expectedOuter
    })
  })

  it('Required, dates', () => {
    const validator = new RequiredObject(
      { propA: new RequiredUnixDateTime(), propB: new RequiredDate(), propC: new OptionalDateTime() },
      { typeName: 'TypeName' }
    )
    expect(validator.toString(options)).toEqual(`TypeName`)

    const expectedType = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TypeName {
    #[serde(with = "chrono::serde::ts_seconds")]
    pub prop_a: DateTime<Utc>,
    pub prop_b: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prop_c: Option<DateTime<Utc>>,
}

`
    expect(typeDefinitions).toEqual({
      TypeName: expectedType
    })
  })

  it('Required, comparable, hashable, defaultable, gets passed on', () => {
    const outerValidator = new RequiredObject(
      {
        outerA: new RequiredFloat(),
        otherObj: new RequiredObject({ innerA: new OptionalBoolean() }, { typeName: 'InnerType' })
      },
      { typeName: 'OuterType', hashable: true, comparable: true, defaultable: true }
    )

    const expectedInner = `#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash, Default)]
#[serde(rename_all = "camelCase")]
pub struct InnerType {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inner_a: Option<bool>,
}

`
    const expectedOuter = `#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash, Default)]
#[serde(rename_all = "camelCase")]
pub struct OuterType {
    pub outer_a: f32,
    pub other_obj: InnerType,
}

`

    expect(outerValidator.toString(options)).toEqual('OuterType')
    expect(typeDefinitions).toEqual({
      InnerType: expectedInner,
      OuterType: expectedOuter
    })
  })

  it('Required, comparable, hashable, defaultable, also inline, takes priority over passed in', () => {
    const outerValidator = new RequiredObject(
      {
        outerA: new RequiredFloat(),
        otherObj: new RequiredObject(
          { innerA: new OptionalBoolean() },
          { typeName: 'InnerType', hashable: true, comparable: true, defaultable: true }
        )
      },
      { typeName: 'OuterType', hashable: false, comparable: false, defaultable: false }
    )

    const expectedInner = `#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash, Default)]
#[serde(rename_all = "camelCase")]
pub struct InnerType {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inner_a: Option<bool>,
}

`
    const expectedOuter = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OuterType {
    pub outer_a: f32,
    pub other_obj: InnerType,
}

`

    expect(outerValidator.toString(options)).toEqual('OuterType')
    expect(typeDefinitions).toEqual({
      InnerType: expectedInner,
      OuterType: expectedOuter
    })
  })

  it('Required, with an optional array', () => {
    const validator = new RequiredObject(
      {
        a: new OptionalArray(new RequiredString()),
        b: new OptionalArray(new OptionalString())
      },
      { typeName: 'TypeName' }
    )

    const expectedType = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TypeName {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub a: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub b: Option<Vec<Option<String>>>,
}

`

    expect(validator.toString(options)).toEqual('TypeName')
    expect(typeDefinitions).toEqual({
      TypeName: expectedType
    })
  })

  it('Required, Err, Optional unixtimestamp', () => {
    const validator = new RequiredObject({ propA: new OptionalUnixDateTime() }, { typeName: 'TypeName' })
    expect(() => {
      validator.toString(options)
    }).toThrow(`Object key cannot be an Optional UnixDateTime. (Needs custom serialization). For: propA`)
  })

  it('Option, OptionalObject', () => {
    {
      const validator = new OptionalObject({ propB: new OptionalBoolean() }, { typeName: 'TypeName' })
      expect(validator.toString(options)).toEqual(`Option<TypeName>`)

      const expectedType = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TypeName {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prop_b: Option<bool>,
}

`
      expect(typeDefinitions).toEqual({
        TypeName: expectedType
      })
    }
  })

  it('Option, NullableObject', () => {
    const validator = new NullableObject({ propB: new OptionalBoolean() }, { typeName: 'TypeName' })
    expect(validator.toString(options)).toEqual(`Option<TypeName>`)

    const expectedType = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TypeName {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prop_b: Option<bool>,
}

`
    expect(typeDefinitions).toEqual({
      TypeName: expectedType
    })
  })

  it('Option, OptionalNullableObject', () => {
    const validator = new OptionalNullableObject({ propB: new OptionalBoolean() }, { typeName: 'TypeName' })
    expect(validator.toString(options)).toEqual(`Option<TypeName>`)

    const expectedType = `#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TypeName {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prop_b: Option<bool>,
}

`
    expect(typeDefinitions).toEqual({
      TypeName: expectedType
    })
  })

  it('Unknown Language', () => {
    expect(() => {
      new RequiredObject({ propA: new RequiredInteger() }).toString({
        types: true,
        language: 'bingo' as any,
        typeDefinitions
      })
    }).toThrow(`Language: 'bingo' unknown`)
  })

  it('No typeName', () => {
    expect(() => {
      new RequiredObject({ propA: new RequiredInteger() }).toString({ types: true, language: 'rust', typeDefinitions })
    }).toThrow(`'typeName' option is not set`)
  })

  it('No typeDefinitions', () => {
    expect(() => {
      new RequiredObject({ propA: new RequiredInteger() }).toString({ types: true, language: 'rust' })
    }).toThrow(`'typeDefinitions' is not set`)
  })
})
