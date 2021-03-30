import { CodeGenResult, ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotDateFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function isDate(value: unknown, context?: ValidationErrorContext): value is Date {
  const errors = validateDate(value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateDate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
  if (!(value instanceof Date)) {
    return [new NotDateFail(`Must be a Date object`, context)]
  }
  return []
}

export class DateValidator<O = never> extends ValidatorBase<Date | O> {
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
    context?: ValidationErrorContext,
    earlyFail?: boolean
  ): CodeGenResult {
    const contextStr = context ? `, { key: \`${context.key}\` }` : ', context'
    const localValueRef = `value${id()}`
    const declarations: string[] = []
    // prettier-ignore
    const code: string[] = [
      `const ${localValueRef} = ${valueRef}`,
      `if (${localValueRef} != null) {`,
      `  if (!(${localValueRef} instanceof Date)) {`,
      `    errors.push(new NotDateFail(\`Must be a Date object\`${contextStr}))`,
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
        NotDateFail: NotDateFail,
        RequiredError: RequiredFail
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

  protected validateValue(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    return validateDate(value, context)
  }
}

export class RequiredDate extends DateValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: true })
  }
}

export class OptionalDate extends DateValidator<null | undefined> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}
