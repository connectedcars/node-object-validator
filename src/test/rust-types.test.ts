import {
  OptionalArray,
  OptionalBoolean,
  OptionalString,
  RequiredArray,
  RequiredBoolean,
  RequiredExactString,
  RequiredInteger,
  RequiredObject,
  RequiredString,
  RequiredUnion
} from '..'
import { ValidatorExportOptions } from '../common'

describe('Rust Types Full Flow', () => {
  const options: ValidatorExportOptions = { types: true, language: 'rust' }

  it('Example 1', () => {
    const externalInterfaceValidator = new RequiredUnion(
      [
        new RequiredExactString('CAN0'),
        new RequiredExactString('CAN1'),
        new RequiredExactString('CAN2'),
        new RequiredExactString('VCAN0'),
        new RequiredExactString('VCAN1'),
        new RequiredExactString('VCAN2'),
        new RequiredObject({
          PINS: new RequiredArray(new RequiredInteger(0, 255), 2, 2)
        })
      ],
      { rustTypeName: 'ExternalInterface' }
    )

    const transportValidator = new RequiredUnion(
      [new RequiredExactString('ISOTP'), new RequiredExactString('TP2'), new RequiredExactString('ISOTP-NOPAD')],
      { rustTypeName: 'Transport' }
    )

    const applicationValidator = new RequiredUnion(
      [new RequiredExactString('OBD'), new RequiredExactString('UDS'), new RequiredExactString('KWP2000')],
      { rustTypeName: 'Application' }
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
      { rustTypeName: 'RequestDID' }
    )

    // Inner Types
    expect(externalInterfaceValidator.toString(options)).toEqual('')
    expect(transportValidator.toString(options)).toEqual('')
    expect(applicationValidator.toString(options)).toEqual('')

    // Main
    expect(requestDIDValidator.toString(options)).toEqual('')
  })
})
