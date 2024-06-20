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
} from '..'
import { ValidatorExportOptions } from '../common'

describe('Rust Types Full Flow', () => {
  const options: ValidatorExportOptions = { types: true, language: 'rust' }

  it('Example 1, from hal-can', () => {
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
      [new RequiredExactString('ISOTP'), new RequiredExactString('TP2'), new RequiredExactString('ISOTP-NOPAD')],
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

    // Inner Types
    expect(externalTupleValidator.toString(options)).toEqual(`struct ExternalTuple(u8, u8);`)

    expect(externalInterfaceValidator.toString(options)).toEqual(`enum ExternalInterface {
    CAN0,
    CAN1,
    CAN2,
    VCAN0,
    VCAN1,
    VCAN2,
    PINS(u8, u8),
    FAKEEXTTUPLE(ExternalTuple),
    FAKEVALUE(u8),
}`)
    expect(transportValidator.toString(options)).toEqual(`enum Transport {
    ISOTP,
    TP2,
    ISOTP-NOPAD,
}`)
    expect(applicationValidator.toString(options)).toEqual(`enum Application {
    OBD,
    UDS,
    KWP2000,
}`)

    // Main
    expect(requestDIDValidator.toString(options)).toEqual(`struct RequestDID {
    adaption_setup: Vec<String>,
    adaption_teardown: Vec<String>,
    service_and_did: String,
    interface: ExternalInterface,
    transport: Transport,
    application: Application,
    session_type: Option<String>,
    use_functional_addressing: Option<bool>,
    tx_id: String,
    rx_id: Option<String>,
    tx_local_id: Option<String>,
    rx_local_id: Option<String>,
    raw: bool,
}`)
  })

  it('Example 2, TS Union of objects with a type property', () => {
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

    // Members first
    expect(tabbyValidator.toString(options)).toEqual(`struct TabbyStruct {
    weight: f64,
    age: u64,
}`)
    expect(tuxedoValidator.toString(options)).toEqual(`struct TuxedoStruct {
    weight: f64,
    age: u64,
}`)

    expect(maineCoonValidator.toString(options)).toEqual(`struct MaineCoonStruct {
    weight: f64,
    age: u64,
    fur_variant: String,
}`)

    // Then union
    expect(catValidator.toString(options)).toEqual(`enum Cat {
    Tabby(TabbyStruct),
    Tuxedo(TuxedoStruct),
    MaineCoon(MaineCoonStruct),
}`)
  })
})
