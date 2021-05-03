# Object-validator

Validate input data based on a defined schema with automatic compile time type interference and excellent performance, removing any reason to not always do validation on input:

Features:

* Detailed validation errors
* Precise validation with sub types for number like floats and integers with min/max value
* Optimized code generation (Similar performance to hand optimized code)
* Compile time type interference (Without using compiler plugins or parsers, just pure typescript)
* Easy to implement own validators
* Zero dependencies

## Purpose

There exists a lot of validation libraries but most of them are slow, limit what you can validate, are tied to a specific build system, does not allow extension or has horrible syntax. ObjectValidator lets you construct simple schemas where you can validate input in detail, fx. limiting the size of a integer and give full feedback on what failed validation to the end user. While doing this you also construct your typescript types without having to define separate interfaces or types for what you are validating.

When running in optimized mode it generates a custom function that should give the fastest and least overhead validation that is possible often speeding up validating by more than 10 times.

# Installation

``` bash
npm install @connectedcars/object-validator
```

# Features

The following validators are supported:

* [Array](#array-validator-min-max-options): Validate that a value is an array of a specific type using other validators and min/max length of array
* [Boolean](#boolean): Validate that a value is a boolean
* [Date](#date): Validate that a value is a JavaScript Date object
* [DateTime](#datetime): Validate that a value is an ISO 8601 date/time string
* [ExactString](#exactstring-expected): Validate that a value is a string that matches an exact string
* [FloatString](#floatstring-min-max): Validate that a value is float string within a min and max limit
* [Float](#floatmin-max): Validate that a value is a float within a min and max limit
* [IntegerString](#integerstring-min-max): Validate that a value is a integer string within a min and max limit
* [Integer](#integer-min-max): Validate that a value is a integer within a min and max limit
* [Null](#null): Validate that a value is null
* [Object](#object-schema): Validate that a value is an object using other validators
* [RegexMatch](#regexmatch-regex): Validate that a value is a string that matches a regular expression
* [Sample](#sample-sample): Validate that a value matches a sample
* [String](#string-min-max): Validate that a value is a string within a min and max limit
* [Undefined](#undefined): Validate that a value is undefined
* [Union](#union-validator): Validate that a value validates at least one validator out of a number of validators
* [Enum](#enumstring): Validate that a value validates is a string and matches at least one exact string
* [Unknown](#unknown): Validate that a value is not undefined or or unset on a object

Validation functions:

* .validate(value) : Returns list of errors found in the validation
* .isType(value, listOfErrors) : Type guard for the type to avoid doing validation twice
* .isValid(value) : Type guard for the type
* .cast(value) : Returns type or throws ValidationError
* .toString() : Return validator code or TypeScript interface for the validator
* .AssertType<OwnType, true | false> : No op function to validate custom types match a validator

Common options:

* optimize: Create optimized function and use this for validation (default: true)
* earlyFail: Return on first error (default: false)

# How to use

## Simple

The sample validator enables building very quick validators where that you slowly can add more validation as you go along.

``` typescript
import { RequiredSample } from '@connectedcars/object-validator'

const tripValidator = new RequiredSample({
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
  // unknownValue has been cast to the following type
  // {
  //  type: 'gps_odometer_km'
  //  unitId: string
  //  recordedAt: string
  //  tripId: number
  //  value: number
  //  position: {
  //    latitude: number
  //    longitude: number
  //    accuracy: number
  //  }
  //  positions: Array<{
  //    latitude: number
  //    longitude: number
  //    accuracy: number
  //  }>
  // }
  console.log(unknownValue.tripId)
}

console.log(tripValidator.toString()) // Dump validator code
console.log(tripValidator.toString({ type: true })) // Dump typescript interface for the validator
```

## Advanced

``` typescript
import {
  RequiredObject,
  OptionalObject,
  RequiredArray,
  RequiredDateTime,
  RequiredFloat,
  RequiredInteger,
  RequiredObject,
  RequiredString,
  RequiredExactString
} from '@connectedcars/object-validator'

const tripValidator = new RequiredObject(
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

interface Trip {
  type: 'trip',
  unitId: string,
  recordedAt: string,
  tripId: number,
  value: number,
  position?: {
    latitude: number,
    longitude: number,
    accuracy: number
  },
  positions: [
    {
      latitude: number,
      longitude: number,
      accuracy: number
    }
  ]
}
// Throws compile error if type does not match validator
objectValidator.AssertType<Trip, true>

// Throws compile error if type matches validator
objectValidator.AssertType<Trip, false>
```

# Validators

## Array (validator, min, max, options)

Validators: RequiredArray, OptionalArray, NullableArray, OptionalNullableArray

Function: isArray

``` typescript
let arrayValidator = new RequiredArray(new RequiredInteger(0, 10), 0, 2)
let errors = arrayValidator.validate([1, 10])
```

``` typescript
if (isArray(new RequiredInteger(0, 10), [1, 10] 0, 2))  {
  console.log('Is integer array')
}
```

## Boolean

Validators: RequiredBoolean, OptionalBoolean, NullableBoolean, OptionalNullableBoolean

Function: isBoolean

``` typescript
let booleanValidator = new RequiredBoolean()
let errors = booleanValidator.validate(true)
```

``` typescript
if (isBoolean(true)) {
  console.log('Is boolean')
}
```

## Date

Validators: RequiredDate, OptionalDate, NullableDate, OptionalNullableDate

Function: isDate

``` typescript
let dateValidator = new RequiredDate()
let errors = dateValidator.validate(new Date())
```

``` typescript
if (isDate(new Date())) {
  console.log('Is Date')
}
```

## DateTime

Validators: RequiredDateTime, OptionalDateTime, NullableDateTime, OptionalNullableDateTime

Function: isDateTime

``` typescript
let dateTimeValidator = new RequiredDateTime()
let errors = dateTimeValidator.validate('2018-08-06T13:37:00Z')
```

``` typescript
if (isDateTime('2018-08-06T13:37:00Z')) {
  console.log('Is ISO date')
}
```

## ExactString (expected)

Validators: RequiredExactString, OptionalExactString, NullableExactString, OptionalNullableExactString

Function: isExactString

``` typescript
let exactStringValidator = new RequiredExactString('mystring')
let errors = exactStringValidator.validate('mystring')
```

``` typescript
if (isExactString('mystring', 'mystring')) {
  console.log('Is mystring')
}
```

## FloatString (min, max)

Validators: RequiredFloatString, OptionalFloatString, NullableFloatString, OptionalNullableFloatString

Function: isFloatString

``` typescript
let floatStringValidator = new RequiredFloatString()
let errors = floatStringValidator.validate("1.0")
```

``` typescript
if (isFloatString('1.1')) {
  console.log('Is float string')
}
```

## Float (min, max)

Validators: RequiredFloat, OptionalFloat, NullableFloat, OptionalNullableFloat

Function:

``` typescript
let floatValidator = new RequiredFloat()
let errors = floatValidator.validate(1.0)
```

``` typescript
if (isFloat(1.1)) {
  console.log('Is float')
}
```

## IntegerString (min, max)

Validators: RequiredIntegerString, OptionalIntegerString, NullableIntegerString, OptionalNullableIntegerString

Function: isIntegerString

``` typescript
let integerStringValidator = new RequiredIntegerString()
let errors = integerStringValidator.validate('10')
```

``` typescript
if (isIntegerString('10')) {
  console.log('Is integer string')
}
```

## Integer (min, max)

Validators: RequiredInteger, OptionalInteger, NullableInteger, OptionalNullableInteger

Function: isInteger

``` typescript
let integerValidator = new RequiredInteger()
let errors = integerValidator.validate(10)
```

``` typescript
if (isInteger(10)) {
  console.log('Is integer')
}
```

## Null

Validators: RequiredNull, OptionalNull, NullableNull, OptionalNullableNull

Function: isNull

``` typescript
let nullValidator = new RequiredNull()
let errors = nullValidator.validate(null)
```

``` typescript
if (isNull(10)) {
  console.log('Is null')
}
```

## Object (schema)

Validators: RequiredObject, OptionalObject, NullableObject, OptionalNullableObject

Function: isObject

``` typescript
let objectValidator = new RequiredObject({
  int: new RequiredInteger(0, 10)
})
let errors = objectValidator.validate({
  int: 10
})
```

``` typescript
if (isObject({ int: new RequiredInteger(0, 10) }, { int: 10 })) {
  console.log('Is object')
}
```

## RegexMatch (regex)

Validators: RequiredRegexMatch, OptionalRegexMatch, NullableRegexMatch, OptionalNullableRegexMatch

Function: isRegexMatch

``` typescript
let regexMatchValidator = new RequiredRegexMatch(/^hello$/)
let errors = regexMatchValidator.validate('hello')
```

``` typescript
if (isRegexMatch(/hello/, 'hello')) {
  console.log('Is regex match')
}
```

## Sample (sample)

Validators: RequiredSample, OptionalSample, NullableSample, OptionalNullableSample

Function: isSample

The sample validator will convert a sample to a validator based on types with a few exceptions:

* Integer numbers in the sample with be converted to a IntegerValidator, fx. 1, 10, etc.
* Float numbers in the sample with be converted to a FloatValidator, fx. 1.1, 2.2, etc.
* Strings that validates with the DateTime validator will be converted DateTimeValidator, fx. '2018-08-06T13:37:00Z'


``` typescript
let sampleValidator = new RequiredSample({
  date: '2018-08-06T13:37:00Z'
  key: new RequiredExactString('value')
})
let errors = sampleValidator.validate({
  date: '2018-08-06T13:37:00Z',
  key: 'value'
})
```

``` typescript
let sample = {
  date: '2018-08-06T13:37:00Z'
  key: new RequiredExactString('value')
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
const sampleValidator = new RequiredSample(sample, { optimize })
const errors = sampleValidator.validate(sample)
```

Converting to a normal validator structure:

``` typescript
console.log(`interface MyType ${sampleValidator.toString({ types: true })}`)
console.log(`let myTypeValidator = ${sampleValidator.toString()}`)
```

## String (min, max)

Validators: RequiredString, OptionalString, NullableString, OptionalNullableString

Function: isString

``` typescript
let stringValidator = new RequiredString()
let errors = stringValidator.validate('hello1234')
```

``` typescript
if (isString('hello1234')) {
  console.log('Is string')
}
```

## Undefined

Validators: RequiredUndefined, OptionalUndefined, NullableUndefined

Function: isUndefined

``` typescript
let undefinedValidator = new RequiredUndefined()
let errors = undefinedValidator.validate(undefined)
```

``` typescript
if (isUndefined(undefined)) {
  console.log('Is undefined')
}
```

## Union ([validator, ...])

Validators: RequiredUnion, OptionalUnion, NullableUnion, OptionalNullableUnion

Function: isUnion

The union validator takes a union of validates and validates the value with each of them, it will stop when the first validates and return a positive result. It has a special optimization for a union of ObjectValidators with a shared required ExactString key, it will use the key to figure out what validator to use.

``` typescript
let unionValidator = new RequiredUnion([
  new RequiredInteger(),
  new RequiredString()
])
let errors1 = unionValidator.validate('hello')
let errors2 = unionValidator.validate(10)
```

``` typescript
let union = [
  new RequiredInteger(),
  new RequiredString()
]
if (isSample(union, 10)) {
  console.log('Is union match')
}
```

Example of shared required ExactString key:

``` typescript
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

const messageValidator = new UnionValidator([
  numberMessageValidator,
  stringMessageValidator,
  errorMessageValidator
])

let errors = messageValidator.validate({ type: 'string', value: 'hello' })
```

## EnumValidator([string, ...])

Alias: RequiredEnum, OptionalEnum, NullableEnum, OptionalNullableEnum

The enum validator is a short hand instance of the union validator:

``` typescript
let unionValidator = new RequiredEnum(['hello', 'more'])
let errors1 = unionValidator.validate('hello')
let errors2 = unionValidator.validate(10)
```

## Unknown

Validators: RequiredUnknown, OptionalUnknown

The unknown validator only makes sense to use with another validate like the object validator to require a key even when the type is not known.

``` typescript
let unknownValidator = new RequiredUnknown()
let errors1 = unknownValidator.validate('hello')
let errors2 = unknownValidator.validate(10)
let errors3 = unknownValidator.validate(null)
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
