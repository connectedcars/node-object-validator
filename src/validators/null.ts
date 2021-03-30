import {
  CodeGenResult,
  generateOptionsString,
  ValidatorBase,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { NotNullFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function isNull(value: unknown, context?: ValidationErrorContext): value is null {
  const errors = validateNull(value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateNull(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
  if (value !== null) {
    return [new NotNullFail(`Must be an null (received "${value}")`, context)]
  }
  return []
}

export class NullValidator<O = never> extends ValidatorBase<null | O> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, nullCheck: false })
    this.optionsString = options
      ? generateOptionsString(options, {
          required: true,
          nullCheck: false,
          earlyFail: false,
          optimize: false
        })
      : ''
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
    const localValueRef = `value${id()}`
    const declarations: string[] = []
    // prettier-ignore
    const code: string[] = [
      `const ${localValueRef} = ${valueRef}`,
      `if (${localValueRef} !== undefined) {`,
      `  if (${localValueRef} !== null) {`,
      `    errors.push(new NotNullFail(\`Must be an null (received "\${${localValueRef}}")\`${contextStr}))`,
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
        NotNullFail: NotNullFail,
        RequiredError: RequiredFail
      },
      declarations,
      code
    ]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'null'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  protected validateValue(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value === undefined) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateNull(value, context)
  }
}

export class RequiredNull extends NullValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: true })
  }
}

export class OptionalNull extends NullValidator<undefined> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}
