import {
  isValidator,
  ValidateOptions,
  Validator,
  ValidatorBase,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { ValidationErrorContext, ValidationFailure } from '../errors'
import { ArrayValidator } from './array'
import { BooleanValidator } from './boolean'
import { DateValidator } from './date'
import { DateTimeValidator, isDateTime } from './datetime'
import { FloatValidator } from './float'
import { IntegerValidator } from './integer'
import { NullValidator } from './null'
import { ObjectValidator } from './object'
import { RegexMatchValidator } from './regex-match'
import { StringValidator } from './string'
import { OptionalUnknown, UnknownValidator } from './unknown'

export type Sample =
  | null
  | boolean
  | number
  | string
  | Sample[]
  | Date
  | RegExp
  | Validator
  | undefined
  | { [prop: string]: Sample | undefined }

export function sampleToValidator(sample: Sample, options?: ValidatorOptions): Validator {
  if (sample === null) {
    return new NullValidator(options)
  }
  if (isValidator(sample)) {
    return sample
  }

  switch (typeof sample) {
    case 'undefined': {
      return new OptionalUnknown(options)
    }
    case 'object': {
      if (Array.isArray(sample)) {
        if (sample.length === 0) {
          return new ArrayValidator(new UnknownValidator(options))
        } else {
          return new ArrayValidator(
            isValidator(sample[0]) ? sample[0] : sampleToValidator(sample[0]),
            0,
            Number.MAX_SAFE_INTEGER,
            options
          )
        }
      } else if (sample instanceof Date) {
        return new DateValidator(options)
      } else if (sample instanceof RegExp) {
        return new RegexMatchValidator(sample, options)
      } else {
        const objectSchema: Record<string, Validator> = {}
        for (const key of Object.keys(sample)) {
          const prop = sample[key]
          objectSchema[key] = sampleToValidator(prop)
        }
        return new ObjectValidator(objectSchema, options)
      }
    }
    case 'number': {
      if (Number.isInteger(sample)) {
        return new IntegerValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, options)
      }
      return new FloatValidator(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, options)
    }
    case 'string': {
      if (isDateTime(sample)) {
        return new DateTimeValidator(options)
      } else {
        return new StringValidator(0, Number.MAX_SAFE_INTEGER, options)
      }
    }
    case 'boolean': {
      return new BooleanValidator(options)
    }
  }
}

export function isSample<T>(sample: Sample, value: unknown, context?: ValidationErrorContext): value is T {
  const errors = validateSample(sample, value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateSample(
  sample: Sample,
  value: unknown,
  context?: ValidationErrorContext,
  options?: ValidateOptions
): ValidationFailure[] {
  const validator = sampleToValidator(sample, options)
  return validator.validate(value, context, options)
}

export class SampleValidator<T, O = never> extends ValidatorBase<T | O> {
  public schema: Sample
  private validator: Validator

  public constructor(sample: Sample, options?: ValidatorOptions) {
    super(options)
    this.schema = sample
    this.validator = sampleToValidator(this.schema, options)
  }

  public toString(options?: ValidatorExportOptions): string {
    return this.validator.toString(options)
  }

  protected validateValue(
    value: unknown,
    context?: ValidationErrorContext,
    options?: ValidateOptions
  ): ValidationFailure[] {
    return this.validator.validate(value, context, { earlyFail: this.earlyFail, ...options })
  }
}

export class RequiredSample<T> extends SampleValidator<T> {
  public constructor(schema: Sample, options?: ValidatorOptions) {
    super(schema, { ...options, required: true })
  }
}

export class OptionalSample<T> extends SampleValidator<T, null | undefined> {
  public constructor(schema: Sample, options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}
