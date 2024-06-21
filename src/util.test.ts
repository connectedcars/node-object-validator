import { readFileSync } from 'fs'

import {
  OptionalArray,
  OptionalBoolean,
  OptionalString,
  RequiredBoolean,
  RequiredExactString,
  RequiredFloat,
  RequiredInteger,
  RequiredObject,
  RequiredString,
  RequiredTuple,
  RequiredUnion
} from '.'
import { ValidatorBase } from './common'
import { generateRustTypes, toSnakeCase } from './util'

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

    const applicationValidator = new RequiredUnion(
      [new RequiredExactString('OBD'), new RequiredExactString('UDS'), new RequiredExactString('KWP2000')],
      { typeName: 'Application' }
    )

    const requestDIDValidator = new RequiredObject(
      {
        adaption_setup: new OptionalArray(new RequiredString()),
        adaption_teardown: new OptionalArray(new RequiredString()),
        service_and_did: new RequiredString(),
        interface: externalInterfaceValidator,
        transport: transportValidator,
        application: applicationValidator,
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

    const validators: ValidatorBase[] = [
      tabbyValidator,
      tuxedoValidator,
      maineCoonValidator,
      catValidator,
      externalTupleValidator,
      externalInterfaceValidator,
      applicationValidator,
      transportValidator,
      requestDIDValidator
    ]
    const fileDumpPath = `/tmp/rust-types-test.rs`
    generateRustTypes(validators, fileDumpPath)

    expect(readFileSync(fileDumpPath, 'utf8')).toMatchSnapshot()
  })
})
