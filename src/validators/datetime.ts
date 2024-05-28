import {
  CodeGenResult,
  isValidType,
  ValidatorBase,
  ValidatorBaseOptions,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { NotRfc3339Fail, NotStringFail, RequiredFail, ValidationFailure, WrongLengthFail } from '../errors'
import { validateString } from './string'

export function isDateTime(value: unknown, context?: string): value is string {
  const errors = validateDateTime(value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

const dateTimePattern =
  /^([0-9]{4})-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/

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

export abstract class DateTimeValidator<O = never> extends ValidatorBase<string | O> {
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
      ], localValueRef, contextStr),
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
    if (options?.types === true) {
      return this.typeString(options)
    } else {
      return this.constructorString()
    }
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateDateTime(value, context)
  }

  private typeString(options?: ValidatorExportOptions): string {
    const language = options?.language ?? 'typescript'
    switch (language) {
      case 'typescript': {
        let typeStr = `string`

        if (this.required === false) {
          typeStr += ` | undefined`
        }
        if (this.nullable === true) {
          typeStr += ` | null`
        }

        return typeStr
      }
      case 'rust': {
        throw new Error('Rust not supported yet')
      }
      default: {
        throw new Error(`Language: '{}' unknown`)
      }
    }
  }

  private constructorString(): string {
    return `new ${this.constructor.name}(${this.optionsString})`
  }
}

export class RequiredDateTime extends DateTimeValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options })
  }
}

export class OptionalDateTime extends DateTimeValidator<undefined> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}

export class NullableDateTime extends DateTimeValidator<null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, nullable: true })
  }
}

export class OptionalNullableDateTime extends DateTimeValidator<undefined | null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false, nullable: true })
  }
}
