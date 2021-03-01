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
  private required: boolean

  public constructor(regex: RegExp, options?: ValidatorOptions) {
    super()
    this.regex = regex
    const mergedOptions = { required: true, optimize: true, ...options }
    this.required = mergedOptions.required
    if (mergedOptions.optimize) {
      this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateRegexMatch(value, this.regex, context)
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: ValidationErrorContext
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
        '}'
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
}

export class RequiredRegexMatch extends RegexMatchValidator<string> {
  private validatorType: 'RequiredRegex' = 'RequiredRegex'

  public constructor(regex: RegExp, options?: ValidatorOptions) {
    super(regex, { ...options, required: true })
  }
}

export class OptionalRegexMatch extends RegexMatchValidator<undefined | null> {
  private validatorType: 'OptionalRegex' = 'OptionalRegex'

  public constructor(regex: RegExp, options?: ValidatorOptions) {
    super(regex, { ...options, required: false })
  }
}
