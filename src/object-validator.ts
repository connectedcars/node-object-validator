import { isObject, ValidatorBase } from './common'
import { NotArrayError, NotObjectError, ValidationErrorContext, ValidationsError } from './errors'
import { ObjectSchema, SchemaToType, ValidatorTypes } from './types'
import { OptionalArray, RequiredArray } from './validators/array'
import { OptionalObject, RequiredObject } from './validators/object'

function validate(schema: ValidatorTypes, value: unknown, parentContext?: ValidationErrorContext): Error[] {
  const errors: Error[] = []
  if (schema instanceof RequiredArray || schema instanceof OptionalArray) {
    if (!Array.isArray(value)) {
      errors.push(new NotArrayError(`Must be an array (received "${value}")`, parentContext))
      return errors
    }
    for (const item of value as Array<unknown>) {
      errors.push(...validate(schema.schema, item, parentContext))
    }
  } else if (schema instanceof RequiredObject || schema instanceof OptionalObject) {
    if (!isObject(value)) {
      errors.push(new NotObjectError(`Must be an object (received "${value}")`, parentContext))
      return errors
    }
    for (const key of Object.keys(schema.schema)) {
      const context = { key: key, value: value[key] }
      errors.push(...validate(schema.schema[key], value[key], context))
    }
  } else if (schema instanceof ValidatorBase) {
    const err = schema.validate(value, parentContext)
    if (err) {
      errors.push(err)
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
    return validate(new RequiredObject(this.schema), obj, { key: '.', value: obj })
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
