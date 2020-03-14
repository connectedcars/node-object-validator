import { RequiredError, ValidationErrorContext } from '../../errors'
import { validateDateTime } from './validate-datetime'

export class RequiredDateTime {
  private type: 'RequiredDateTime' = 'RequiredDateTime'

  public validate(value: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateDateTime(value, context)
  }
}
