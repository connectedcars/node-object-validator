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
    if (options?.types === true) {
      return this.typeString(options)
    } else {
      return this.constructorString()
    }
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateInteger(value, this.min, this.max, context)
  }

  private typeString(options?: ValidatorExportOptions): string {
    const language = options?.language ?? 'typescript'
    switch (language) {
      case 'typescript': {
        let typeStr = `number`

        if (this.required === false) {
          typeStr += ` | undefined`
        }
        if (this.nullable === true) {
          typeStr += ` | null`
        }

        return typeStr
      }
      case 'rust': {
        let typeStr

        if (this.min >= 0) {
          if (this.max < 0xff) {
            typeStr = 'u8'
          } else if (this.max < 0xff_ff) {
            typeStr = 'u16'
          } else if (this.max < 0xff_ff_ff_ff) {
            typeStr = 'u32'
          } else {
            if (options?.jsonSafeTypes) {
              throw new Error(
                `Javascript numbers are limited to 53 bits so max 32bit for compatible types in rust, min: ${this.min} max: ${this.max}`
              )
            }
            typeStr = 'u64'
          }
        } else {
          if (this.max < 0x7f && this.min >= -0x7f) {
            typeStr = 'i8'
          } else if (this.max < 0x7f_ff && this.min >= -0x7f_ff) {
            typeStr = 'i16'
          } else if (this.max < 0x7f_ff_ff_ff && this.min >= -0x7f_ff_ff_ff) {
            typeStr = 'i32'
          } else {
            if (options?.jsonSafeTypes) {
              throw new Error(
                `Javascript numbers are limited to 53 bits so max 32bit for compatible types in rust, min: ${this.min} max: ${this.max}`
              )
            }
            typeStr = 'i64'
          }
        }

        const isOption = !this.required || this.nullable
        return isOption ? `Option<${typeStr}>` : `${typeStr}`
      }
      default: {
        throw new Error(`Language: '${options?.language}' unknown`)
      }
    }
  }

  private constructorString(): string {
    const minStr = this.min !== Number.MIN_SAFE_INTEGER || this.max !== Number.MAX_SAFE_INTEGER ? `${this.min}` : ''
    const maxStr = this.max !== Number.MAX_SAFE_INTEGER ? `, ${this.max}` : ''
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${minStr}${maxStr}${optionsStr})`
  }
}

export class RequiredInteger extends IntegerValidator {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options })
  }
}

export class OptionalInteger extends IntegerValidator<undefined> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false })
  }
}

export class NullableInteger extends IntegerValidator<null> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, nullable: true })
  }
}

export class OptionalNullableInteger extends IntegerValidator<undefined | null> {
  public constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(min, max, { ...options, required: false, nullable: true })
  }
}
