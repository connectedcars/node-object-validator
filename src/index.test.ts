import { AssertEqual } from './common'
import { NotExactStringFail, RequiredFail, UnionFail } from './errors'
import {
  OptionalArray,
  OptionalInteger,
  OptionalObject,
  OptionalString,
  RequiredArray,
  RequiredDateTime,
  RequiredExactString,
  RequiredFloat,
  RequiredFloatOrFloatString,
  RequiredInteger,
  RequiredIntegerOrIntegerString,
  RequiredObject,
  RequiredRegexMatch,
  RequiredString,
  RequiredUnknown
} from './index'
import { RequiredEnum, RequiredUnion } from './validators/union'

describe.each([false, true])('Shorthand validation of complex objects (optimize: %s)', optimize => {
  const validator = new RequiredObject(
    {
      type: new RequiredExactString('gps_odometer_km'),
      unitId: new RequiredString(1, 32),
      recordedAt: new RequiredDateTime(),
      tripId: new RequiredInteger(0, 4294967295),
      value: new RequiredInteger(0, 999999),
      position: new RequiredObject({
        latitude: new RequiredFloat(-90, 90),
        longitude: new RequiredFloat(-180, 180),
        accuracy: new RequiredInteger(0, 20),
        extra: new RequiredObject({
          tag: new RequiredString(1, 50),
          tagversion: new RequiredIntegerOrIntegerString(1, 50),
          tagDepth: new RequiredFloatOrFloatString(0, 42.4)
        })
      }),
      optionalPosition: new OptionalObject({
        latitude: new RequiredFloat(-90, 90),
        longitude: new RequiredFloat(-180, 180),
        accuracy: new RequiredInteger(0, 20)
      }),
      positions: new RequiredArray(
        new RequiredObject({
          latitude: new RequiredFloat(-90, 90),
          longitude: new RequiredFloat(-180, 180),
          accuracy: new RequiredInteger(0, 20)
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
      `WrongLengthFail: Field 'positions' must contain between 2 and 10 entries (found 1) (received "[object Object]")`
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

describe.each([false, true])('Complex objects with unions using full syntax (optimize: %s)', optimize => {
  const buildUpdateMessageValidator = new RequiredObject(
    {
      buildId: new RequiredString(),
      repoUrl: new RequiredRegexMatch(/^http[s]?:\/\//),
      branchName: new RequiredString(),
      commitSha: new RequiredRegexMatch(/[0-9A-Fa-f]+/),
      tag: new RequiredString(),
      imageName: new RequiredString(),
      state: new RequiredString(),
      timestamp: new RequiredDateTime(),
      stepStarted: new RequiredDateTime(),
      cmd: new OptionalString(0, 1000),
      error: new OptionalString(0, 8000),
      currentDir: new OptionalString(0, 1000),
      message: new RequiredUnknown()
    },
    { optimize }
  )

  it('should validate step update', () => {
    const stepUpdateExample = {
      cmd: 'apt-get update && apt-get install -y mysql-server',
      state: 'end',
      buildId: '12345',
      repoUrl: 'https://github.com/connectedcars/node-test',
      branchName: 'master',
      commitSha: '9bd9e28e0ddc48e1193d8558a56a041697f6a74f',
      tag: '',
      imageName: 'gcr.io/connectedcars-staging/node-test.master:9bd9e28e0ddc48e1193d8558a56a041697f6a74f',
      started: '2021-01-01T15:58:51.237365219Z',
      timestamp: '2021-01-01T15:58:51.237365219Z',
      stepStarted: '2021-01-01T15:58:51.237365219Z',
      message: [
        {
          command: 'apt-get update && apt-get install -y mysql-server',
          step: 7,
          stepTotal: 15,
          stageStep: 5,
          stage: '',
          started: '2021-01-01T15:58:51.099197Z',
          stopped: '2021-01-01T15:58:51.237365219Z',
          duration: 9834000
        }
      ]
    }
    expect(buildUpdateMessageValidator.validate(stepUpdateExample)).toEqual([])
  })

  interface CheckRunAnnotations {
    path: string
    start_line: number
    end_line: number
    start_column?: number
    end_column?: number
    annotation_level: 'notice' | 'warning' | 'failure'
    message: string
    title?: string
    raw_details: string
  }

  const checkRunAnnotationValidator = new RequiredObject({
    path: new RequiredString(),
    start_line: new RequiredInteger(),
    end_line: new RequiredInteger(),
    start_column: new OptionalInteger(),
    end_column: new OptionalInteger(),
    annotation_level: new RequiredEnum(['notice', 'warning', 'failure'] as const),
    message: new RequiredString(),
    title: new OptionalString(),
    raw_details: new RequiredString()
  })

  // Validate that type and interface match
  checkRunAnnotationValidator.AssertType<CheckRunAnnotations, true>()

  interface CheckoutImages {
    alt: string
    image_url: string
    caption?: string
    actions?: {
      label: string
      description: string
      identifier: string
    }
  }

  const checkRunImagesValidator = new RequiredObject({
    alt: new RequiredString(),
    image_url: new RequiredString(),
    caption: new OptionalString(),
    actions: new OptionalObject({
      label: new RequiredString(),
      description: new RequiredString(),
      identifier: new RequiredString()
    })
  })

  // Validate that type and interface match
  checkRunImagesValidator.AssertType<CheckoutImages, true>()

  interface CheckRunOutput {
    title: string
    summary: string
    text?: string
    annotations?: CheckRunAnnotations[]
    images?: CheckoutImages[]
  }

  const checkRunOutputValidator = new OptionalObject({
    title: new RequiredString(0, 255),
    summary: new RequiredString(0, 255),
    text: new OptionalString(),
    annotations: new OptionalArray(checkRunAnnotationValidator, 0, 50),
    images: new OptionalArray(checkRunImagesValidator)
  })

  // Validate that type and interface match
  checkRunOutputValidator.AssertType<CheckRunOutput | undefined, true>()

  interface CheckRunStarted {
    name: string
    head_sha: string
    details_url?: string
    external_id?: string
    status: 'queued' | 'in_progress'
    started_at?: string
    output?: CheckRunOutput
  }

  const checkRunStartedValidator = new RequiredObject({
    name: new RequiredString(),
    head_sha: new RequiredString(),
    details_url: new OptionalString(),
    external_id: new OptionalString(),
    status: new RequiredEnum(['queued', 'in_progress'] as const),
    started_at: new OptionalString(),
    output: checkRunOutputValidator
  })

  // Validate that type and interface match
  expect(true as AssertEqual<typeof checkRunStartedValidator.tsType, CheckRunStarted>).toEqual(true)
  checkRunStartedValidator.AssertType<CheckRunStarted, true>()

  type CheckRunConclusion =
    | 'success'
    | 'failure'
    | 'neutral'
    | 'cancelled'
    | 'skipped'
    | 'timed_out'
    | 'action_required'

  const checkConclusionValidator = new RequiredEnum([
    'success',
    'failure',
    'neutral',
    'cancelled',
    'skipped',
    'timed_out',
    'action_required'
  ] as const)

  // Validate that type and interface match
  checkConclusionValidator.AssertType<CheckRunConclusion, true>()

  interface CheckRunCompleted {
    name: string
    head_sha: string
    details_url?: string | undefined
    external_id?: string
    status: 'completed'
    started_at?: string
    conclusion: CheckRunConclusion
    completed_at: string
    output?: CheckRunOutput
  }

  const checkRunCompletedValidator = new RequiredObject({
    name: new RequiredString(),
    head_sha: new RequiredString(),
    details_url: new OptionalString(),
    external_id: new OptionalString(),
    status: new RequiredExactString('completed'),
    started_at: new OptionalString(),
    conclusion: checkConclusionValidator,
    completed_at: new RequiredDateTime(),
    output: checkRunOutputValidator
  })

  // Validate that type and interface match
  expect(true as AssertEqual<typeof checkRunCompletedValidator.tsType, CheckRunCompleted>).toEqual(true)
  checkRunCompletedValidator.AssertType<CheckRunCompleted, true>()

  type CheckRun = CheckRunStarted | CheckRunCompleted

  const checkRunValidator = new RequiredUnion([checkRunStartedValidator, checkRunCompletedValidator])

  it('should validate completed checkrun', () => {
    const sample: unknown = {
      name: 'audit',
      head_sha: 'c61a4ae014360e064eb2a9f76c8a6a55d05e5b88',
      conclusion: 'success',
      status: 'completed',
      completed_at: '2020-10-15T20:52:48.294508Z',
      output: {
        title: 'npm audit security report',
        summary: 'Found **0** vulnerabilities in 4982 scanned packages',
        text: ''
      }
    }
    expect(checkRunCompletedValidator.validate(sample)).toEqual([])
    expect(checkRunValidator.validate(sample)).toEqual([])

    if (checkRunValidator.isValid<CheckRun>(sample)) {
      expect(true as AssertEqual<typeof sample, CheckRun>).toEqual(true)
    } else {
      fail('did not validate but should')
    }
  })

  it('should validate completed checkrun', () => {
    const sample = {
      name: 'audit',
      head_sha: 'c61a4ae014360e064eb2a9f76c8a6a55d05e5b88',
      status: 'in_progress',
      completed_at: '2020-10-15T20:52:48.294508Z'
    }
    expect(checkRunStartedValidator.validate(sample)).toEqual([])
    expect(checkRunValidator.validate(sample)).toEqual([])
  })

  it('should fail validation of checkun because of wrong status', () => {
    const sample = {
      name: 'audit',
      head_sha: 'c61a4ae014360e064eb2a9f76c8a6a55d05e5b88',
      status: 'unknown',
      completed_at: '2020-10-15T20:52:48.294508Z'
    }
    expect(checkRunValidator.validate(sample)).toEqual([
      new UnionFail(
        `Union entry failed validation with 2 errors`,
        [
          new UnionFail(
            `Union entry failed validation with 1 errors`,
            [new NotExactStringFail('Must strictly equal "queued"', 'unknown', `(0)['status'](0)`)],
            'unknown',
            "(0)['status'](0)"
          ),
          new UnionFail(
            `Union entry failed validation with 1 errors`,
            [new NotExactStringFail('Must strictly equal "in_progress"', 'unknown', `(0)['status'](1)`)],
            'unknown',
            "(0)['status'](1)"
          )
        ],
        sample,
        '(0)'
      ),
      new UnionFail(
        `Union entry failed validation with 2 errors`,
        [
          new NotExactStringFail('Must strictly equal "completed"', 'unknown', `(1)['status']`),
          new RequiredFail('Is required', undefined, `(1)['conclusion']`)
        ],
        sample,
        '(1)'
      )
    ])
  })
})
