import {
  CodeGenResult,
  generateOptionsString,
  ValidatorBase,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { NotUndefinedFail, RequiredFail, ValidationFailure } from '../errors'

export function isUndefined(value: unknown, context?: string): value is undefined {
  const errors = validateUndefined(value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateUndefined(value: unknown, context?: string): ValidationFailure[] {
  if (value !== undefined) {
    return [new NotUndefinedFail(`Must be an undefined`, value, context)]
  }
  return []
}

export class UndefinedValidator<O = never> extends ValidatorBase<undefined | O> {
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
      `if (${localValueRef} !== null) {`,
      `  if (${localValueRef} !== undefined) {`,
      `    errors.push(new NotUndefinedFail(\`Must be an undefined\`, ${localValueRef}${contextStr}))`,
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
        NotUndefinedFail: NotUndefinedFail,
        RequiredFail: RequiredFail
      },
      declarations,
      code
    ]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'undefined'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    if (value === null) {
      return this.required ? [new RequiredFail(`Is required`, value, context)] : []
    }
    return validateUndefined(value, context)
  }
}

export class RequiredUndefined extends UndefinedValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: true })
  }
}

export class OptionalUndefined extends UndefinedValidator<null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}
