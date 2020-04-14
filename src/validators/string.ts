import { ValidatorBase } from '../common'
import { NotStringError, RequiredError, ValidationErrorContext, WrongLengthError } from '../errors'

export function validateString(
  value: unknown,
  minLength = 0,
  maxLength: number = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): Error[] {
  if (typeof value !== 'string') {
    return [new NotStringError(`Must be a string (received "${value}")`, context)]
  }
  if ((minLength !== 0 && value.length < minLength) || value.length > maxLength) {
    return [
      new WrongLengthError(
        `Must contain between ${minLength} and ${maxLength} characters (received "${value}")`,
        context
      )
    ]
  }
  return []
}

export class StringValidator<O = never> extends ValidatorBase<string | O> {
  private minLength: number
  private maxLength: number
  private required: boolean

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, required = true) {
    super()
    this.minLength = minLength
    this.maxLength = maxLength
    this.required = required
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return this.required ? [new RequiredError(`Is required`, context)] : []
    }
    return validateString(value, this.minLength, this.maxLength, context)
  }
}

export class RequiredString extends StringValidator {
  private type: 'RequiredString' = 'RequiredString'

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    super(minLength, maxLength)
  }
}

export class OptionalString extends StringValidator<undefined | null> {
  private type: 'OptionalString' = 'OptionalString'

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    super(minLength, maxLength, false)
  }
}

export function StringValue(minLength: number, maxLength: number, required?: false): OptionalString
export function StringValue(minLength: number, maxLength: number, required: true): RequiredString
export function StringValue(
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  required = false
): OptionalString | RequiredString {
  return required ? new RequiredString(minLength, maxLength) : new OptionalString(minLength, maxLength)
}
