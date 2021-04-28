import { CodeGenResult, ValidatorBase, ValidatorBaseOptions, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotExactStringFail, RequiredFail, ValidationFailure } from '../errors'

export function isExactString<T extends string>(value: unknown, expected: T, context?: string): value is T {
  const errors = validateExactString(value, expected, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateExactString(value: unknown, expected: string, context?: string): ValidationFailure[] {
  if (value !== expected) {
    return [new NotExactStringFail(`Must strictly equal "${expected}"`, value, context)]
  }
  return []
}

export abstract class ExactStringValidator<T extends string = never, O = never> extends ValidatorBase<T | O> {
  public expected: T

  public constructor(expected: T, options?: ValidatorBaseOptions) {
    super(options)
    this.expected = expected
    if (options?.optimize !== false) {
      this.optimize(expected)
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
    const expectedStr = JSON.stringify(this.expected)
    const contextStr = context ? `, \`${context}\`` : ', context'
    const localValueRef = `value${id()}`
    const declarations: string[] = []
    // prettier-ignore
    const code = [
      `const ${localValueRef} = ${valueRef}`,
      ...this.nullCheckWrap([
      `  if (${localValueRef} !== ${expectedStr}) {`,
      `    errors.push(new NotExactStringFail(\`Must strictly equal ${expectedStr}\`, ${localValueRef}${contextStr}))`,
      `  }`,
      ], localValueRef, contextStr),
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),
    ]
    return [
      {
        NotExactStringFail: NotExactStringFail,
        RequiredFail: RequiredFail
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

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateExactString(value, this.expected, context)
  }
}

export class RequiredExactString<T extends string> extends ExactStringValidator<T> {
  public constructor(expected: T, options?: ValidatorOptions) {
    super(expected, { ...options, required: true })
  }
}

export class OptionalExactString<T extends string> extends ExactStringValidator<T, undefined> {
  public constructor(expected: T, options?: ValidatorOptions) {
    super(expected, { ...options, required: false })
  }
}
