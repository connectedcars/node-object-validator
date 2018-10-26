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

let typeValidator = ExactString('gps_odometer_km')
let unitIdValidator = StringValue(1, 32)
let recordedAtValidator = DateTime()
let tripIdValidator = Integer(0, 4294967295)
let valueValidator = Integer(0, 999999)
let positionValidator = NestedObject(false)
let positionLatitudeValidator = Float(-90, 90)
let positionLongitudeValidator = Float(-180, 180)
let positionAccuracyValidator = Integer(0, 20)
let positionsValidator = NestedArray(0, 10, true)
let positionsLatitudeValidator = Float(-90, 90)
let positionsLongitudeValidator = Float(-180, 180)
let positionsAccuracyValidator = Integer(0, 20)

for (const benchmark in benchmarks) {
  const obj = benchmarks[benchmark]
  let [duration, ops] = timeRun(() => {
    gpsOdometerKm.validate(obj)
  }, OPERATIONS)
  console.log(`${benchmark} in ${duration / 1000} s (${ops} ops/s)`)
  ;[duration, ops] = timeRun(() => {
    validateManualOptimized(obj)
  }, OPERATIONS)
  console.log(`${benchmark} optimized in ${duration / 1000} s (${ops} ops/s)`)
}

function validateManualOptimized(obj) {
  let errors = []
  let err
  err = typeValidator.validate('type', obj['type'])
  if (err) {
    errors.push(err)
  }
  err = unitIdValidator.validate('unitId', obj['unitId'])
  if (err) {
    errors.push(err)
  }
  err = recordedAtValidator.validate('recordedAt', obj['recordedAt'])
  if (err) {
    errors.push(err)
  }
  err = tripIdValidator.validate('tripId', obj['tripId'])
  if (err) {
    errors.push(err)
  }
  err = valueValidator.validate('value', obj['value'])
  if (err) {
    errors.push(err)
  }
  err = positionValidator.validate('position', obj['position'])
  if (err) {
    errors.push(err)
  }
  if (!err && obj.hasOwnProperty('position')) {
    err = positionLatitudeValidator.validate('position', obj['position']['latitude'])
    if (err) {
      errors.push(err)
    }
    err = positionLongitudeValidator.validate('position', obj['position']['longitude'])
    if (err) {
      errors.push(err)
    }
    err = positionAccuracyValidator.validate('position', obj['position']['accuracy'])
    if (err) {
      errors.push(err)
    }
  }
  err = positionsValidator.validate('positions', obj['positions'])
  if (err) {
    errors.push(err)
  }
  if (!err && obj.hasOwnProperty('positions')) {
    for (let item of obj['positions']) {
      err = positionsLatitudeValidator.validate('position', item['latitude'])
      if (err) {
        errors.push(err)
      }
      err = positionsLongitudeValidator.validate('position', item['longitude'])
      if (err) {
        errors.push(err)
      }
      err = positionsAccuracyValidator.validate('position', item['accuracy'])
      if (err) {
        errors.push(err)
      }
    }
  }

  return errors
}

function timeRun(cb, operations) {
  const start = Date.now()
  for (let i = 0; i < OPERATIONS; i++) {
    cb()
  }
  const duration = Date.now() - start
  const ops = Math.round((operations / duration) * 1000 * 1000) / 1000
  return [duration, ops]
}
