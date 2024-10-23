import {
  OptionalArray,
  OptionalBoolean,
  OptionalString,
  RequiredBoolean,
  RequiredDate,
  RequiredDateTime,
  RequiredExactString,
  RequiredFloat,
  RequiredInteger,
  RequiredObject,
  RequiredRecord,
  RequiredString,
  RequiredTuple,
  RequiredUnion,
  RequiredUnixDateTime
} from '.'
import { ValidatorBase } from './common'
import {
  generateRustTypes,
  isValidRustTypeName,
  serdeDecorators,
  SerdeDecoratorsOptions,
  toPascalCase,
  toSnakeCase,
  validateRustTypeName
} from './util'

describe('toSnakeCase', () => {
  it('lower case first', () => {
    const res = toSnakeCase('katteKilling')
    expect(res).toEqual('katte_killing')
  })

  it('upper case first', () => {
    const res = toSnakeCase('KatteKilling')
    expect(res).toEqual('katte_killing')
  })
})

describe('toPascalCase', () => {
  it('lower case first', () => {
    const res = toPascalCase('katteKilling')
    expect(res).toEqual('KatteKilling')
  })

  it('upper case first', () => {
    const res = toPascalCase('KatteKilling')
    expect(res).toEqual('KatteKilling')
  })
})

describe('isValidRustTypeName', () => {
  it('Valid', () => {
    expect(isValidRustTypeName('i32')).toEqual(true)
    expect(isValidRustTypeName('mytype')).toEqual(true)
    expect(isValidRustTypeName('String')).toEqual(true)
    expect(isValidRustTypeName('std::io::Result')).toEqual(true)
    expect(isValidRustTypeName('_leadingUnderscore')).toEqual(true)
    expect(isValidRustTypeName('KatteKilling')).toEqual(true)
    expect(isValidRustTypeName('valid::Type_Name123')).toEqual(true)
    expect(isValidRustTypeName('MyStruct')).toEqual(true)
    expect(isValidRustTypeName('my_module::MyStruct')).toEqual(true)
    expect(isValidRustTypeName('Some_Type')).toEqual(true)
    expect(isValidRustTypeName('another_module::Some_Type')).toEqual(true)
    expect(isValidRustTypeName('A123')).toEqual(true)
    expect(isValidRustTypeName('my_module::A123')).toEqual(true)
  })

  it('Invalid', () => {
    expect(isValidRustTypeName('1invalid')).toEqual(false)
    expect(isValidRustTypeName('Katte-Killing')).toEqual(false)
    expect(isValidRustTypeName('invalid-char!')).toEqual(false)
    expect(isValidRustTypeName('invalid::multiple::colons::')).toEqual(false)
    expect(isValidRustTypeName('123')).toEqual(false)
    expect(isValidRustTypeName('invalid-char')).toEqual(false)
    expect(isValidRustTypeName('::leadingColon')).toEqual(false)
    expect(isValidRustTypeName('trailingColon::')).toEqual(false)
    expect(isValidRustTypeName('multiple::invalid-characters')).toEqual(false)
    expect(isValidRustTypeName('invalid@char')).toEqual(false)
  })
})

describe(`serdeDecorators`, () => {
  let options: SerdeDecoratorsOptions

  beforeEach(() => {
    options = {
      defaultable: false,
      comparable: false,
      hashable: false,
      copyable: false,
      renameAll: 'camelCase',
      unionKey: undefined
    }
  })

  it(`default`, () => {
    const res = serdeDecorators(options)
    expect(res).toEqual([`#[derive(Serialize, Deserialize, Debug, Clone)]`, `#[serde(rename_all = "camelCase")]`])
  })

  it(`comparable`, () => {
    const res = serdeDecorators({ ...options, comparable: true })
    expect(res).toEqual([
      `#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]`,
      `#[serde(rename_all = "camelCase")]`
    ])
  })

  it(`hashable`, () => {
    const res = serdeDecorators({ ...options, hashable: true })
    expect(res).toEqual([`#[derive(Serialize, Deserialize, Debug, Clone, Hash)]`, `#[serde(rename_all = "camelCase")]`])
  })

  it(`defaultable`, () => {
    const res = serdeDecorators({ ...options, defaultable: true })
    expect(res).toEqual([
      `#[derive(Serialize, Deserialize, Debug, Clone, Default)]`,
      `#[serde(rename_all = "camelCase")]`
    ])
  })

  it(`copyable`, () => {
    const res = serdeDecorators({ ...options, copyable: true })
    expect(res).toEqual([`#[derive(Serialize, Deserialize, Debug, Clone, Copy)]`, `#[serde(rename_all = "camelCase")]`])
  })

  it(`hashable, defaultable`, () => {
    const res = serdeDecorators({ ...options, hashable: true, defaultable: true })
    expect(res).toEqual([
      `#[derive(Serialize, Deserialize, Debug, Clone, Hash, Default)]`,
      `#[serde(rename_all = "camelCase")]`
    ])
  })

  it(`comparable and hashable`, () => {
    const res = serdeDecorators({ ...options, hashable: true, comparable: true })
    expect(res).toEqual([
      `#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]`,
      `#[serde(rename_all = "camelCase")]`
    ])
  })

  it(`partialComparable and hashable`, () => {
    const res = serdeDecorators({ ...options, hashable: true, partialComparable: true })
    expect(res).toEqual([
      `#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Hash)]`,
      `#[serde(rename_all = "camelCase")]`
    ])
  })

  it(`partialComparable and comparable (make sure there's no duplicates)`, () => {
    const res = serdeDecorators({ ...options, partialComparable: true, comparable: true })
    expect(res).toEqual([
      `#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]`,
      `#[serde(rename_all = "camelCase")]`
    ])
  })

  it(`with unionKey`, () => {
    const res = serdeDecorators({ ...options, unionKey: 'type' })
    expect(res).toEqual([
      `#[derive(Serialize, Deserialize, Debug, Clone)]`,
      `#[serde(rename_all = "camelCase")]`,
      `#[serde(tag = "type")]`
    ])
  })

  it(`with unionKey and renameAll`, () => {
    const res = serdeDecorators({ ...options, unionKey: 'type', renameAll: 'snake_case' })
    expect(res).toEqual([
      `#[derive(Serialize, Deserialize, Debug, Clone)]`,
      `#[serde(rename_all = "snake_case")]`,
      `#[serde(tag = "type")]`
    ])
  })

  it(`comparable, hashable, with unionKey and renameAll`, () => {
    const res = serdeDecorators({
      ...options,
      comparable: true,
      hashable: true,
      unionKey: 'bingo',
      renameAll: 'snake_case'
    })
    expect(res).toEqual([
      `#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]`,
      `#[serde(rename_all = "snake_case")]`,
      `#[serde(tag = "bingo")]`
    ])
  })
})

describe('validateRustTypeName', () => {
  it('valid', () => {
    const validator = new RequiredObject({ propA: new RequiredString() })
    validateRustTypeName('RustType', validator)
  })

  it('invalid', () => {
    const validator = new RequiredObject({ propA: new RequiredString() })
    expect(() => {
      validateRustTypeName('-RustType', validator)
    }).toThrow(`validateRustTypeName(): Invalid Rust Type Name: '-RustType'. In: new RequiredObject`)
  })
})

describe('generateRustTypes', () => {
  it('write to file', () => {
    const tabbyValidator = new RequiredObject({
      type: new RequiredExactString('tabby'),
      weight: new RequiredFloat(),
      age: new RequiredInteger(0)
    })
    const tuxedoValidator = new RequiredObject({
      type: new RequiredExactString('tuxedo'),
      weight: new RequiredFloat(),
      age: new RequiredInteger(0)
    })
    const maineCoonValidator = new RequiredObject({
      type: new RequiredExactString('maineCoon'),
      weight: new RequiredFloat(),
      age: new RequiredInteger(0),
      furVariant: new RequiredString()
    })

    const catValidator = new RequiredUnion([tabbyValidator, tuxedoValidator, maineCoonValidator], {
      typeName: 'Cat',
      hashable: true,
      comparable: true
    })

    const externalTupleValidator = new RequiredTuple([new RequiredInteger(0, 255), new RequiredInteger(0, 255)], {
      typeName: 'ExternalTuple'
    })

    const externalInterfaceValidator = new RequiredUnion(
      [
        new RequiredExactString('CAN0', { typeName: 'RENAMETYPENAME' }),
        new RequiredExactString('CAN1'),
        new RequiredExactString('CAN2'),
        new RequiredExactString('VCAN0'),
        new RequiredExactString('VCAN1'),
        new RequiredExactString('VCAN2'),
        new RequiredObject({
          PINS: new RequiredTuple([new RequiredInteger(0, 255), new RequiredInteger(0, 255)])
        }),
        new RequiredObject({
          FAKEEXTTUPLE: externalTupleValidator
        }),
        new RequiredObject({
          FAKEVALUE: new RequiredInteger(0, 255)
        })
      ],
      { typeName: 'ExternalInterface' }
    )

    const transportValidator = new RequiredUnion(
      [new RequiredExactString('ISOTP'), new RequiredExactString('TP2'), new RequiredExactString('ISOTPNOPAD')],
      { typeName: 'Transport' }
    )

    const requestDIDValidator = new RequiredObject(
      {
        adaption_setup: new OptionalArray(new RequiredString()),
        adaption_teardown: new OptionalArray(new RequiredString()),
        service_and_did: new RequiredString(),
        interface: externalInterfaceValidator,
        application: new RequiredUnion(
          [new RequiredExactString('OBD'), new RequiredExactString('UDS'), new RequiredExactString('KWP2000')],
          { typeName: 'Application' }
        ),

        transport: transportValidator,
        session_type: new OptionalString(),
        use_functional_addressing: new OptionalBoolean(),
        tx_id: new RequiredString(),
        rx_id: new OptionalString(),
        tx_local_id: new OptionalString(),
        rx_local_id: new OptionalString(),
        raw: new RequiredBoolean()
      },
      { typeName: 'RequestDID' }
    )

    const validators: ValidatorBase[] = [catValidator, requestDIDValidator]
    const types = generateRustTypes(validators)
    expect(types).toMatchSnapshot()
  })

  it('datetime used', () => {
    const validator = new RequiredObject(
      {
        unix: new RequiredUnixDateTime(),
        date: new RequiredDate(),
        dateTime: new RequiredDateTime()
      },
      { typeName: 'RustType' }
    )

    const validators: ValidatorBase[] = [validator]
    const types = generateRustTypes(validators)
    expect(types).toMatchSnapshot()
  })

  it('hashmap used', () => {
    const validator = new RequiredObject(
      {
        hashBoi: new RequiredRecord(new RequiredBoolean())
      },
      { typeName: 'RustType' }
    )

    const validators: ValidatorBase[] = [validator]
    const types = generateRustTypes(validators)
    expect(types).toMatchSnapshot()
  })

  it('datetime & hashmap used', () => {
    const validator = new RequiredObject(
      {
        dateTime: new RequiredDateTime(),
        hashBoi: new RequiredRecord(new RequiredBoolean())
      },
      { typeName: 'RustType' }
    )

    const validators: ValidatorBase[] = [validator]
    const types = generateRustTypes(validators)
    expect(types).toMatchSnapshot()
  })

  it('optional', () => {
    const validator = new RequiredObject(
      {
        valueA: new OptionalBoolean()
      },
      { typeName: 'RustType' }
    )

    const validators: ValidatorBase[] = [validator]
    const types = generateRustTypes(validators)
    expect(types).toMatchSnapshot()
  })

  it('optional, extra decorators', () => {
    const validator = new RequiredObject(
      {
        valueA: new OptionalBoolean()
      },
      { typeName: 'RustType', hashable: true, comparable: true, defaultable: true }
    )

    const validators: ValidatorBase[] = [validator]
    const types = generateRustTypes(validators)
    expect(types).toMatchSnapshot()
  })

  // #[serde(rename_all = "camelCase")]
  // #[serde(tag = "type")]
  // enum MyEnum {
  // Gives us:
  // Error("cannot serialize tagged newtype variant MyEnum::VariantA containing a boolean", line: 0, column: 0)'
  // VariantA(bool),
  // Which we can't represent, so this catches a similar case
  it('Err, Tagged union, invalid element', () => {
    const validator = new RequiredUnion(
      [
        new RequiredObject({ type: new RequiredExactString('ja'), bingo: new RequiredInteger() }),
        new RequiredBoolean()
      ],
      {
        typeName: 'RustType'
      }
    )

    const validators: ValidatorBase[] = [validator]

    expect(() => {
      generateRustTypes(validators)
    }).toThrow(`Members of the Union(non tagged) are not an ExactString`)
  })
})
