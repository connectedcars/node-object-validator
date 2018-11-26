# Object-validator

Validate JSON data based on a defined schema.

## How to use

``` javascript
const ObjectValidator = require('object-validator')
const { DateTime, ExactString, Float, Integer, NestedArray, NestedObject, StringValue, RegexMatch } = require('object-validator/validators')

let schema = {
  type: ExactString('gps_odometer_km'),
  unitId: StringValue(1, 32),
  messageId: RegexMatch(/^MSG-\d+$/),
  recordedAt: DateTime(),
  tripId: Integer(0, 4294967295),
  value: Integer(0, 999999),
  position: {
    latitude: Float(-90, 90),
    longitude: Float(-180, 180),
    accuracy: Integer(0, 20)
  },
  position$type: NestedObject(false),
  positions: {
    latitude: Float(-90, 90),
    longitude: Float(-180, 180),
    accuracy: Integer(0, 20)
  },
  positions$type: NestedArray(0, 10, true)
}

let gpsOdometerKm = new ObjectValidator(schema, { optimize: false })
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
if(errors.length > 0) {
    console.error(`${errors.length} errors found`)
}
```

## Benchmark

``` text
success in 8.206 s (1218620.522 ops/s)
success optimized in 2.294 s (4359197.908 ops/s)
failure_early in 5.605 s (1784121.32 ops/s)
failure_early optimized in 3.436 s (2910360.885 ops/s)
failure_late in 6.995 s (1429592.566 ops/s)
failure_late optimized in 3.376 s (2962085.308 ops/s)
```

## TODO

- [ ] Add tests for nested object
- [ ] Add tests for nested array
- [ ] Limit depth of recursion
