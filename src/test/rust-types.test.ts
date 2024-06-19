import {
  OptionalArray,
  OptionalBoolean,
  OptionalString,
  RequiredBoolean,
  RequiredExactString,
  RequiredInteger,
  RequiredObject,
  RequiredString,
  RequiredTuple,
  RequiredUnion
} from '..'
import { ValidatorExportOptions } from '../common'

describe('Rust Types Full Flow', () => {
  const options: ValidatorExportOptions = { types: true, language: 'rust' }

  it('Example 1', () => {
    const externalTupleValidator = new RequiredTuple([new RequiredInteger(0, 255), new RequiredInteger(0, 255)], {
      typeName: 'ExternalTuple'
    })

    // TODO: u8 should be 255
    const externalInterfaceValidator = new RequiredUnion(
      [
        new RequiredExactString('CAN0'),
        new RequiredExactString('CAN1'),
        new RequiredExactString('CAN2'),
        new RequiredExactString('VCAN0'),
        new RequiredExactString('VCAN1'),
        new RequiredExactString('VCAN2'),
        new RequiredObject({
          PINS: new RequiredTuple([new RequiredInteger(0, 253), new RequiredInteger(0, 253)])
        }),
        new RequiredObject({
          FAKEEXTTUPLE: externalTupleValidator
        }),
        new RequiredObject({
          FAKEVALUE: new RequiredInteger(0, 253)
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
    expect(externalTupleValidator.toString(options)).toEqual(`struct ExternalTuple(u16, u16);`)

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
})
