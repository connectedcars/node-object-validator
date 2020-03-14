import { ValidationErrorContext } from '../../errors'
import { validateString } from './validate-string'

export class OptionalString {
  private type: 'OptionalString' = 'OptionalString'
  private minLength: number
  private maxLength: number

  public constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER) {
    this.minLength = minLength
    this.maxLength = maxLength
  }

  public validate(value: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateString(value, this.minLength, this.maxLength, context)
  }
}
