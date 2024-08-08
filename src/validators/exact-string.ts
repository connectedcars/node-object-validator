import { ObjectValidator, toPascalCase, UnionValidator } from '..'
import { CodeGenResult, ValidatorBase, ValidatorBaseOptions, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotExactStringFail, RequiredFail, ValidationFailure } from '../errors'

export function isExactString<T extends string>(value: unknown, expected: T, context?: string): value is T {
  const errors = validateExactString(value, expected, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateExactString(value: unknown, expected: string, context?: string): ValidationFailure[] {
  if (value !== expected) {
    return [new NotExactStringFail(`Must strictly equal "${expected}"`, value, context)]
  }
  return []
}

export abstract class ExactStringValidator<T extends string = never, O = never> extends ValidatorBase<T | O> {
  public expected: T
  public typeName?: string

  private typeGenerated: boolean

  public constructor(expected: T, options?: ValidatorBaseOptions) {
    super(options)
    this.typeGenerated = false
    this.expected = expected
    this.typeName = options?.typeName
    if (options?.optimize !== false) {
      this.optimize(expected)
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
    const expectedStr = JSON.stringify(this.expected)
    const contextStr = context ? `, \`${context}\`` : ', context'
    const localValueRef = `value${id()}`
    const declarations: string[] = []
    // prettier-ignore
    const code = [
      `const ${localValueRef} = ${valueRef}`,
      ...this.nullCheckWrap([
      `  if (${localValueRef} !== ${expectedStr}) {`,
      `    errors.push(new NotExactStringFail(\`Must strictly equal ${expectedStr}\`, ${localValueRef}${contextStr}))`,
      `  }`,
      ], localValueRef, contextStr),
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),
    ]
    return [
      {
        NotExactStringFail: NotExactStringFail,
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
    return validateExactString(value, this.expected, context)
  }

  private typeString(options?: ValidatorExportOptions): string {
    const language = options?.language ?? 'typescript'
    switch (language) {
      case 'typescript': {
        const expectedStr = `'${this.expected.replace(/'/g, "\\'")}'`
        let typeStr = `${expectedStr}`

        if (this.required === false) {
          typeStr += ` | undefined`
        }
        if (this.nullable === true) {
          typeStr += ` | null`
        }

        return typeStr
      }
      case 'rust': {
        const isOption = !this.required || this.nullable
        if (isOption) {
          throw new Error(`Rust does not support optional ExactString. For: ${this.toString()}`)
        }

        const isValidParent = options?.parent instanceof UnionValidator || options?.parent instanceof ObjectValidator
        if (isValidParent === false) {
          throw new Error(`ExactString has to be in an object/union. str: ${this.expected}`)
        }
        if (options.parent instanceof ObjectValidator && options.taggedUnionKey === undefined) {
          throw new Error(`ExactString in an object, has to be part of a taggedUnion. str: ${this.expected}`)
        }

        return toPascalCase(this.expected)
      }
      default: {
        throw new Error(`Language: '${options?.language}' unknown`)
      }
    }
  }

  private constructorString(): string {
    const expectedStr = `'${this.expected.replace(/'/g, "\\'")}'`
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${expectedStr}${optionsStr})`
  }
}

export class RequiredExactString<T extends string> extends ExactStringValidator<T> {
  public constructor(expected: T, options?: ValidatorOptions) {
    super(expected, { ...options })
  }
}

export class OptionalExactString<T extends string> extends ExactStringValidator<T, undefined> {
  public constructor(expected: T, options?: ValidatorOptions) {
    super(expected, { ...options, required: false })
  }
}

export class NullableExactString<T extends string> extends ExactStringValidator<T, null> {
  public constructor(expected: T, options?: ValidatorOptions) {
    super(expected, { ...options, nullable: true })
  }
}

export class OptionalNullableExactString<T extends string> extends ExactStringValidator<T, undefined | null> {
  public constructor(expected: T, options?: ValidatorOptions) {
    super(expected, { ...options, required: false, nullable: true })
  }
}
