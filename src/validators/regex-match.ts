import { isValidType, ValidatorBase } from '../common'
import { DoesNotMatchRegexError, RequiredError, ValidationErrorContext } from '../errors'
import { validateString } from './string'

export function validateRegexMatch(value: unknown, regex: RegExp, context?: ValidationErrorContext): Error[] {
  const stringError = validateString(value, 0, Number.MAX_SAFE_INTEGER, context)
  if (!isValidType<string>(value, stringError)) {
    return stringError
  }
  if (!value.match(regex)) {
    return [new DoesNotMatchRegexError(`Did not match '${regex}' (received "${value}")`, context)]
  }
  return []
}

export class RequiredRegexMatch extends ValidatorBase {
  private type: 'RequiredRegex' = 'RequiredRegex'
  private regex: RegExp

  public constructor(regex: RegExp) {
    super()
    this.regex = regex
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return [new RequiredError(`Is required`, context)]
    }
    return validateRegexMatch(value, this.regex, context)
  }
}

export class OptionalRegexMatch extends ValidatorBase {
  private type: 'OptionalRegex' = 'OptionalRegex'
  private regex: RegExp

  public constructor(regex: RegExp) {
    super()
    this.regex = regex
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return []
    }
    return validateRegexMatch(value, this.regex, context)
  }
}

export function RegexMatch(regex: RegExp, required?: false): OptionalRegexMatch
export function RegexMatch(regex: RegExp, required: true): RequiredRegexMatch
export function RegexMatch(regex: RegExp, required = false): OptionalRegexMatch | RequiredRegexMatch {
  return required ? new RequiredRegexMatch(regex) : new OptionalRegexMatch(regex)
}
