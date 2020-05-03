# Object-validator

Validate JSON data based on a defined schema.

This is a TypeScript rewrite of the old object-validator adding type support and support for validating more types.

## How to use

``` bash
npm install @connectedcars/object-validator
```

``` javascript
import {
  ObjectValidator, DateTime, ExactString, Float,
  Integer, StringValue, TypedArray, TypedObject
} from 'object-validator'

const gpsOdometerKm = new ObjectValidator(
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

let unknownValue = {
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

// Returns errors found in object
let errors = gpsOdometerKm.validate(unknownValue)
if (errors.length > 0) {
  console.error(`${errors.length} errors found`)
}

// Returns true if errors is empty
if(gpsOdometerKm.isType(unknownValue, errors)) {
  console.log(unknownValue.unitId) // unknownValue.unitId has been type cast to string
}

// Returns true if unknownValue validates
if(objectValidator.isValid(unknownValue)) {
  console.log(unknownValue.tripId) // unknownValue.unitId has been type cast to number
}

// Throws ValidationsError if unknownValue does not validate
let knownValue = objectValidator.cast(unknownValue)
  console.log(knownValue.positions.length()) // unknownValue.unitId has been type cast to array
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
