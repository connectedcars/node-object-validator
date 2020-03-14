import { RequiredError, ValidationErrorContext } from '../../errors'
import { validateExactString } from './validate-exact-string'

export class RequiredExactString {
  private type: 'RequiredExactString' = 'RequiredExactString'

  public validate(value: string, expectedStr: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateExactString(value, expectedStr, context)
  }
}
