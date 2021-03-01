import { CodeGenResult, isValidType, ValidatorBase, ValidatorOptions } from '../common'
import {
  NotRfc3339Fail,
  NotStringFail,
  RequiredFail,
  ValidationErrorContext,
  ValidationFailure,
  WrongLengthFail
} from '../errors'
import { validateString } from './string'

const dateTimePattern = /^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/

export function validateDateTime(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
  const stringError = validateString(value, 20, 29, context)
  if (!isValidType<string>(value, stringError)) {
    return stringError
  }
  if (!dateTimePattern.test(value)) {
    return [new NotRfc3339Fail(`Must be formatted as an RFC 3339 timestamp (received "${value}")`, context)]
  }
  return []
}

export class DateTimeValidator<O = never> extends ValidatorBase<string | O> {
  public required: boolean

  public constructor(options?: ValidatorOptions) {
    super()
    const mergedOptions = { required: true, optimize: false, ...options }
    this.required = mergedOptions.required
    if (mergedOptions.optimize) {
      this.validate = this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateDateTime(value, context)
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
      `  if (typeof ${localValueRef} === 'string') {`,
      `    if (${localValueRef}.length >= 20 && ${localValueRef}.length <= 29) {`,
      `      if (!dateTimePattern.test(${localValueRef})) {`,
      `        errors.push(new NotRfc3339Fail(\`Must be formatted as an RFC 3339 timestamp (received "\${${localValueRef}}")\`${contextStr}))`,
      `      }`,
      `    } else {`,
      `      errors.push(new WrongLengthFail(\`Must contain between 20 and 29 characters (received "\${${localValueRef}}")\`${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotStringFail(\`Must be a string (received "\${${localValueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
        `} else {`,
        `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
        '}'
    ]
    return [
      {
        dateTimePattern: dateTimePattern,
        NotRfc3339Fail: NotRfc3339Fail,
        WrongLengthFail: WrongLengthFail,
        NotStringFail: NotStringFail,
        RequiredError: RequiredFail
      },
      declarations,
      code
    ]
  }
}

export class RequiredDateTime extends DateTimeValidator {
  private validatorType: 'RequiredDateTime' = 'RequiredDateTime'
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: true })
  }
}

export class OptionalDateTime extends DateTimeValidator<undefined | null> {
  private validatorType: 'OptionalDateTime' = 'OptionalDateTime'
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}
