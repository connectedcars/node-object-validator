const ObjectValidator = require('./index')
const { DateTime, ExactString, Float, Integer, NestedArray, NestedObject, StringValue } = require('./validators')

const OPERATIONS = 10000000

let gpsOdometerKm = new ObjectValidator({
  type: ExactString('gps_odometer_km'),
  unitId: StringValue(1, 32),
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
})

const benchmarks = {
  success: {
    type: 'gps_odometer_km',
    unitId: '1234567',
    recordedAt: '2018-08-06T13:37:00Z',
    tripId: 1337,
    value: 500,
    position: {
      latitude: 55.332131,
      longitude: 12.54454,
      accuracy: 18
    },
    positions: [
      {
        latitude: 55.332131,
        longitude: 12.54454,
        accuracy: 18
      },
      {
        latitude: 55.332131,
        longitude: 12.54454,
        accuracy: 18
      }
    ]
  },
  failure_early: { type: null },
  failure_late: {
    type: 'gps_odometer_km',
    unitId: '1234567',
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
}

for (const benchmark in benchmarks) {
  const obj = benchmarks[benchmark]
  const start = Date.now()
  for (let i = 0; i < OPERATIONS; i++) {
    gpsOdometerKm.validate(obj)
  }
  const duration = Date.now() - start
  const ops = Math.round((OPERATIONS / duration) * 1000 * 1000) / 1000
  console.log(`${benchmark} in ${duration / 1000} s (${ops} ops/s)`)
}
