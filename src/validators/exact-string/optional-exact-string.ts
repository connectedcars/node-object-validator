import { ValidationErrorContext } from '../../errors'
import { validateExactString } from './validate-exact-string'

export class OptionalExactString {
  private type: 'OptionalExactString' = 'OptionalExactString'

  public validate(value: string, expectedStr: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateExactString(value, expectedStr, context)
  }
}
