import { ValidatorBase } from '../common'
import { NotExactStringError, RequiredError, ValidationErrorContext } from '../errors'

export function validateExactString(value: unknown, expected: string, context?: ValidationErrorContext): Error[] {
  if (value !== expected) {
    return [new NotExactStringError(`Must strictly equal "${expected}" (received "${value}")`, context)]
  }
  return []
}

export class ExactStringValidator<O = never> extends ValidatorBase<string | O> {
  private expected: string
  private required: boolean

  public constructor(expected: string, required = false) {
    super()
    this.required = required
    this.expected = expected
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return this.required ? [new RequiredError(`Is required`, context)] : []
    }
    return validateExactString(value, this.expected, context)
  }
}

export class RequiredExactString extends ExactStringValidator {
  private validatorType: 'RequiredExactString' = 'RequiredExactString'

  public constructor(expected: string) {
    super(expected, true)
  }
}

export class OptionalExactString extends ExactStringValidator<undefined | null> {
  private validatorType: 'OptionalExactString' = 'OptionalExactString'

  public constructor(expected: string) {
    super(expected, false)
  }
}

export function ExactString(expectedStr: string, required?: false): OptionalExactString
export function ExactString(expectedStr: string, required: true): RequiredExactString
export function ExactString(expectedStr: string, required = false): OptionalExactString | RequiredExactString {
  return required ? new RequiredExactString(expectedStr) : new OptionalExactString(expectedStr)
}
