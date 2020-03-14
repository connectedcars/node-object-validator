import { ValidationErrorContext } from '../../errors'
import { validateDate } from './validate-date'

export class OptionalDate {
  private type: 'OptionalDate' = 'OptionalDate'

  public validate(value: Date, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateDate(value, context)
  }
}
