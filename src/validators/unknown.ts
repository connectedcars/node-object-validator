import { ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import { ValidationErrorContext, ValidationFailure } from '../errors'

export class UnknownValidator<O = never> extends ValidatorBase<O> {
  public constructor(options?: ValidatorOptions) {
    super(options)
    if (options?.optimize) {
      this.optimize()
    }
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'unknown'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected validateValue(_value: unknown, _context?: ValidationErrorContext): ValidationFailure[] {
    return []
  }
}

export class RequiredUnknown extends UnknownValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: true })
  }
}

export class OptionalUnknown extends UnknownValidator<undefined | null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}
