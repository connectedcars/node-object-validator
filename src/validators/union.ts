import { Validator, ValidatorBase, ValidatorOptions } from '../common'
import { RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function isUnion<T>(schema: Validator[], value: unknown, context?: ValidationErrorContext): value is T {
  const errors = validateUnion(schema, value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateUnion(
  schema: Validator[],
  value: unknown,
  context?: ValidationErrorContext
): ValidationFailure[] {
  let errors: ValidationFailure[] = []
  for (const validator of schema) {
    const currentErrors = validator.validate(value, context)
    if (currentErrors.length === 0) {
      return []
    } else if (errors.length === 0) {
      errors = currentErrors
    } else if (currentErrors.length < errors.length) {
      errors = currentErrors
    }
  }
  return errors
}

export class UnionValidator<T, O = never> extends ValidatorBase<T | O> {
  public schema: Validator[]

  public constructor(schema: Validator[], options?: ValidatorOptions) {
    super(options)
    this.schema = schema
    if (options?.optimize) {
      this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateUnion(this.schema, value, context)
  }
}

export class RequiredUnion<T> extends UnionValidator<T> {
  public constructor(schema: Validator[], options?: ValidatorOptions) {
    super(schema, { ...options, required: true })
  }
}

export class OptionalUnion<T> extends UnionValidator<T, undefined | null> {
  public constructor(schema: Validator[], options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}
