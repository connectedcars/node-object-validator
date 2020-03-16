import { isObject, isObjectSchema, ValidatorBase } from './common'
import { NotObjectError, ValidationErrorContext, ValidationsError } from './errors'
import { ObjectSchema, Schema, SchemaToType } from './types'
import { OptionalArray, RequiredArray } from './validators/array'
import { OptionalObject, RequiredObject } from './validators/object'

function validate(schema: Schema, value: unknown, parentContext?: ValidationErrorContext): Error[] {
  const errors: Error[] = []

  if (schema instanceof RequiredArray || schema instanceof OptionalArray) {
    const validator = schema
    for (const item of value as Array<unknown>) {
      errors.push(...validate(validator.schema, item, parentContext))
    }
  } else if (schema instanceof ValidatorBase) {
    const validator = schema
    const err = validator.validate(value, parentContext)
    if (err) {
      errors.push(err)
    }
  } else if (isObjectSchema(schema)) {
    if (!isObject(value)) {
      errors.push(new NotObjectError('Must be an object', parentContext))
      return errors
    }
    for (const key of Object.keys(schema)) {
      const validator = schema[key]
      const context = { key: key, value: value[key] }
      const err = validator.validate(value[key], context)
      if (err) {
        errors.push(err)
      } else if (key in value) {
        if (validator instanceof RequiredObject || validator instanceof OptionalObject) {
          errors.push(...validate(validator.schema, value[key], context))
        } else if (validator instanceof RequiredArray || validator instanceof OptionalArray) {
          for (const item of value[key] as Array<unknown>) {
            errors.push(...validate(validator.schema, item, context))
          }
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
export class ObjectValidator<T extends ObjectSchema> {
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

  public isType(obj: unknown, errors: Error[]): obj is SchemaToType<T> {
    return errors.length === 0
  }

  public cast(obj: unknown): SchemaToType<T> {
    const errors = this.validate(obj)
    if (this.isType(obj, errors)) {
      return obj
    } else {
      throw new ValidationsError('One of more validations failed', errors)
    }
  }
}
