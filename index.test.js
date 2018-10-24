const expect = require('unexpected')
const ObjectValidator = require('./index')
const { ValidationError } = require('./lib/errors')
const NestedObject = require('./lib/nested-object')
const { DateTime, ExactString, Float, Integer, StringValue } = require('./validators')

describe('ObjectValidator', function() {
  before(function() {
    this.validator = new ObjectValidator({
      type: ExactString('gps_odometer_km'),
      unitId: StringValue(1, 32),
      recordedAt: DateTime(),
      tripId: Integer(0, 4294967295),
      value: Integer(0, 999999),
      position: {
        latitude: Float(-90, 90),
        longitude: Float(-180, 180),
        accuracy: Integer(0, 20),
        extra: {
          tag: StringValue(1, 50)
        }
      },
      optionalPosition: {
        latitude: Float(-90, 90),
        longitude: Float(-180, 180),
        accuracy: Integer(0, 20)
      },
      optionalPosition$type: NestedObject(false)
    })
  })

  it('validates successfully', function() {
    expect(
      this.validator.validate({
        type: 'gps_odometer_km',
        unitId: '1234567',
        recordedAt: '2018-08-06T13:37:00Z',
        tripId: 1337,
        value: 500,
        position: {
          latitude: 55.332131,
          longitude: 12.54454,
          accuracy: 18,
          extra: {
            tag: 'yes'
          }
        }
      }),
      'to equal',
      []
    )
  })

  it('fails validation early', function() {
    expect(this.validator.validate({}), 'to equal', [
      new ValidationError('Field `type` (ExactString) is required'),
      new ValidationError('Field `unitId` (StringValue) is required'),
      new ValidationError('Field `recordedAt` (DateTime) is required'),
      new ValidationError('Field `tripId` (Integer) is required'),
      new ValidationError('Field `value` (Integer) is required'),
      new ValidationError('Field `position` (NestedObject) is required')
    ])
  })

  it('fails validation late', function() {
    expect(
      this.validator.validate({
        type: 'gps_odometer_km',
        unitId: '1234567',
        recordedAt: '2018-08-06T13:37:00Z',
        tripId: 1337,
        value: 500,
        position: {
          latitude: 55.332131,
          longitude: 12.54454,
          accuracy: 18,
          extra: {
            tag: ''
          }
        }
      }),
      'to equal',
      [new ValidationError('Field `tag` (StringValue) must at least contain 1 characters (received "")')]
    )
  })
})
