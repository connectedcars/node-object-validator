import { DoesNotMatchRegexError, RequiredError, ValidationErrorContext } from '../errors'
import { validateString } from './string'

export function validateRegexMatch(value: string, regex: RegExp, context?: ValidationErrorContext): Error | null {
  const stringError = validateString(value, 0, Number.MAX_SAFE_INTEGER, context)
  if (stringError) {
    return stringError
  }
  if (!value.match(regex)) {
    return new DoesNotMatchRegexError(`Did not match '${regex}' (received "${value}")`, context)
  }
  return null
}

export class RequiredRegexMatch {
  private type: 'RequiredRegex' = 'RequiredRegex'
  private regex: RegExp

  public constructor(regex: RegExp) {
    this.regex = regex
  }

  public validate(value: string, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return new RequiredError(`Is required`, context)
    }
    return validateRegexMatch(value, this.regex, context)
  }
}

export class OptionalRegexMatch {
  private type: 'OptionalRegex' = 'OptionalRegex'
  private regex: RegExp

  public constructor(regex: RegExp) {
    this.regex = regex
  }

  public validate(value: string, context?: ValidationErrorContext): Error | null {
    if (value == null) {
      return null
    }
    return validateRegexMatch(value, this.regex, context)
  }
}

export function RegexMatch(regex: RegExp, required?: false): OptionalRegexMatch
export function RegexMatch(regex: RegExp, required: true): RequiredRegexMatch
export function RegexMatch(regex: RegExp, required = false): OptionalRegexMatch | RequiredRegexMatch {
  return required ? new RequiredRegexMatch(regex) : new OptionalRegexMatch(regex)
}
