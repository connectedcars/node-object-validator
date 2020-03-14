import { DoesNotMatchRegexError, RequiredError, ValidationErrorContext } from '../errors'
import { validateString } from './string'

export function validateRegex(value: string, regex: RegExp, context?: ValidationErrorContext<string>): Error | null {
  const stringError = validateString(value, 0, Number.MAX_SAFE_INTEGER, context)
  if (stringError) {
    return stringError
  }
  if (!value.match(regex)) {
    return new DoesNotMatchRegexError(`Did not match '${regex}' (received "${value}")`, context)
  }
  return null
}

export class RequiredRegex {
  private type: 'RequiredRegex' = 'RequiredRegex'
  private regex: RegExp

  public constructor(regex: RegExp) {
    this.regex = regex
  }

  public validate(value: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateRegex(value, this.regex, context)
  }
}

export class OptionalRegex {
  private type: 'OptionalRegex' = 'OptionalRegex'
  private regex: RegExp

  public constructor(regex: RegExp) {
    this.regex = regex
  }

  public validate(value: string, context?: ValidationErrorContext<string>): Error | null {
    if (value == null) {
      return null
    }
    return validateRegex(value, this.regex, context)
  }
}
