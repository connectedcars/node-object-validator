export interface ValidationErrorContext {
  key: string
}

export class ValidationFailure {
  public key?: string
  public get message(): string {
    return this.key
      ? `Field '${this.key}' ${this._message.charAt(0).toLowerCase() + this._message.slice(1)}`
      : this._message
  }
  private _message: string

  public constructor(message: string, context?: ValidationErrorContext) {
    this._message = message
    this.key = context?.key
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
  }
}

export class RequiredFail extends ValidationFailure {}
export class NotStringFail extends ValidationFailure {}
export class WrongLengthFail extends ValidationFailure {}
export class NotDateFail extends ValidationFailure {}
export class NotRfc3339Fail extends ValidationFailure {}
export class NotExactStringFail extends ValidationFailure {}
export class NotFloatFail extends ValidationFailure {}
export class NotIntegerFail extends ValidationFailure {}
export class NotArrayFail extends ValidationFailure {}
export class NotObjectFail extends ValidationFailure {}
export class DoesNotMatchRegexFail extends ValidationFailure {}
export class OutOfRangeFail extends ValidationFailure {}
