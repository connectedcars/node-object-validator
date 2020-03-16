import { ValidatorBase } from '../common'
import { RequiredError, ValidationErrorContext } from '../errors'
import { ObjectSchema, Validator } from '../types'

export function validateObject(value: unknown, context?: ValidationErrorContext): Error | null {
  // TODO: Validate that something is an object
  return null
}

export class RequiredObject<T extends ObjectSchema = ObjectSchema> extends ValidatorBase implements Validator {
  public schema: T
  private type: 'RequiredObject' = 'RequiredObject'

  public constructor(schema: T) {
    super()
    this.schema = schema
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateObject(value, context)
  }
}

export class OptionalObject<T extends ObjectSchema = ObjectSchema> extends ValidatorBase implements Validator {
  public schema: T
  private type: 'OptionalObject' = 'OptionalObject'

  public constructor(schema: T) {
    super()
    this.schema = schema
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return null
    }
    return validateObject(value, context)
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
