import { isObject, ValidatorBase } from '../common'
import { NotObjectError, RequiredError, ValidationErrorContext } from '../errors'
import { validate } from '../object-validator'
import { ObjectSchema } from '../types'

export function validateObject<T extends ObjectSchema = ObjectSchema>(
  schema: RequiredObject<T> | OptionalObject<T>,
  value: unknown,
  context?: ValidationErrorContext
): Error[] {
  const errors: Error[] = []
  if (!isObject(value)) {
    errors.push(new NotObjectError(`Must be an object (received "${value}")`, context))
    return errors
  }

  for (const key of Object.keys(schema.schema)) {
    // TODO Add parent context
    const validator = schema.schema[key]
    const err = validator.validate(value[key], { key: `${key}`, value: value[key] })
    if (err) {
      errors.push(...err)
    }
  }
  return validate(schema, value, { key: '', value: value, ...context })
}

export class RequiredObject<T extends ObjectSchema = ObjectSchema> extends ValidatorBase {
  public schema: T
  private type: 'RequiredObject' = 'RequiredObject'

  public constructor(schema: T) {
    super()
    this.schema = schema
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] | null {
    if (value == null) {
      return [new RequiredError(`Is required`, context)]
    }
    return validateObject(this, value, context)
  }
}

export class OptionalObject<T extends ObjectSchema = ObjectSchema> extends ValidatorBase {
  public schema: T
  private type: 'OptionalObject' = 'OptionalObject'

  public constructor(schema: T) {
    super()
    this.schema = schema
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return []
    }
    return validateObject(this, value, context)
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
