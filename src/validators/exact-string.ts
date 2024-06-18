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

  // TODO: probably not? how would we know when/how to split out? this needs to be on the union itself, with stuff passed down.
  // But how would you from the TS type say that a given "ExactString" is that variant bassed into another type?
  // MAYBE if we define the exactstrings outside and put in the reference instead

  // private rustTypeGenerated: boolean
  // private rustTag: string

  public constructor(expected: T, options?: ValidatorBaseOptions) {
    super(options)
    this.expected = expected
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
          throw new Error(`Rust does not support optional ExactString`)
        }



        return this.expected.toString()
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
