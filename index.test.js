const expect = require('unexpected')
const ObjectValidator = require('./index')
const { ValidationError } = require('./lib/errors')
const { DateTime, ExactString, Float, Integer, NestedArray, NestedObject, StringValue } = require('./validators')

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
      optionalPosition$type: NestedObject(false),
      positions: {
        latitude: Float(-90, 90),
        longitude: Float(-180, 180),
        accuracy: Integer(0, 20)
      },
      positions$type: NestedArray(2, 10, true)
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
      }),
      'to equal',
      []
    )
  })

  it('fails due to empty object', function() {
    expect(this.validator.validate({}), 'to equal', [
      new ValidationError('Field `type` (ExactString) is required', { key: 'type' }),
      new ValidationError('Field `unitId` (StringValue) is required', { key: 'unitId' }),
      new ValidationError('Field `recordedAt` (DateTime) is required', { key: 'recordedAt' }),
      new ValidationError('Field `tripId` (Integer) is required', { key: 'tripId' }),
      new ValidationError('Field `value` (Integer) is required', { key: 'value' }),
      new ValidationError('Field `position` (NestedObject) is required', { key: 'position' }),
      new ValidationError('Field `positions` (NestedArray) is required', { key: 'positions' })
    ])
  })

  it('fails due to invalid position', function() {
    expect(
      this.validator.validate({
        type: 'gps_odometer_km',
        unitId: '1234567',
        recordedAt: '2018-08-06T13:37:00Z',
        tripId: 1337,
        value: 500,
        position: {
          latitude: 55.332131,
          longitude: -181,
          accuracy: 18,
          extra: {
            tag: 'bogus'
          }
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
      }),
      'to equal',
      [
        new ValidationError('Field `longitude` (Float) must at least be -180 (received "-181")', {
          key: 'longitude',
          val: -181
        })
      ]
    )
  })

  it('fails due to invalid double nested object', function() {
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
      }),
      'to equal',
      [
        new ValidationError('Field `tag` (StringValue) must at least contain 1 characters (received "")', {
          key: 'tag',
          val: ''
        })
      ]
    )
  })

  it('fails due to missing positions', function() {
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
            tag: 'test'
          }
        }
      }),
      'to equal',
      [new ValidationError('Field `positions` (NestedArray) is required', { key: 'positions' })]
    )
  })

  it('fails due to too few positions', function() {
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
            tag: 'test'
          }
        },
        positions: [
          {
            latitude: 55.332131,
            longitude: 12.54454,
            accuracy: 18
          }
        ]
      }),
      'to equal',
      [
        new ValidationError('Field `positions` (NestedArray) must at least contain 2 entries (found 1)', {
          key: 'positions',
          val: [
            {
              latitude: 55.332131,
              longitude: 12.54454,
              accuracy: 18
            }
          ]
        })
      ]
    )
  })

  it('fails due to invalid positions', function() {
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
            tag: 'test'
          }
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
            accuracy: 21
          }
        ]
      }),
      'to equal',
      [
        new ValidationError('Field `accuracy` (Integer) must at most be 20 (received "21")', {
          key: 'accuracy',
          val: 21
        })
      ]
    )
  })
})
