import { CodeGenResult, isValidType, ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import {
  NotIntegerFail,
  NotStringFail,
  OutOfRangeFail,
  RequiredFail,
  ValidationFailure,
  WrongLengthFail
} from '../errors'
import { validateString } from './string'

export function isUnixDateTime(value: unknown, context?: string): value is string {
  const errors = validateUnixDateTime(value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateUnixDateTime(value: unknown, context?: string): ValidationFailure[] {
  const stringError = validateString(value, 1, 20, context)
  if (!isValidType<string>(value, stringError)) {
    return stringError
  }

  const numValue = Number(value)

  if (!Number.isInteger(numValue)) {
    return [new NotIntegerFail(`Must be a number in string format`, value, context)]
  }

  // Validate the Unix timestamp range (valid range for Unix timestamps)
  if (numValue < 0 || numValue > 2147483647) {
    return [new OutOfRangeFail(`Must be a valid Unix timestamp`, value, context)]
  }

  return []
}

export abstract class UnixDateTimeValidator<O = never> extends ValidatorBase<string | O> {
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
      ...this.nullCheckWrap([
      `  if (typeof ${localValueRef} === 'string') {`,
      `    if (${localValueRef}.length >= 1 && ${localValueRef}.length <= 20) {`,
      `      const numValue = Number(${localValueRef})`,
      `      if (!isNaN(numValue) && Number.isInteger(numValue)) {`,
      `        if (numValue >= 0 && numValue <= 2147483647) {`,
      `          // Valid Unix timestamp`,
      `        } else {`,
      `          errors.push(new OutOfRangeFail(\`Must be a valid Unix timestamp\`, ${localValueRef}${contextStr}))`,
      `        }`,
      `      } else {`,
      `        errors.push(new NotIntegerFail(\`Must be a number in string format\`, ${localValueRef}${contextStr}))`,
      `      }`,
      `    } else {`,
      `      errors.push(new WrongLengthFail(\`Must contain between 1 and 20 characters\`, ${localValueRef}${contextStr}))`,
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
        NotIntegerFail: NotIntegerFail,
        OutOfRangeFail: OutOfRangeFail,
        NotStringFail: NotStringFail,
        RequiredFail: RequiredFail,
        WrongLengthFail: WrongLengthFail
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
    return validateUnixDateTime(value, context)
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
        const typeStr = 'DateTime<Utc>'
        const isOption = !this.required || this.nullable
        return isOption ? `Option<${typeStr}>` : `${typeStr}`
      }
      default: {
        throw new Error(`Language: '${options?.language}' unknown`)
      }
    }
  }

  private constructorString(): string {
    return `new ${this.constructor.name}(${this.optionsString})`
  }
}

export class RequiredUnixDateTime extends UnixDateTimeValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options })
  }
}

export class OptionalUnixDateTime extends UnixDateTimeValidator<undefined> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}

export class NullableUnixDateTime extends UnixDateTimeValidator<null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, nullable: true })
  }
}

export class OptionalNullableUnixDateTime extends UnixDateTimeValidator<undefined | null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false, nullable: true })
  }
}
