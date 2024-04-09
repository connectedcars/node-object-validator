export class ValidationFailure {
  public context?: string
  public value: unknown
  private _message: string

  public constructor(message: string, value: unknown, context?: string) {
    this._message = message
    this.value = value
    this.context = context
  }

  public get message(): string {
    return (
      (this.context
        ? `Field '${this.context}' ${this._message.charAt(0).toLowerCase() + this._message.slice(1)}`
        : this._message) + (this.value === undefined ? '' : ` (received "${this.value}")`)
    )
  }

  public toString(): string {
    return `${this.constructor.name}: ${this.message}`
  }
}

export class ValidationsError extends Error {
  public errors: ValidationFailure[]
  public constructor(message: string, errors: ValidationFailure[]) {
    super(message)
    this.errors = errors
    this.name = this.constructor.name
  }
}

export class DoesNotMatchRegexFail extends ValidationFailure {}
export class NotArrayFail extends ValidationFailure {}
export class NotDateFail extends ValidationFailure {}
export class NotDatetimeOrDateFail extends ValidationFailure {}
export class NotExactStringFail extends ValidationFailure {}
export class NotFloatFail extends ValidationFailure {}
export class NotFloatOrFloatStringFail extends ValidationFailure {}
export class NotFloatStringFail extends ValidationFailure {}
export class NotIntegerFail extends ValidationFailure {}
export class NotIntegerOrIntegerStringFail extends ValidationFailure {}
export class NotIntegerStringFail extends ValidationFailure {}
export class NotObjectFail extends ValidationFailure {}
export class NotRfc3339Fail extends ValidationFailure {}
export class NotStringFail extends ValidationFailure {}
export class OutOfRangeFail extends ValidationFailure {}
export class RequiredFail extends ValidationFailure {}
export class WrongLengthFail extends ValidationFailure {}
export class UnionFail extends ValidationFailure {
  public errors: ValidationFailure[]
  public constructor(message: string, errors: ValidationFailure[], value: unknown, context?: string) {
    super(message, value, context)
    this.errors = errors
  }
}
export class NotBooleanFail extends ValidationFailure {}
export class NotNullFail extends ValidationFailure {}
export class NotUndefinedFail extends ValidationFailure {}
export class NotBufferFail extends ValidationFailure {}
