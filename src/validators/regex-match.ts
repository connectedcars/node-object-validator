import { CodeGenResult, isValidType, ValidatorBase, ValidatorOptions } from '../common'
import {
  DoesNotMatchRegexFail,
  NotStringFail,
  RequiredFail,
  ValidationErrorContext,
  ValidationFailure,
  WrongLengthFail
} from '../errors'
import { validateString } from './string'

export function isRegexMatch<T extends string>(
  value: unknown,
  regex: RegExp,
  context?: ValidationErrorContext
): value is T {
  const errors = validateRegexMatch(value, regex, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateRegexMatch(
  value: unknown,
  regex: RegExp,
  context?: ValidationErrorContext
): ValidationFailure[] {
  const stringError = validateString(value, 0, Number.MAX_SAFE_INTEGER, context)
  if (!isValidType<string>(value, stringError)) {
    return stringError
  }
  if (!regex.test(value)) {
    return [new DoesNotMatchRegexFail(`Did not match '${regex}' (received "${value}")`, context)]
  }
  return []
}

export class RegexMatchValidator<O = never> extends ValidatorBase<string | O> {
  private regex: RegExp

  public constructor(regex: RegExp, options?: ValidatorOptions) {
    super(options)
    this.regex = regex
    if (options?.optimize) {
      this.optimize()
    }
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: ValidationErrorContext,
    earlyFail?: boolean
  ): CodeGenResult {
    const contextStr = context ? `, { key: \`${context.key}\` }` : ', context'
    const localRegexRef = `regex${id()}`
    const localValueRef = `value${id()}`
    // prettier-ignore
    const declarations: string[] = [
      `const ${localRegexRef} = ${this.regex}`
    ]
    // prettier-ignore
    const code: string[] = [
      `const ${localValueRef} = ${valueRef}`,
      `if (${localValueRef} != null) {`,
      `  if (typeof ${localValueRef} === 'string') {`,
      `    if (!${localRegexRef}.test(${localValueRef})) {`,
      `      errors.push(new DoesNotMatchRegexFail(\`Did not match '${this.regex}' (received "\${${localValueRef}}")\`${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotStringFail(\`Must be a string (received "\${${localValueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
      '}',
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),

    ]
    return [
      {
        DoesNotMatchRegexFail: DoesNotMatchRegexFail,
        WrongLengthFail: WrongLengthFail,
        NotStringFail: NotStringFail,
        RequiredError: RequiredFail
      },
      declarations,
      code
    ]
  }

  protected validateValue(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    return validateRegexMatch(value, this.regex, context)
  }
}

export class RequiredRegexMatch extends RegexMatchValidator<string> {
  public constructor(regex: RegExp, options?: ValidatorOptions) {
    super(regex, { ...options, required: true })
  }
}

export class OptionalRegexMatch extends RegexMatchValidator<undefined | null> {
  public constructor(regex: RegExp, options?: ValidatorOptions) {
    super(regex, { ...options, required: false })
  }
}
