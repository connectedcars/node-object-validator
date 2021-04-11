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

* Array (Validate an array on type using other validators and min/max length)
* Boolean
* Date
* DateTime (Validate an ISO 8601 date/time string)
* ExactString
* FloatString (Validate a float string on min and max size)
* Float (Validate a float on min and max size)
* IntegerString (Validate a integer string on min and max size)
* Integer (Validate a integer on min and max size)
* Null
* Object  (Validate an object using other validators)
* RegexMatch
* Sample (Validate an input sample mixed with validators)
* String (Validate a string on min and max length)
* Union (Validate a union of validators)
* Unknown

Validation functions:

* .validate(value) : Returns list of errors found in the validation
* .isType(value, listOfErrors) : Type guard for the type
* .isValid(value) : Type guard for the type
* .cast(value) : Returns type or throws ValidationError
* .toString() : Return validator code or TypeScript interface for the validator

Common options:

* Optimized: Create optimized function and use this for validation (default: false)
* Required: Is this validator required (default: true)
* NullCheck: Enable or disable null check (default: true)
* EarlyFail: Return on first error (default: false)

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

```
let arrayValidator = new ArrayValidator(new IntegerValidator(0, 10), 0, 10)
```

## ArrayValidator(validator, min, max, options)

Alias: RequiredArray, OptionalArray

```
let arrayValidator = new ArrayValidator(new IntegerValidator(0, 10), 0, 10)
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
