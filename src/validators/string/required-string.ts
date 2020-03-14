import { RequiredError, ValidationErrorContext } from '../../errors'
import { validateString } from './validate-string'

export class RequiredString {
  private type: 'RequiredString' = 'RequiredString'
  private minLength: number
  private maxLength: number

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateString(value, this.minLength, this.maxLength, context)
  }
}
