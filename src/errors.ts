export interface ValidationErrorContext<T> {
  key: string
  value: T
}

export class ValidationError<T> extends Error {
  public key?: string
  public value?: T
  public constructor(message: string, context?: ValidationErrorContext<T>) {
    if (context) {
      message = `Field '${context.key}' ${message.charAt(0).toLowerCase() + message.slice(1)}`
    }
    super(message)
    this.key = context?.key
    this.value = context?.value
  }
}

export class RequiredError extends ValidationError<string> {}
export class NotStringError extends ValidationError<string> {}
export class WrongLengthError extends ValidationError<string> {}
