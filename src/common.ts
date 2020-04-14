import { ValidationErrorContext, ValidationsError } from './errors'
import { ObjectSchema, ValidatorTypes } from './types'

export function isValidType<T>(value: unknown, errors: Error[]): value is T {
  return errors.length === 0
}

export abstract class ValidatorBase<T> {
  public schema?: ValidatorTypes | ObjectSchema

  public isValid(obj: unknown): obj is T {
    const errors = this.validate(obj)
    return errors.length === 0
  }

  public isType(obj: unknown, errors: Error[]): obj is T {
    return errors.length === 0
  }

  public cast(obj: unknown): T {
    const errors = this.validate(obj)
    if (this.isType(obj, errors)) {
      return obj
    } else {
      throw new ValidationsError('One of more validations failed', errors)
    }
  }

  public abstract validate(value: unknown, context?: ValidationErrorContext): Error[]
}
