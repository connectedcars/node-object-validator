# Object-validator

Validate input data based on a defined schema with detailed errors with the same performance as you had done custom optimized code to do the validation, removing any reason to not always do validation on input.

## Purpose

There exists a lot of validation libraries but most of them are slow, limit what you can validate, are tied to a specific build system, does not allow extension or has horrible syntax. ObjectValidate lets you construct simple schemas where you can validate input in detail, fx. limiting the size of a integer and give full feedback on what failed validation to the end user.

When running in optimized mode it generates a custom function that should give the fastest and least overhead validation that is possible often speeding up validating by more than 10 times.

# Installation

``` bash
npm install @connectedcars/object-validator
```

# Features

The following validators are supported:

* [Array](#arrayvalidatorvalidator-min-max-options): Validate that a value is an array of a specific type using other validators and min/max length of array
* [Boolean](#booleanvalidator): Validate that a value is a boolean
* [Date](#datevalidator): Validate that a value is a JavaScript Date object
* [DateTime](#datetimevalidator): Validate that a value is an ISO 8601 date/time string
* [ExactString](#exactstringvalidatorexpected): Validate that a value is a string that matches an exact string
* [FloatString](#floatstringvalidatormin-max): Validate that a value is float string within a min and max limit
* [Float](#floatvalidatormin-max): Validate that a value is a float within a min and max limit
* [IntegerString](#integerstringvalidatormin-max): Validate that a value is a integer string within a min and max limit
* [Integer](#integervalidatormin-max): Validate that a value is a integer within a min and max limit
* [Null](#nullvalidator): Validate that a value is null
* [Object](#objectvalidatorschema): Validate that a value is an object using other validators
* [RegexMatch](#regexmatchvalidatorregex): Validate that a value is a string that matches a regular expression
* [Sample](#samplevalidatorsample): Validate that a value matches a sample
* [String](#stringvalidatormin-max): Validate that a value is a string within a min and max limit
* [Union](#unionvalidatorvalidator): Validate that a value validates at least on validator out of a number of validators
* [Unknown](#unknownvalidator): Validate that a value is not undefined or or unset on a object

Validation functions:

* .validate(value) : Returns list of errors found in the validation
* .isType(value, listOfErrors) : Type guard for the type
* .isValid(value) : Type guard for the type
* .cast(value) : Returns type or throws ValidationError
* .toString() : Return validator code or TypeScript interface for the validator

Common options:

* optimized: Create optimized function and use this for validation (default: false)
* required: Is this validator required (default: true)
* nullCheck: Enable or disable null check (default: true)
* earlyFail: Return on first error (default: false)

# How to use

## Simple

The sample validator enables building very quick validators where that you slowly can add more validation as you go along.

``` typescript
import { SampleValidator } from '@connectedcars/object-validator'

interface Trip {
  type: 'gps_odometer_km'
  unitId: string
  recordedAt: string
  tripId: number
  value: number
  position: {
    latitude: number
    longitude: number
    accuracy: number
  }
  positions: Array<{
    latitude: number
    longitude: number
    accuracy: number
  }>
}

const tripValidator = new SampleValidator<Trip>({
  type: new RequiredExactString('trip'),
  unitId: '1234567',
  messageId: 'MSG-12345',
  recordedAt: '2018-08-06T13:37:00Z',
  tripId: 1337,
  value: 500,
  position: {
    latitude: 55.332131,
    longitude: 12.54454,
    accuracy: 21
  },
  positions: [{
    latitude: 55.332131,
    longitude: 12.54454,
    accuracy: 21
  }]
}, { optimize: true, earlyFail: true })

// Returns true if unknownValue validates
if(objectValidator.isValid(unknownValue)) {
  console.log(unknownValue.tripId) // unknownValue has been type cast to Trip
}

console.log(tripValidator.toString()) // Dump validator code
console.log(tripValidator.toString({ type: true })) // Dump typescript interface for the validator
```

## Advanced

``` typescript
import {
  ObjectValidator,
  OptionalObject,
  RequiredArray,
  RequiredDateTime,
  RequiredFloat,
  RequiredInteger,
  RequiredObject,
  RequiredString,
  RequiredExactString
} from '@connectedcars/object-validator'

interface Trip {
  type: 'gps_odometer_km'
  unitId: string
  recordedAt: string
  tripId: number
  value: number
  position: {
    latitude: number
    longitude: number
    accuracy: number
  }
  positions: Array<{
    latitude: number
    longitude: number
    accuracy: number
  }>
}

const tripValidator = new ObjectValidator<Trip>(
  {
    type: new RequiredExactString('trip'),
    unitId: new RequiredString(1, 32),
    recordedAt: new RequiredDateTime(),
    tripId: new RequiredInteger(0, 4294967295),
    value: new RequiredInteger(0, 999999),
    position: new OptionalObject({
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
      0,
      10
    )
  },
  { optimize: true }
)

let unknownValue = {
  type: 'trip',
  unitId: '1234567',
  messageId: 'MSG-12345',
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

// Returns errors found in object
let errors = gpsOdometerKm.validate(unknownValue)
if (errors.length > 0) {
  console.error(`${errors.length} errors found`)
}

// Returns true if errors is empty
if(gpsOdometerKm.isType(unknownValue, errors)) {
  console.log(unknownValue.unitId) // unknownValue.unitId has been type cast to string
}

// Returns true if unknownValue validates
if(objectValidator.isValid(unknownValue)) {
  console.log(unknownValue.tripId) // unknownValue.unitId has been type cast to number
}

// Throws ValidationsError if unknownValue does not validate
let knownValue = objectValidator.cast(unknownValue)
  console.log(knownValue.positions.length()) // unknownValue.unitId has been type cast to array
}
```

# Validators

## ArrayValidator(validator, min, max, options)

Alias: RequiredArray, OptionalArray

Function: isArray

``` typescript
let arrayValidator = new ArrayValidator(new IntegerValidator(0, 10), 0, 2)
let errors = arrayValidator.validate([1, 10])
```

``` typescript
if (isArray(new IntegerValidator(0, 10), [1, 10] 0, 2))  {
  console.log('Is integer array')
}
```

## BooleanValidator

Alias: RequiredBoolean, OptionalBoolean

Function: isBoolean

``` typescript
let booleanValidator = new BooleanValidator()
let errors = booleanValidator.validate(true)
```

``` typescript
if (isBoolean(true)) {
  console.log('Is boolean')
}
```

## DateValidator

Alias: RequiredDate, OptionalDate

Function: isDate

``` typescript
let dateValidator = new DateValidator()
let errors = dateValidator.validate(new Date())
```

``` typescript
if (isDate(new Date())) {
  console.log('Is Date')
}
```

## DateTimeValidator

Alias: RequiredDateTime, OptionalDateTime

Function: isDateTime

``` typescript
let dateTimeValidator = new DateTimeValidator()
let errors = dateTimeValidator.validate('2018-08-06T13:37:00Z')
```

``` typescript
if (isDateTime('2018-08-06T13:37:00Z')) {
  console.log('Is ISO date')
}
```

## ExactStringValidator(expected)

Alias: RequiredExactString, OptionalExactString

Function: isExactString

``` typescript
let exactStringValidator = new ExactStringValidator('mystring')
let errors = exactStringValidator.validate('mystring')
```

``` typescript
if (isExactString('mystring', 'mystring')) {
  console.log('Is mystring')
}
```

## FloatStringValidator(min, max)

Alias: RequiredFloatString, OptionalFloatString

Function: isFloatString

``` typescript
let floatStringValidator = new FloatStringValidator()
let errors = floatStringValidator.validate("1.0")
```

``` typescript
if (isFloatString('1.1')) {
  console.log('Is float string')
}
```

## FloatValidator(min, max)

Alias: RequiredFloat, OptionalFloat

Function:

``` typescript
let floatValidator = new FloatValidator()
let errors = floatValidator.validate(1.0)
```

``` typescript
if (isFloat(1.1)) {
  console.log('Is float')
}
```

## IntegerStringValidator(min, max)

Alias: RequiredIntegerString, OptionalIntegerString

Function: isIntegerString

``` typescript
let integerStringValidator = new IntegerStringValidator()
let errors = integerStringValidator.validate('10')
```

``` typescript
if (isIntegerString('10')) {
  console.log('Is integer string')
}
```

## IntegerValidator(min, max)

Alias: RequiredInteger, OptionalInteger

Function: isInteger

``` typescript
let integerValidator = new IntegerValidator()
let errors = integerValidator.validate(10)
```

``` typescript
if (isInteger(10)) {
  console.log('Is integer')
}
```

## NullValidator

Alias: RequiredNull, OptionalNull

Function: isNull

``` typescript
let nullValidator = new NullValidator()
let errors = nullValidator.validate(null)
```

``` typescript
if (isNull(10)) {
  console.log('Is null')
}
```

## ObjectValidator(schema)

Alias: RequiredObject, OptionalObject

Function: isObject

``` typescript
let objectValidator = new ObjectValidator({
  int: new IntegerValidator(0, 10)
})
let errors = objectValidator.validate({
  int: 10
})
```

``` typescript
if (isObject({ int: new IntegerValidator(0, 10) }, { int: 10 })) {
  console.log('Is object')
}
```

## RegexMatchValidator(regex)

Alias: RequiredRegexMatch, OptionalRegexMatch

Function: isRegexMatch

``` typescript
let regexMatchValidator = new RegexMatchValidator(/^hello$/)
let errors = regexMatchValidator.validate('hello')
```

``` typescript
if (isRegexMatch(/hello/, 'hello')) {
  console.log('Is regex match')
}
```

## SampleValidator(sample)

Alias: RequiredSample, OptionalSample

Function: isSample

The sample validator will convert a sample to a validator based on types with a few exceptions:

* Integer numbers in the sample with be converted to a IntegerValidator, fx. 1, 10, etc.
* Float numbers in the sample with be converted to a FloatValidator, fx. 1.1, 2.2, etc.
* Strings that validates with the DateTime validator will be converted DateTimeValidator, fx. '2018-08-06T13:37:00Z'


``` typescript
let sampleValidator = new SampleValidator({
  date: '2018-08-06T13:37:00Z'
  key: new ExactStringValidator('value')
})
let errors = sampleValidator.validate({
  date: '2018-08-06T13:37:00Z',
  key: 'value'
})
```

``` typescript
let sample = {
  date: '2018-08-06T13:37:00Z'
  key: new ExactStringValidator('value')
}
let value = {
  date: '2018-08-06T13:37:00Z',
  key: 'value'
}
if (isSample(sample, value)) {
  console.log('Is sample match')
}
```

More complex example:

``` typescript
const sample = {
  type: new RequiredExactString('gps_odometer_km'),
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
```

## StringValidator(min, max)

Alias: RequiredString, OptionalString

Function: isString

``` typescript
let stringValidator = new StringValidator()
let errors = stringValidator.validate('hello1234')
```

``` typescript
if (isString('hello1234')) {
  console.log('Is string')
}
```

## UnionValidator([validator, ...])

Alias: RequiredUnion, OptionalUnion

Function: isUnion

The union validator takes a union of validates and validates the value with each of them, it will stop when the first validates and return a positive result. It has a special optimization for a union of ObjectValidators with a shared required ExactString key, it will use the key to figure out what validator to use.

``` typescript
let unionValidator = new UnionValidator([
  new IntegerValidator(),
  new StringValidator()
])
let errors1 = unionValidator.validate('hello')
let errors2 = unionValidator.validate(10)
```

``` typescript
let union = [
  new IntegerValidator(),
  new StringValidator()
]
if (isSample(union, 10)) {
  console.log('Is union match')
}
```

Example of shared required ExactString key:

``` typescript
interface NumberMessage {
  type: 'number'
  value: number
}

interface StringMessage {
  type: 'string'
  value: number
}

interface ErrorMessage {
  type: 'error'
  error: string
}

type Message = ErrorMessage | StringMessage | NumberMessage

const numberMessageValidator = new RequiredObject({
  type: new RequiredExactString('number'),
  value: new RequiredFloat()
})

const stringMessageValidator = new RequiredObject({
  type: new RequiredExactString('string'),
  value: new RequiredString()
})

const errorMessageValidator = new RequiredObject({
  type: new RequiredExactString('error'),
  error: new RequiredString()
})

const messageValidator = new UnionValidator<Message>([
  numberMessageValidator,
  stringMessageValidator,
  errorMessageValidator
])

let errors = messageValidator.validate({ type: 'string', value: 'hello' })
```

## UnknownValidator

Alias: RequiredUnknown, OptionalUnknown

Function: isUnknown

The unknown validator only makes sense to use with another validate like the object validator to require a key even when the type is not known.

``` typescript
let unknownValidator = new UnknownValidator()
let errors1 = unknownValidator.validate('hello')
let errors2 = unknownValidator.validate(10)
let errors3 = unknownValidator.validate(null)
```

``` typescript
if (isUnknown('hello1234')) {
  console.log('Is unknown')
}
```

# Benchmark

``` text
success in 1.937 s (516,262.261 ops/s)
success optimized in 0.195 s (5,128,205.128 ops/s)
failureEarly in 1.349 s (741,289.844 ops/s)
failureEarly optimized in 0.715 s (1,398,601.399 ops/s)
failureLate in 1.309 s (763,941.94 ops/s)
failureLate optimized in 0.351 s (2,849,002.849 ops/s)
```
