import { AssertEqual } from '../common'
import {
  DoesNotMatchRegexFail,
  NotArrayFail,
  NotDateFail,
  NotFloatFail,
  NotIntegerFail,
  NotNullFail,
  NotStringFail,
  RequiredFail,
  WrongLengthFail
} from '../errors'
import { RequiredInteger } from './integer'
import {
  isSample,
  NullableSample,
  OptionalNullableSample,
  OptionalSample,
  RequiredSample,
  validateSample
} from './sample'

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
      expect(validateSample(new Date(), '')).toEqual([new NotDateFail('Must be a Date object', '')])
    })

    it('should validate iso date time sample', () => {
      expect(validateSample('2018-08-06T13:37:00.000Z', '2018-08-06T13:37:00.000Z')).toEqual([])
      expect(validateSample('2018-08-06T13:37:00.000Z', '')).toEqual([
        new WrongLengthFail('Must contain between 20 and 30 characters', '')
      ])
    })

    it('should validate float sample', () => {
      expect(validateSample(1.1, 2.1)).toEqual([])
      expect(validateSample(1.1, '')).toEqual([new NotFloatFail('Must be a float', '')])
    })

    it('should validate integer sample', () => {
      expect(validateSample(1, 2)).toEqual([])
      expect(validateSample(1, '')).toEqual([new NotIntegerFail('Must be an integer', '')])
    })

    it('should validate object sample', () => {
      const schema = {
        type: 'message'
      }
      expect(validateSample(schema, { type: 'message' })).toEqual([])
      expect(validateSample(schema, { value: 'message' })).toEqual([new RequiredFail('Is required', undefined, 'type')])
    })

    it('should validate regex sample', () => {
      expect(validateSample(/^status$/, 'status')).toEqual([])
      expect(validateSample(/^status$/, 'something else')).toEqual([
        new DoesNotMatchRegexFail(`Did not match '/^status$/'`, 'something else')
      ])
    })

    it('should validate string sample', () => {
      expect(validateSample('', '')).toEqual([])
      expect(validateSample('', 2)).toEqual([new NotStringFail('Must be a string', 2)])
    })

    it('should validate null sample', () => {
      expect(validateSample(null, null)).toEqual([])
      expect(validateSample(null, 2)).toEqual([new NotNullFail('Must be an null', 2)])
    })

    it('should validate undefined sample', () => {
      expect(validateSample(undefined, undefined)).toEqual([])
      expect(validateSample(undefined, 2)).toEqual([])
    })

    it('should validate with validator sample', () => {
      expect(validateSample(new RequiredInteger(), 10)).toEqual([])
      expect(validateSample(new RequiredInteger(), '')).toEqual([new NotIntegerFail('Must be an integer', '')])
    })

    it('should validate with array validator sample', () => {
      expect(validateSample([new RequiredInteger()], [10])).toEqual([])
      expect(validateSample([new RequiredInteger()], '')).toEqual([new NotArrayFail('Must be an array', '')])
    })
  })

  describe('isSample', () => {
    it('should cast value to boolean', () => {
      const value = true as unknown
      if (isSample(true, value)) {
        expect(true as AssertEqual<typeof value, boolean>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should cast value to string', () => {
      const value = '' as unknown
      if (isSample('hello', value)) {
        expect(true as AssertEqual<typeof value, string>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should cast value to number', () => {
      const value = 5 as unknown
      if (isSample(10, value)) {
        expect(true as AssertEqual<typeof value, number>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should cast value to number array', () => {
      const value = [1] as unknown
      if (isSample([10], value)) {
        expect(true as AssertEqual<typeof value, number[]>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should cast value to string array', () => {
      const value = [''] as unknown
      if (isSample(['hello', 'hello2'], value)) {
        expect(true as AssertEqual<typeof value, string[]>).toEqual(true)
      } else {
        fail('did not validate but should')
      }
    })

    it('should fail validation', () => {
      const value = 'string' as unknown
      expect(isSample(10, value)).toEqual(false)
    })
  })

  describe('RequiredSample', () => {
    it('should return an function body', () => {
      const validator = new RequiredSample(10, { optimize: false })
      expect(validator.codeGen('value1', 'validator1')).toMatchSnapshot()
    })

    it('should export types', () => {
      const validator = new RequiredSample(10, { optimize: false })
      const code = validator.toString({ types: true })
      expect(code).toEqual('number')
    })
  })
})

describe.each([false, true])('Sample (optimize: %s)', optimize => {
  describe('SampleValidator', () => {
    it('should generate validation code and give same result', () => {
      const validator = new RequiredSample(true, { optimize })
      if (optimize) {
        expect(validator['validator']['optimizedValidate']).not.toBeNull()
      } else {
        expect(validator['validator']['optimizedValidate']).toBeNull()
      }
      expect(validator.validate(false)).toEqual([])
    })

    it('should export validator code with options', () => {
      const sample = {
        type: 'gps_odometer_km',
        recordedAt: '2018-08-06T13:37:00Z',
        tripId: 1337,
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
          }
        ]
      }
      const sampleValidator = new RequiredSample(sample, { optimize })
      const code = sampleValidator.toString()
      const expected = [
        'new RequiredObject({',
        `  'type': new RequiredString(),`,
        `  'recordedAt': new RequiredDateTime(),`,
        `  'tripId': new RequiredInteger(),`,
        `  'position': new RequiredObject({`,
        `    'latitude': new RequiredFloat(),`,
        `    'longitude': new RequiredFloat(),`,
        `    'accuracy': new RequiredInteger()`,
        '  }),',
        `  'positions': new RequiredArray(new RequiredObject({`,
        `    'latitude': new RequiredFloat(),`,
        `    'longitude': new RequiredFloat(),`,
        `    'accuracy': new RequiredInteger()`,
        '  }))'
      ]
      if (optimize) {
        expect(code).toEqual([...expected, '})'].join('\n'))
      } else {
        expect(code).toEqual([...expected, '}, { optimize: false })'].join('\n'))
      }
    })

    it('should export types', () => {
      const sample = {
        type: 'gps_odometer_km',
        recordedAt: '2018-08-06T13:37:00Z',
        tripId: 1337,
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
          }
        ]
      }
      const sampleValidator = new RequiredSample(sample, { optimize })
      const code = sampleValidator.toString({ types: true })
      const expected = [
        '{',
        `  'type': string`,
        `  'recordedAt': string`,
        `  'tripId': number`,
        `  'position': {`,
        `    'latitude': number`,
        `    'longitude': number`,
        `    'accuracy': number`,
        '  }',
        `  'positions': Array<{`,
        `    'latitude': number`,
        `    'longitude': number`,
        `    'accuracy': number`,
        '  }>',
        '}'
      ]
      expect(code).toEqual(expected.join('\n'))
    })

    it('should validate an array', () => {
      const arrayValidator = new RequiredSample([1], { optimize })
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
      const validator = new RequiredSample(sample, { optimize })
      expect(validator.validate(sample)).toEqual([])
      expect(
        true as AssertEqual<
          typeof validator.tsType,
          {
            type: string
            unitId: string
            recordedAt: string
            tripId: number
            value: number
            position: {
              latitude: number
              longitude: number
              accuracy: number
              extra: {
                tag: string
                tagversion: number
                tagDepth: number
              }
            }
            positions: {
              latitude: number
              longitude: number
              accuracy: number
            }[]
          }
        >
      ).toEqual(true)
    })
  })

  describe('OptionalSample', () => {
    it('accepts empty value', () => {
      const validator = new OptionalSample(false, { optimize })
      expect(validator.validate(true)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, boolean | undefined>).toEqual(true)
    })
  })

  describe('NullableSample', () => {
    it('accepts empty value', () => {
      const validator = new NullableSample(false, { optimize })
      expect(validator.validate(true)).toStrictEqual([])
      expect(validator.validate(null)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, boolean | null>).toEqual(true)
    })
  })

  describe('OptionalNullableSample', () => {
    it('accepts empty value', () => {
      const validator = new OptionalNullableSample(false, { optimize })
      expect(validator.validate(true)).toStrictEqual([])
      expect(validator.validate(undefined)).toStrictEqual([])
      expect(true as AssertEqual<typeof validator.tsType, boolean | null | undefined>).toEqual(true)
    })
  })
})
