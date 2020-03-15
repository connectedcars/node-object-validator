import { RequiredError, ValidationErrorContext } from '../errors'
import { Schema } from './common'

export function validateObject<T extends {}>(value: T | unknown, context?: ValidationErrorContext): Error | null {
  // TODO: Validate that something is an object
  return null
}

export class RequiredObject<T extends Schema> {
  public schema: T
  private type: 'RequiredObject' = 'RequiredObject'

  public constructor(schema: T) {
    this.schema = schema
  }

  public validate(value: {} | unknown, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateObject(value, context)
  }
}

export class OptionalObject<T extends Schema> {
  public schema: T
  private type: 'OptionalObject' = 'OptionalObject'

  public constructor(schema: T) {
    this.schema = schema
  }

  public validate(value: {} | unknown, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return null
    }
    return validateObject(value, context)
  }
}

export function NestedObject<T extends Schema>(schema: Schema, required?: false): OptionalObject<T>
export function NestedObject<T extends Schema>(schema: Schema, required: true): RequiredObject<T>
export function NestedObject<T extends Schema>(schema: T, required = false): OptionalObject<T> | RequiredObject<T> {
  return required ? new RequiredObject(schema) : new OptionalObject(schema)
}
