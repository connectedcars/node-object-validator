import { ObjectValidator } from './index'
import { DateTime, ExactString, Float, Integer, StringValue, TypedArray, TypedObject } from './index'
import { FloatOrFloatString } from './validators/float-or-float-string'
import { IntegerOrIntegerString } from './validators/integer-or-integer-string'

describe.each([false, true])('Shorthand validation of complex objects (optimize: %s)', optimize => {
  const validator = new ObjectValidator(
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
          tag: StringValue(1, 50),
          tagversion: IntegerOrIntegerString(1, 50),
          tagDepth: FloatOrFloatString(0, 42.4)
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

  it('validates successfully', () => {
    expect(
      validator.validate({
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
            tag: 'yes',
            tagversion: 4,
            tagDepth: '27.89'
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
      })
    ).toEqual([])
  })

  it('fails due to empty object', () => {
    const errors = validator.validate({})
    expect(errors.map(e => e.toString())).toMatchSnapshot()
  })

  it('fails due to invalid position', () => {
    const errors = validator.validate({
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
          tag: 'bogus',
          tagversion: '4',
          tagDepth: 27
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
    })
    expect(errors.map(e => e.toString())).toEqual([
      `OutOfRangeFail: Field 'position['longitude']' must be between -180 and 180 (received "-181")`
    ])
  })

  it('fails due to invalid double nested object', () => {
    const errors = validator.validate({
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
          tag: '',
          tagversion: 32,
          tagDepth: 3.1416
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
    })
    expect(errors.map(e => e.toString())).toEqual([
      `WrongLengthFail: Field 'position['extra']['tag']' must contain between 1 and 50 characters (received "")`
    ])
  })

  it('fails due to missing positions', () => {
    const errors = validator.validate({
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
          tag: 'test',
          tagversion: 32,
          tagDepth: 3.1416
        }
      }
    })
    expect(errors.map(e => e.toString())).toEqual([`RequiredFail: Field 'positions' is required`])
  })

  it('fails due to too few positions', () => {
    const errors = validator.validate({
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
          tag: 'test',
          tagversion: 32,
          tagDepth: 3.1416
        }
      },
      positions: [
        {
          latitude: 55.332131,
          longitude: 12.54454,
          accuracy: 18
        }
      ]
    })
    expect(errors.map(e => e.toString())).toEqual([
      `WrongLengthFail: Field 'positions' must contain between 2 and 10 entries (found 1)`
    ])
  })

  it('fails due to invalid positions', () => {
    const errors = validator.validate({
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
          tag: 'test',
          tagversion: 32,
          tagDepth: 3.1416
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
    })
    expect(errors.map(e => e.toString())).toEqual([
      `OutOfRangeFail: Field 'positions[1]['accuracy']' must be between 0 and 20 (received "21")`
    ])
  })
})
