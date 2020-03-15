import { NotObjectError, ValidationErrorContext, ValidationsError } from './errors'
import { SchemaToType } from './types'
import { OptionalArray, RequiredArray } from './validators/array'
import { Schema } from './validators/common'
import { OptionalObject, RequiredObject } from './validators/object'

function isObject(value: unknown): value is { [key: string]: unknown } {
  return value !== null && typeof value === 'object'
}

export function validate(schema: Schema, obj: unknown, context: ValidationErrorContext): Error[] {
  const errors: Error[] = []

  // TODO: Add context

  if (!isObject(obj)) {
    errors.push(new NotObjectError('Not an object', context))
    return errors
  }

  for (const key of Object.keys(schema)) {
    const context = { key: key, value: obj[key] }
    const validator = schema[key]
    const err = validator.validate(obj[key], context)
    if (err) {
      errors.push(err)
    } else if (key in obj) {
      if (validator instanceof RequiredObject || validator instanceof OptionalObject) {
        errors.push(...validate(validator.schema, obj[key], context))
      } else if (validator instanceof RequiredArray || validator instanceof OptionalArray) {
        for (const item of obj[key] as Array<unknown>) {
          errors.push(...validate(validator.schema, item, context))
        }
      }
    }
  }
  return errors
}

export type ObjectValidatorOptions = {
  /**
   * Generate an optimized function for doing the validation (default: true)
   */
  optimize?: boolean
  /**
   * Write the optimized function to a file and reuse this if it exists, no cache invalidation is done (Not recommended)
   */
  cacheFile?: boolean
}

/**
 * @typedef ObjectValidatorOptions
 * @property {boolean} [optimize=true] Generate an optimized function for doing the validation (default: true)
 * @property {boolean} [cacheFile] Write the optimized function to a file and reuse this if it exists, no cache invalidation is done (Not recommended)
 */
export class ObjectValidator<T extends Schema> {
  public type!: SchemaToType<T>
  private schema: T
  private options: ObjectValidatorOptions

  public constructor(schema: T, options?: ObjectValidatorOptions) {
    this.schema = schema
    this.options = {
      optimize: false,
      cacheFile: false,
      ...options
    }
  }

  public validate(obj: unknown): Error[] {
    return validate(this.schema, obj, { key: '.', value: obj })
  }

  public isValid(obj: unknown): obj is SchemaToType<T> {
    const errors = this.validate(obj)
    return errors.length === 0
  }

  public isValidErrors(obj: unknown, errors: Error[]): obj is SchemaToType<T> {
    return errors.length === 0
  }

  public cast(obj: unknown): SchemaToType<T> {
    const errors = this.validate(obj)
    if (this.isValidErrors(obj, errors)) {
      return obj
    } else {
      throw new ValidationsError('One of more validations failed', errors)
    }
  }
}
