import { ValidationErrorContext } from '../../errors'
import { validateDateTime } from './validate-datetime'

export class OptionalDateTime {
  private type: 'OptionalDateTime' = 'OptionalDateTime'

  public validate(value: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateDateTime(value, context)
  }
}
