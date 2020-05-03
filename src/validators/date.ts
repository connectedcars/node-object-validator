import { CodeGenResult, ValidatorBase, ValidatorOptions } from '../common'
import { NotDateFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function validateDate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
  if (!(value instanceof Date)) {
    return [new NotDateFail(`Must be a Date object`, context)]
  }
  return []
}

export class DateValidator<O = never> extends ValidatorBase<Date | O> {
  private required: boolean

  public constructor(options?: ValidatorOptions, required = true) {
    super()
    this.required = required
    if (options?.optimize) {
      this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateDate(value, context)
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: ValidationErrorContext
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
        '}'
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
}

export class RequiredDate extends DateValidator {
  private validatorType: 'RequiredDate' = 'RequiredDate'
  public constructor(options?: ValidatorOptions) {
    super(options)
  }
}

export class OptionalDate extends DateValidator<null | undefined> {
  private validatorType: 'OptionalDate' = 'OptionalDate'
  public constructor(options?: ValidatorOptions) {
    super(options, false)
  }
}

export function DateObject(required: false): OptionalDate
export function DateObject(required?: true): RequiredDate
export function DateObject(required = true): OptionalDate | RequiredDate {
  return required ? new RequiredDate() : new OptionalDate()
}
