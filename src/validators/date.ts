import { CodeGenResult, ValidatorBase, ValidatorBaseOptions, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotDateFail, RequiredFail, ValidationFailure } from '../errors'

export function isDate(value: unknown, context?: string): value is Date {
  const errors = validateDate(value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateDate(value: unknown, context?: string): ValidationFailure[] {
  if (!(value instanceof Date)) {
    return [new NotDateFail(`Must be a Date object`, value, context)]
  }
  return []
}

export abstract class DateValidator<O = never> extends ValidatorBase<Date | O> {
  public constructor(options?: ValidatorBaseOptions) {
    super(options)
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
      `  if (!(${localValueRef} instanceof Date)) {`,
      `    errors.push(new NotDateFail(\`Must be a Date object\`, ${localValueRef}${contextStr}))`,
      `  }`,
      ], localValueRef, contextStr),
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),
    ]
    return [
      {
        NotDateFail: NotDateFail,
        RequiredFail: RequiredFail
      },
      declarations,
      code
    ]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'Date'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateDate(value, context)
  }
}

export class RequiredDate extends DateValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options })
  }
}

export class OptionalDate extends DateValidator<undefined> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}

export class NullableDate extends DateValidator<null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, nullable: true })
  }
}

export class OptionalNullableDate extends DateValidator<undefined | null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false, nullable: true })
  }
}
