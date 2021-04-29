import {
  CodeGenResult,
  isValidType,
  ValidatorBase,
  ValidatorBaseOptions,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { DoesNotMatchRegexFail, NotStringFail, RequiredFail, ValidationFailure, WrongLengthFail } from '../errors'
import { validateString } from './string'

export function isRegexMatch<T extends string = string>(value: unknown, regex: RegExp, context?: string): value is T {
  const errors = validateRegexMatch(value, regex, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateRegexMatch(value: unknown, regex: RegExp, context?: string): ValidationFailure[] {
  const stringError = validateString(value, 0, Number.MAX_SAFE_INTEGER, context)
  if (!isValidType<string>(value, stringError)) {
    return stringError
  }
  if (!regex.test(value)) {
    return [new DoesNotMatchRegexFail(`Did not match '${regex}'`, value, context)]
  }
  return []
}

export abstract class RegexMatchValidator<O = never> extends ValidatorBase<string | O> {
  private regex: RegExp

  public constructor(regex: RegExp, options?: ValidatorBaseOptions) {
    super(options)
    this.regex = regex
    if (options?.optimize !== false) {
      this.optimize(regex)
    }
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: string,
    earlyFail?: boolean
  ): CodeGenResult {
    const contextStr = context ? `, \`${context}\`` : ', context'
    const localRegexRef = `regex${id()}`
    const localValueRef = `value${id()}`
    // prettier-ignore
    const declarations: string[] = [
      `const ${localRegexRef} = ${this.regex}`
    ]
    // prettier-ignore
    const code: string[] = [
      `const ${localValueRef} = ${valueRef}`,
      ...this.nullCheckWrap([
      `  if (typeof ${localValueRef} === 'string') {`,
      `    if (!${localRegexRef}.test(${localValueRef})) {`,
      `      errors.push(new DoesNotMatchRegexFail(\`Did not match '${this.regex}'\`, ${localValueRef}${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotStringFail(\`Must be a string\`, ${localValueRef}${contextStr}))`,
      `  }`,
      ], localValueRef, contextStr),
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
        RequiredFail: RequiredFail
      },
      declarations,
      code
    ]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'string'
    }
    const regexStr = `/${this.regex.source}/${this.regex.flags}`
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${regexStr}${optionsStr})`
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateRegexMatch(value, this.regex, context)
  }
}

export class RequiredRegexMatch extends RegexMatchValidator<string> {
  public constructor(regex: RegExp, options?: ValidatorOptions) {
    super(regex, { ...options })
  }
}

export class OptionalRegexMatch extends RegexMatchValidator<undefined> {
  public constructor(regex: RegExp, options?: ValidatorOptions) {
    super(regex, { ...options, required: false })
  }
}

export class NullableRegexMatch extends RegexMatchValidator<null> {
  public constructor(regex: RegExp, options?: ValidatorOptions) {
    super(regex, { ...options, nullable: true })
  }
}

export class OptionalNullableRegexMatch extends RegexMatchValidator<undefined | null> {
  public constructor(regex: RegExp, options?: ValidatorOptions) {
    super(regex, { ...options, required: false, nullable: true })
  }
}
