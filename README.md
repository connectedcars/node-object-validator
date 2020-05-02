# Object-validator

Validate JSON data based on a defined schema.

## How to use

``` bash
npm install @connectedcars/object-validator
```

``` javascript
import { ObjectValidator, DateTime, ExactString, Float, Integer, StringValue, TypedArray, TypedObject } from 'object-validator'

const schema = new ObjectValidator(
    {
      type: ExactString('gps_odometer_km'),
      unitId: StringValue(1, 32),
      recordedAt: DateTime(),
      tripId: Integer(0, 4294967295),
      value: Integer(0, 999999),
      position: TypedObject({
        latitude: Float(-90, 90),
        longitude: Float(-180, 180),
        accuracy: Integer(0, 20),
        extra: TypedObject({
          tag: StringValue(1, 50)
        })
      }),
      optionalPosition: TypedObject(
        {
          latitude: Float(-90, 90),
          longitude: Float(-180, 180),
          accuracy: Integer(0, 20)
        },
        false
      ),
      positions: TypedArray(
        TypedObject({
          latitude: Float(-90, 90),
          longitude: Float(-180, 180),
          accuracy: Integer(0, 20)
        }),
        2,
        10
      )
    },
    { optimize }
  )

let gpsOdometerKm = new ObjectValidator(schema)
let errors = gpsOdometerKm.validate({
    type: 'gps_odometer_km',
    unitId: '1234567',
    messageId: 'MSG-12345',
    recordedAt: '2018-08-06T13:37:00Z',
    tripId: 1337,
    value: 500,
    position: {
        latitude: 55.332131,
        longitude: 12.54454,
        accuracy: 21
    },
    positions: []
    }
)
if (errors.length > 0) {
    console.error(`${errors.length} errors found`)
}
```

## Benchmark

``` text
success in 1.937 s (516,262.261 ops/s)
success optimized in 0.195 s (5,128,205.128 ops/s)
failureEarly in 1.349 s (741,289.844 ops/s)
failureEarly optimized in 0.715 s (1,398,601.399 ops/s)
failureLate in 1.309 s (763,941.94 ops/s)
failureLate optimized in 0.351 s (2,849,002.849 ops/s)
```
