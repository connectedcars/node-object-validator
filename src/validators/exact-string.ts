import { CodeGenResult, ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotExactStringFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function isExactString<T extends string>(
  value: unknown,
  expected: T,
  context?: ValidationErrorContext
): value is T {
  const errors = validateExactString(value, expected, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateExactString(
  value: unknown,
  expected: string,
  context?: ValidationErrorContext
): ValidationFailure[] {
  if (value !== expected) {
    return [new NotExactStringFail(`Must strictly equal "${expected}" (received "${value}")`, context)]
  }
  return []
}

export class ExactStringValidator<O = never> extends ValidatorBase<string | O> {
  private expected: string

  public constructor(expected: string, options?: ValidatorOptions) {
    super(options)
    this.expected = expected
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
    const expectedStr = JSON.stringify(this.expected)
    const contextStr = context ? `, { key: \`${context.key}\` }` : ', context'
    const localValueRef = `value${id()}`
    const declarations: string[] = []
    // prettier-ignore
    const code = [
      `const ${localValueRef} = ${valueRef}`,
      `if (${localValueRef} != null) {`,
      `  if (${localValueRef} !== ${expectedStr}) {`,
      `    errors.push(new NotExactStringError(\`Must strictly equal ${expectedStr} (received "\${${localValueRef}}")\`${contextStr}))`,
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
        NotExactStringError: NotExactStringFail,
        RequiredError: RequiredFail
      },
      declarations,
      code
    ]
  }

  public toString(options?: ValidatorExportOptions): string {
    const expectedStr = `'${this.expected.replace(/'/g, "\\'")}'`
    if (options?.types) {
      return expectedStr
    }
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${expectedStr}${optionsStr})`
  }

  protected validateValue(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    return validateExactString(value, this.expected, context)
  }
}

export class RequiredExactString extends ExactStringValidator {
  public constructor(expected: string, options?: ValidatorOptions) {
    super(expected, { ...options, required: true })
  }
}

export class OptionalExactString extends ExactStringValidator<undefined | null> {
  public constructor(expected: string, options?: ValidatorOptions) {
    super(expected, { ...options, required: false })
  }
}
