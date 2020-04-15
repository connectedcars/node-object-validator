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

export class RegexMatchValidator<O = never> extends ValidatorBase<string | O> {
  private regex: RegExp
  private required: boolean

  public constructor(regex: RegExp, required = true) {
    super()
    this.regex = regex
    this.required = required
  }

  public validate(value: unknown, context?: ValidationErrorContext): Error[] {
    if (value == null) {
      return this.required ? [new RequiredError(`Is required`, context)] : []
    }
    return validateRegexMatch(value, this.regex, context)
  }
}

export class RequiredRegexMatch extends RegexMatchValidator<string> {
  private validatorType: 'RequiredRegex' = 'RequiredRegex'

  public constructor(regex: RegExp) {
    super(regex)
  }
}

export class OptionalRegexMatch extends RegexMatchValidator<undefined | null> {
  private validatorType: 'OptionalRegex' = 'OptionalRegex'

  public constructor(regex: RegExp) {
    super(regex, false)
  }
}

export function RegexMatch(regex: RegExp, required?: false): OptionalRegexMatch
export function RegexMatch(regex: RegExp, required: true): RequiredRegexMatch
export function RegexMatch(regex: RegExp, required = false): OptionalRegexMatch | RequiredRegexMatch {
  return required ? new RequiredRegexMatch(regex) : new OptionalRegexMatch(regex)
}
