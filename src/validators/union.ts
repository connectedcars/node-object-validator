import { Validator, ValidatorBase, ValidatorOptions } from '../common'
import { RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function validateUnion(
  schema: Validator[],
  value: unknown,
  context?: ValidationErrorContext
): ValidationFailure[] {
  return []
}

export class UnionValidator<T, O = never> extends ValidatorBase<T | O> {
  public schema: Validator[]
  private required: boolean

  public constructor(schema: Validator[], options?: ValidatorOptions) {
    super()
    this.schema = schema
    const mergedOptions = { required: true, optimize: true, ...options }
    this.required = mergedOptions.required
    if (mergedOptions.optimize) {
      this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateUnion(this.schema, value, context)
  }
}
