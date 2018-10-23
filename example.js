const ObjectValidator = require('./index')
const { ExactString } = require('./validators')

let gpsOdometerKm = new ObjectValidator({
  type: ExactString('gps_odometer_km'),
  // "unitId": StringValue(1,32),
  // "recordedAt": ISODate(),
  // "tripId": Integer(0,4294967295)
  // "value": Integer(0,999999),
  position: {
    latitude: Float(-90, 90),
    longitude: Float(-180, 180),
    accuracy: Integer(0, 20)
  },
  // position$type: NestedObject(true),
  positions: {
    latitude: Float(-90, 90),
    longitude: Float(-180, 180),
    accuracy: Integer(0, 20),
    myList: {
      hej: StringValue(0, 10)
    },
    myList$type: NestedArray(-1, -1, true)
  },
  positions$type: NestedArray(0, 10, true)
})

const objects = [{ type: 'gps_odometer_km' }, { type: null }, { type: 'gps_odometer_km!' }]
for (const obj of objects) {
  try {
    gpsOdometerKm.validate(obj)
    console.log('Succeeded')
  } catch (e) {
    console.log('Failed:', e.message)
  }
  console.log('    ' + JSON.stringify(obj))
}
