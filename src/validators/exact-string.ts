import { NotExactStringError, RequiredError, ValidationErrorContext } from '../errors'

export function validateExactString(
  value: string,
  expectedStr: string,
  context?: ValidationErrorContext<string>
): Error | null {
  if (value !== expectedStr) {
    return new NotExactStringError(`Must strictly equal "${expectedStr}" (received "${value}")`, context)
  }
  return null
}

export class RequiredExactString {
  private type: 'RequiredExactString' = 'RequiredExactString'
  private expectedStr: string

  public constructor(expectedStr: string) {
    this.expectedStr = expectedStr
  }

  public validate(value: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateExactString(value, this.expectedStr, context)
  }
}

export class OptionalExactString {
  private type: 'OptionalExactString' = 'OptionalExactString'
  private expectedStr: string

  public constructor(expectedStr: string) {
    this.expectedStr = expectedStr
  }

  public validate(value: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateExactString(value, this.expectedStr, context)
  }
}

export function ExactString(expectedStr: string, required?: false): OptionalExactString
export function ExactString(expectedStr: string, required: true): RequiredExactString
export function ExactString(expectedStr: string, required = false): OptionalExactString | RequiredExactString {
  return required ? new RequiredExactString(expectedStr) : new OptionalExactString(expectedStr)
}
