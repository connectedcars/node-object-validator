export interface ValidationErrorContext {
  key: string
  value: unknown
}

export class ValidationError extends Error {
  public key?: string
  public value?: unknown
  public constructor(message: string, context?: ValidationErrorContext) {
    if (context) {
      message = `Field '${context.key}' ${message.charAt(0).toLowerCase() + message.slice(1)}`
    }
    super(message)
    this.key = context?.key
    this.value = context?.value
  }
}

export class ValidationsError extends Error {
  public errors: Error[]
  public constructor(message: string, errors: Error[]) {
    super(message)
    this.errors = errors
  }
}

export class RequiredError extends ValidationError {}
export class NotStringError extends ValidationError {}
export class WrongLengthError extends ValidationError {}
export class NotDateError extends ValidationError {}
export class NotRfc3339Error extends ValidationError {}
export class NotExactStringError extends ValidationError {}
export class NotFloatError extends ValidationError {}
export class NotIntegerError extends ValidationError {}
export class NotArrayError extends ValidationError {}
export class NotObjectError extends ValidationError {}
export class DoesNotMatchRegexError extends ValidationError {}
export class OutOfRangeError extends ValidationError {}
