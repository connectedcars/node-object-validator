import {
  CodeGenResult,
  generateOptionsString,
  ValidatorBase,
  ValidatorBaseOptions,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { NotNullFail, RequiredFail, ValidationFailure } from '../errors'

export function isNull(value: unknown, context?: string): value is null {
  const errors = validateNull(value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateNull(value: unknown, context?: string): ValidationFailure[] {
  if (value !== null) {
    return [new NotNullFail(`Must be an null`, value, context)]
  }
  return []
}

export abstract class NullValidator<O = never> extends ValidatorBase<null | O> {
  public constructor(options?: ValidatorBaseOptions) {
    super({ ...options })
    this.optionsString = options
      ? generateOptionsString(options, {
          required: true,
          nullable: false,
          earlyFail: false,
          optimize: true
        })
      : ''
    if (options?.optimize !== false) {
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
      `if (${localValueRef} !== undefined) {`,
      `  if (${localValueRef} !== null) {`,
      `    errors.push(new NotNullFail(\`Must be an null\`, ${localValueRef}${contextStr}))`,
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
        NotNullFail: NotNullFail,
        RequiredFail: RequiredFail
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

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    if (value === undefined) {
      return this.required ? [new RequiredFail(`Is required`, value, context)] : []
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
