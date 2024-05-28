import {
  isValidator,
  ValidateOptions,
  ValidatorBase,
  ValidatorBaseOptions,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { ValidationFailure } from '../errors'
import { RequiredArray } from './array'
import { RequiredBoolean } from './boolean'
import { RequiredDate } from './date'
import { isDateTime, RequiredDateTime } from './datetime'
import { RequiredFloat } from './float'
import { RequiredInteger } from './integer'
import { RequiredNull } from './null'
import { ObjectSchema, RequiredObject } from './object'
import { RequiredRegexMatch } from './regex-match'
import { RequiredString } from './string'
import { OptionalUnknown, RequiredUnknown } from './unknown'

export type Sample =
  | null
  | boolean
  | number
  | string
  | Sample[]
  | Date
  | RegExp
  | ValidatorBase
  | undefined
  | { [prop: string]: Sample | undefined }

export function sampleToValidator(sample: Sample, options?: ValidatorBaseOptions): ValidatorBase {
  if (sample === null) {
    return new RequiredNull(options)
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
          return new RequiredArray(new RequiredUnknown(options))
        } else {
          return new RequiredArray(
            isValidator(sample[0]) ? sample[0] : sampleToValidator(sample[0]),
            0,
            Number.MAX_SAFE_INTEGER,
            options
          )
        }
      } else if (sample instanceof Date) {
        return new RequiredDate(options)
      } else if (sample instanceof RegExp) {
        return new RequiredRegexMatch(sample, options)
      } else {
        const objectSchema: ObjectSchema = {}
        for (const key of Object.keys(sample)) {
          const prop = sample[key]
          objectSchema[key] = sampleToValidator(prop)
        }
        return new RequiredObject(objectSchema, options)
      }
    }
    case 'number': {
      if (Number.isInteger(sample)) {
        return new RequiredInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, options)
      }
      return new RequiredFloat(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, options)
    }
    case 'string': {
      if (isDateTime(sample)) {
        return new RequiredDateTime(options)
      } else {
        return new RequiredString(0, Number.MAX_SAFE_INTEGER, options)
      }
    }
    case 'boolean': {
      return new RequiredBoolean(options)
    }
  }
}

export function isSample<T extends Sample>(sample: T, value: unknown, context?: string): value is SampleWrap<T> {
  const errors = validateSample(sample, value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateSample(
  sample: Sample,
  value: unknown,
  context?: string,
  options?: ValidateOptions
): ValidationFailure[] {
  const validator = sampleToValidator(sample, options)
  return validator.validate(value, context, options)
}

// prettier-ignore
type SampleWrap<O> =
  O extends ValidatorBase ? O['tsType'] :
  O extends number ? number  :
  O extends string ? string  :
  O extends boolean ? boolean : O

export abstract class SampleValidator<T extends Sample = never, O = never> extends ValidatorBase<SampleWrap<T> | O> {
  public schema: T
  private validator: ValidatorBase

  public constructor(sample: T, options?: ValidatorBaseOptions) {
    super(options)
    this.schema = sample
    this.validator = sampleToValidator(this.schema, options)
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types === true) {
      return this.typeString(options)
    } else {
      return this.constructorString()
    }
  }

  protected validateValue(value: unknown, context?: string, options?: ValidateOptions): ValidationFailure[] {
    return this.validator.validate(value, context, { earlyFail: this.earlyFail, ...options })
  }

  private typeString(options?: ValidatorExportOptions): string {
    const language = options?.language ?? 'typescript'
    switch (language) {
      case 'typescript': {
        let typeStr = this.validator.toString(options)

        if (this.required === false) {
          typeStr += ` | undefined`
        }
        if (this.nullable === true) {
          typeStr += ` | null`
        }

        return typeStr
      }
      case 'rust': {
        throw new Error('Rust not supported yet')
      }
      default: {
        throw new Error(`Language: '{}' unknown`)
      }
    }
  }

  private constructorString(): string {
    return `new ${this.constructor.name}(${this.optionsString})`
  }
}

export class RequiredSample<T extends Sample> extends SampleValidator<T> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options })
  }
}

export class OptionalSample<T extends Sample> extends SampleValidator<T, undefined> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}

export class NullableSample<T extends Sample> extends SampleValidator<T, null> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, nullable: true })
  }
}

export class OptionalNullableSample<T extends Sample> extends SampleValidator<T, null | undefined> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, required: false, nullable: true })
  }
}
