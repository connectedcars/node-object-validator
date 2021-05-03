import { CodeGenResult, ValidatorBase, ValidatorBaseOptions, ValidatorExportOptions, ValidatorOptions } from '../common'
import { RequiredFail, ValidationFailure } from '../errors'

export abstract class UnknownValidator<O = never> extends ValidatorBase<unknown | O> {
  public constructor(options?: ValidatorBaseOptions) {
    super({ ...options })
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
      ...(this.required ? [
      `if (${localValueRef} === undefined) {`,
      `  errors.push(new RequiredFail(\`Is required\`, ${localValueRef}${contextStr}))`,
      '}'
      ] : []),
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),

    ]
    return [
      {
        RequiredFail: RequiredFail
      },
      declarations,
      code
    ]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'unknown'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    if (value === undefined) {
      return this.required ? [new RequiredFail(`Is required`, value, context)] : []
    }
    return []
  }
}

export class RequiredUnknown extends UnknownValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: true })
  }
}

export class OptionalUnknown extends UnknownValidator<undefined> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}
