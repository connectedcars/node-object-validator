import {
  DoesNotMatchRegexFail,
  NotDateFail,
  NotFloatFail,
  NotIntegerFail,
  NotStringFail,
  RequiredFail
} from '../errors'
import { SampleValidator, validateSample } from './sample'

describe('Sample', () => {
  describe('validateSample', () => {
    it('should validate array sample', () => {
      expect(validateSample([], ['value1', 1])).toEqual([])
      expect(validateSample([''], ['value1', 'value2'])).toEqual([])
      expect(validateSample(['status'], ['status', 'status'])).toEqual([])
      expect(validateSample([1], [1, 2])).toEqual([])
      expect(validateSample([1.1], [1.1, 2.1])).toEqual([])
      expect(validateSample([/^status[0-9]$/], ['status1', 'status2'])).toEqual([])
      expect(validateSample([new Date()], [new Date(), new Date()])).toEqual([])
      expect(
        validateSample(
          [
            {
              type: 'message'
            }
          ],
          [{ type: 'message' }]
        )
      ).toEqual([])
      expect(validateSample(['2018-08-06T13:37:00.000Z'], ['2018-08-06T13:37:00.000Z'])).toEqual([])
    })

    it('should validate Date sample', () => {
      expect(validateSample(new Date(), new Date())).toEqual([])
      expect(validateSample(new Date(), '')).toEqual([new NotDateFail('Must be a Date object')])
    })

    it('should validate iso date time sample', () => {
      expect(validateSample('2018-08-06T13:37:00.000Z', '2018-08-06T13:37:00.000Z')).toEqual([])
      expect(validateSample('2018-08-06T13:37:00.000Z', '')).toEqual([])
    })

    it('should validate float sample', () => {
      expect(validateSample(1.1, 2.1)).toEqual([])
      expect(validateSample(1.1, '')).toEqual([new NotFloatFail('Must be a float (received "")')])
    })

    it('should validate integer sample', () => {
      expect(validateSample(1, 2)).toEqual([])
      expect(validateSample(1, '')).toEqual([new NotIntegerFail('Must be an integer (received "")')])
    })

    it('should validate object sample', () => {
      const schema = {
        type: 'message'
      }
      expect(validateSample(schema, { type: 'message' })).toEqual([])
      expect(validateSample(schema, { value: 'message' })).toEqual([new RequiredFail('Is required', { key: 'type' })])
    })

    it('should validate regex sample', () => {
      expect(validateSample(/^status$/, 'status')).toEqual([])
      expect(validateSample(/^status$/, 'something else')).toEqual([
        new DoesNotMatchRegexFail(`Did not match '/^status$/' (received "something else")`)
      ])
    })

    it('should validate string sample', () => {
      expect(validateSample('', '')).toEqual([])
      expect(validateSample('', 2)).toEqual([new NotStringFail('Must be a string (received "2")')])
    })
  })
})

describe.each([false, true])('Sample (optimize: %s)', optimize => {
  describe('SampleValidator', () => {
    it('should validate an array', () => {
      const arrayValidator = new SampleValidator([1], { optimize })
      const errors = arrayValidator.validate([1, 2, 4, 5])
      expect(errors).toEqual([])
    })

    it('should validate a complex object', () => {
      const sample = {
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
      }
      const sampleValidator = new SampleValidator(sample, { optimize })
      const errors = sampleValidator.validate(sample)
      expect(errors).toEqual([])
    })
  })
})
