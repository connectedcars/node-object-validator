import { CodeGenResult, ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotBooleanFail, RequiredFail, ValidationFailure } from '../errors'

export function isBoolean(value: unknown, context?: string): value is boolean {
  const errors = validateBoolean(value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateBoolean(value: unknown, context?: string): ValidationFailure[] {
  if (typeof value !== 'boolean') {
    return [new NotBooleanFail(`Must be an boolean`, value, context)]
  }
  return []
}

export class BooleanValidator<O = never> extends ValidatorBase<boolean | O> {
  public constructor(options?: ValidatorOptions) {
    super(options)
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
    context?: string,
    earlyFail?: boolean
  ): CodeGenResult {
    const contextStr = context ? `, \`${context}\`` : ', context'
    const localValueRef = `value${id()}`
    const declarations: string[] = []
    // prettier-ignore
    const code: string[] = [
      `const ${localValueRef} = ${valueRef}`,
      `if (${localValueRef} != null) {`,
      `  if (typeof ${localValueRef} !== 'boolean') {`,
      `    errors.push(new NotBooleanFail(\`Must be an boolean\`, ${localValueRef}${contextStr}))`,
      `  }`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredFail(\`Is required\`, ${localValueRef}${contextStr}))`] : []),
      '}',
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),
    ]
    return [
      {
        NotBooleanFail: NotBooleanFail,
        RequiredFail: RequiredFail
      },
      declarations,
      code
    ]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'boolean'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateBoolean(value, context)
  }
}

export class RequiredBoolean extends BooleanValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: true })
  }
}

export class OptionalBoolean extends BooleanValidator<undefined | null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}