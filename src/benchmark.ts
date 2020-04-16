import {
  ObjectValidator,
  OptionalObject,
  RequiredArray,
  RequiredDateTime,
  RequiredFloat,
  RequiredInteger,
  RequiredObject,
  RequiredString
} from '.'
import { RequiredExactString } from '.'

const OPERATIONS = 1000000

const schema = {
  type: new RequiredExactString('gps_odometer_km'),
  unitId: new RequiredString(1, 32),
  recordedAt: new RequiredDateTime(),
  tripId: new RequiredInteger(0, 4294967295),
  value: new RequiredInteger(0, 999999),
  position: new OptionalObject({
    latitude: new RequiredFloat(-90, 90),
    longitude: new RequiredFloat(-180, 180),
    accuracy: new RequiredInteger(0, 20)
  })
  /*positions: new RequiredArray(
    new RequiredObject({
      latitude: new RequiredFloat(-90, 90),
      longitude: new RequiredFloat(-180, 180),
      accuracy: new RequiredInteger(0, 20)
    }),
    0,
    10
  )*/
}

const gpsOdometerKm = new ObjectValidator(schema, { optimize: false })
const gpsOdometerKmOptimized = new ObjectValidator(schema, { optimize: true })

const benchmarks: { [key: string]: unknown } = {
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
  failureEarly: { type: null },
  failureLate: {
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

const errors = gpsOdometerKm.validate(benchmarks['failureEarly'])
console.log(errors)
const errorsOptimized = gpsOdometerKmOptimized.validate(benchmarks['failureEarly'])
console.log(errorsOptimized)
console.log(gpsOdometerKmOptimized.validate.toString())

function timeRun(cb: () => void, operations: number): [number, number] {
  const start = Date.now()
  for (let i = 0; i < OPERATIONS; i++) {
    cb()
  }
  const duration = Date.now() - start
  const ops = Math.round((operations / duration) * 1000 * 1000) / 1000
  return [duration, ops]
}

for (const benchmark of Object.keys(benchmarks)) {
  console.log(`Running benchmark ${benchmark}`)
  const obj = benchmarks[benchmark]

  // Warmup
  timeRun(() => {
    gpsOdometerKm.validate(obj)
  }, 100000)
  console.log(`Warmup done`)

  // Normal timing
  const [normalDuration, normalOps] = timeRun(() => {
    gpsOdometerKm.validate(obj)
  }, OPERATIONS)
  console.log(`${benchmark} in ${normalDuration / 1000} s (${normalOps} ops/s)`)

  // Optimized timing
  const [optimizedDuration, optimizedOps] = timeRun(() => {
    gpsOdometerKmOptimized.validate(obj)
  }, OPERATIONS)
  console.log(`${benchmark} optimized in ${optimizedDuration / 1000} s (${optimizedOps} ops/s)`)
}
