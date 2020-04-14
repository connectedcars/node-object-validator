import { isObject, ValidatorBase } from '../common'
import { NotObjectError, RequiredError, ValidationErrorContext, ValidationsError } from '../errors'
import { ObjectSchema, SchemaToType } from '../types'

export function validateObject<T extends ObjectSchema = ObjectSchema>(
  schema: RequiredObject<T> | OptionalObject<T> | ObjectValidator<T>,
  value: unknown,
  context?: ValidationErrorContext
): Error[] {
  const errors: Error[] = []
  if (!isObject(value)) {
    errors.push(new NotObjectError(`Must be an object (received "${value}")`, context))
    return errors
  }
  for (const key of Object.keys(schema.schema)) {
    const validator = schema.schema[key]
    const keyName = context?.key ? `${context.key}['${key}']` : key
    errors.push(...validator.validate(value[key], { key: keyName, value: value[key] }))
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
export class ObjectValidator<T extends ObjectSchema = ObjectSchema> extends ValidatorBase {
  public schema: T
  public schemaType!: SchemaToType<T>
  private required: boolean

  public constructor(schema: T, required = false) {
    super()
    this.schema = schema
    this.required = required
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return this.required ? [new RequiredError(`Is required`, context)] : []
    }
    return validateObject(this, value, context)
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

export class RequiredObject<T extends ObjectSchema = ObjectSchema> extends ObjectValidator<T> {
  private type: 'RequiredObject' = 'RequiredObject'
  public constructor(schema: T) {
    super(schema, true)
  }
}

export class OptionalObject<T extends ObjectSchema = ObjectSchema> extends ObjectValidator<T> {
  private type: 'OptionalObject' = 'OptionalObject'
  public constructor(schema: T) {
    super(schema, false)
  }
}

export function TypedObject<T extends ObjectSchema = ObjectSchema>(
  schema: ObjectSchema,
  required?: false
): OptionalObject<T>
export function TypedObject<T extends ObjectSchema = ObjectSchema>(
  schema: ObjectSchema,
  required: true
): RequiredObject<T>
export function TypedObject<T extends ObjectSchema = ObjectSchema>(
  schema: T,
  required = false
): OptionalObject<T> | RequiredObject<T> {
  return required ? new RequiredObject(schema) : new OptionalObject(schema)
}
