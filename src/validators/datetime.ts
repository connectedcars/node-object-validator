import { CodeGenResult, isValidType, ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotRfc3339Fail, NotStringFail, RequiredFail, ValidationFailure, WrongLengthFail } from '../errors'
import { validateString } from './string'

export function isDateTime(value: unknown, context?: string): value is string {
  const errors = validateDateTime(value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

const dateTimePattern = /^([0-9]{4})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/

export function validateDateTime(value: unknown, context?: string): ValidationFailure[] {
  const stringError = validateString(value, 20, 30, context)
  if (!isValidType<string>(value, stringError)) {
    return stringError
  }
  if (!dateTimePattern.test(value)) {
    return [new NotRfc3339Fail(`Must be formatted as an RFC 3339 timestamp`, value, context)]
  }
  return []
}

export class DateTimeValidator<O = never> extends ValidatorBase<string | O> {
  public constructor(options?: ValidatorOptions) {
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
      `if (${localValueRef} != null) {`,
      `  if (typeof ${localValueRef} === 'string') {`,
      `    if (${localValueRef}.length >= 20 && ${localValueRef}.length <= 30) {`,
      `      if (!dateTimePattern.test(${localValueRef})) {`,
      `        errors.push(new NotRfc3339Fail(\`Must be formatted as an RFC 3339 timestamp\`, ${localValueRef}${contextStr}))`,
      `      }`,
      `    } else {`,
      `      errors.push(new WrongLengthFail(\`Must contain between 20 and 30 characters\`, ${localValueRef}${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotStringFail(\`Must be a string\`, ${localValueRef}${contextStr}))`,
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
        dateTimePattern: dateTimePattern,
        NotRfc3339Fail: NotRfc3339Fail,
        WrongLengthFail: WrongLengthFail,
        NotStringFail: NotStringFail,
        RequiredFail: RequiredFail
      },
      declarations,
      code
    ]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return 'string'
    }
    return `new ${this.constructor.name}(${this.optionsString})`
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateDateTime(value, context)
  }
}

export class RequiredDateTime extends DateTimeValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: true })
  }
}

export class OptionalDateTime extends DateTimeValidator<undefined | null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}
