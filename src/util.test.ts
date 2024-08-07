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
import { generateRustTypes, toPascalCase, toSnakeCase } from './util'

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

    const catValidator = new RequiredUnion([tabbyValidator, tuxedoValidator, maineCoonValidator], { typeName: 'Cat' })

    const externalTupleValidator = new RequiredTuple([new RequiredInteger(0, 255), new RequiredInteger(0, 255)], {
      typeName: 'ExternalTuple'
    })

    const externalInterfaceValidator = new RequiredUnion(
      [
        new RequiredExactString('CAN0'),
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

  it('overwrite derive macro', () => {
    const validator = new RequiredObject(
      {
        valueA: new RequiredBoolean()
      },
      { typeName: 'RustType', deriveMacro: ['Serialize', 'Deserialize', 'Clone'] }
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
