import { RequiredError, ValidationErrorContext } from '../../errors'
import { validateDate } from './validate-date'

export class RequiredDate {
  private type: 'RequiredDate' = 'RequiredDate'

  public validate(value: Date, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateDate(value, context)
  }
}
