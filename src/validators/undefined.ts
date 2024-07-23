import {
  CodeGenResult,
  generateOptionsString,
  ValidatorBase,
  ValidatorBaseOptions,
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
    return [new NotUndefinedFail(`Must be undefined`, value, context)]
  }
  return []
}

export abstract class UndefinedValidator<O = never> extends ValidatorBase<undefined | O> {
  public constructor(options?: ValidatorBaseOptions) {
    super({ ...options, required: false })
    this.optionsString = options
      ? generateOptionsString(options, {
          required: false,
          nullable: false,
          earlyFail: false,
          optimize: true
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
      ...(this.nullable ? [
      `if (${localValueRef} !== null) {`] : []),
      `  if (${localValueRef} !== undefined) {`,
      `    errors.push(new NotUndefinedFail(\`Must be undefined\`, ${localValueRef}${contextStr}))`,
      `  }`,
      ...(this.nullable ? [
      `}`] : []),
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
    if (options?.types === true) {
      return this.typeString(options)
    } else {
      return this.constructorString()
    }
  }

  protected validateValue(value: unknown, context?: string): ValidationFailure[] {
    return validateUndefined(value, context)
  }

  private typeString(options?: ValidatorExportOptions): string {
    const language = options?.language ?? 'typescript'
    switch (language) {
      case 'typescript': {
        let typeStr = `undefined`

        if (this.nullable === true) {
          typeStr += ` | null`
        }

        return typeStr
      }
      case 'rust': {
        throw new Error('Undefined is not supported in Rust')
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

export class RequiredUndefined extends UndefinedValidator {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}

export class OptionalUndefined extends UndefinedValidator {
  public required = false as const
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false })
  }
}

export class NullableUndefined extends UndefinedValidator<null> {
  public constructor(options?: ValidatorOptions) {
    super({ ...options, required: false, nullable: true })
  }
}
