import { CodeGenResult, ValidatorBase, ValidatorBaseOptions, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotIntegerFail, OutOfRangeFail, RequiredFail, ValidationFailure } from '../errors'

export function isInteger(
  value: unknown,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER,
  context?: string
): value is number {
  const errors = validateInteger(value, min, max, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateInteger(
  value: unknown,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER,
  context?: string
): ValidationFailure[] {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return [new NotIntegerFail(`Must be an integer`, value, context)]
  }
  if (value < min || value > max) {
    return [new OutOfRangeFail(`Must be between ${min} and ${max}`, value, context)]
  }
  return []
}

export abstract class IntegerValidator<O = never> extends ValidatorBase<number | O> {
  private min: number
  private max: number

  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorBaseOptions) {
    super(options)
    this.min = min
    this.max = max
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
      ...this.nullCheckWrap([
      `  if (typeof ${localValueRef} === 'number' && Number.isInteger(${localValueRef})) {`,
      `    if (${localValueRef} < ${this.min} || ${localValueRef} > ${this.max}) {`,
      `      errors.push(new OutOfRangeFail(\`Must be between ${this.min} and ${this.max}\`, ${localValueRef}${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotIntegerFail(\`Must be an integer\`, ${localValueRef}${contextStr}))`,
      `  }`,
      ], localValueRef, contextStr),
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),
    ]
    return [
      {
        OutOfRangeFail: OutOfRangeFail,
        NotIntegerFail: NotIntegerFail,
        RequiredFail: RequiredFail
      },
      declarations,
      code
    ]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'number'
    }
    const minStr = this.min !== Number.MIN_SAFE_INTEGER || this.max !== Number.MAX_SAFE_INTEGER ? `${this.min}` : ''
    const maxStr = this.max !== Number.MAX_SAFE_INTEGER ? `, ${this.max}` : ''
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${minStr}${maxStr}${optionsStr})`
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateInteger(value, this.min, this.max, context)
  }
}

export class RequiredInteger extends IntegerValidator {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: true })
  }
}

export class OptionalInteger extends IntegerValidator<undefined> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}
