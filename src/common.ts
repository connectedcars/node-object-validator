import { RequiredFail, ValidationFailure, ValidationsError } from './errors'

// https://stackoverflow.com/questions/51651499/typescript-what-is-a-naked-type-parameter
// https://2ality.com/2019/07/testing-static-types.html
// Wrapping the types in an tuple force a specific type instead of allow any in the union
export type AssertEqual<T, Expected> = [T, Expected] extends [Expected, T] ? true : false

export type ReturnEqual<T, C> = [T, C] extends [C, T] ? C : never

// https://github.com/microsoft/TypeScript/issues/41746
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BaseObject = Record<string, any>

// TODO: Give better name
export function isValidType<T>(value: unknown, errors: ValidationFailure[]): value is T {
  return errors.length === 0
}

export type CodeGenResult = [{ [key: string]: unknown }, string[], string[]]

export type ValidatorBaseOptions = {
  optimize?: boolean
  required?: boolean
  nullable?: boolean
  earlyFail?: boolean
}

/**
 * @typedef ValidatorOptions
 * @property {boolean} [earlyFail=false] Stop validation on first failure (default: false)
 * @property {boolean} [optimize=true] Generate an optimized function for doing the validation (default: true)
 */
export interface ValidatorOptions {
  earlyFail?: boolean
  optimize?: boolean
}

export interface ValidateOptions {
  earlyFail?: boolean
  optimized?: boolean
}

export interface ValidatorExportOptions {
  language?: string
  types?: boolean
}

export function isValidator(value: unknown): value is ValidatorBase {
  if (value instanceof ValidatorBase) {
    return true
  }
  return false
}

export function generateOptionsString(options: ValidatorBaseOptions, defaults: Required<ValidatorBaseOptions>): string {
  const selectedOptions: string[] = []
  if (options.required !== undefined && options.required !== defaults.required) {
    selectedOptions.push(`required: ${options.required}`)
  }
  if (options.nullable !== undefined && options.nullable !== defaults.nullable) {
    selectedOptions.push(`nullable: ${options.nullable}`)
  }
  if (options.earlyFail !== undefined && options.earlyFail !== defaults.earlyFail) {
    selectedOptions.push(`earlyFail: ${options.earlyFail}`)
  }
  if (options.optimize !== undefined && options.optimize !== defaults.optimize) {
    selectedOptions.push(`optimize: ${options.optimize}`)
  }
  return selectedOptions.length > 0 ? `{ ${selectedOptions.join(', ')} }` : ''
}

export abstract class ValidatorBase<T = unknown> {
  public tsType!: T
  public required: boolean
  public nullable: boolean
  public earlyFail: boolean

  protected codeGenId = 1
  protected optimizedValidate: ((value: unknown, context?: string) => ValidationFailure[]) | null
  protected optionsString: string

  public constructor(options?: ValidatorBaseOptions) {
    const defaults = { required: true, nullable: false, earlyFail: false, optimize: true }
    const mergedOptions = { ...defaults, ...options }

    this.optionsString = options ? generateOptionsString(options, defaults) : ''

    this.required = mergedOptions.required
    this.earlyFail = mergedOptions.earlyFail
    this.nullable = mergedOptions.nullable
    this.optimizedValidate = null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public AssertType<C extends T, X extends AssertEqual<T, C>>(): void {
    // Only used for type assertions
  }

  public isValid<C extends T>(obj: unknown): obj is ReturnEqual<T, C> {
    const errors = this.validate(obj)
    return errors.length === 0
  }

  public isType<C extends T>(obj: unknown, errors: ValidationFailure[]): obj is ReturnEqual<T, C> {
    return errors.length === 0
  }

  public cast<C extends T>(obj: unknown): ReturnEqual<T, C> {
    const errors = this.validate(obj)
    if (this.isType<C>(obj, errors)) {
      return obj
    } else {
      throw new ValidationsError('One of more validations failed', errors)
    }
  }

  public validate(value: unknown, context?: string, options?: ValidateOptions): ValidationFailure[] {
    if (options?.optimized !== false && this.optimizedValidate !== null) {
      return this.optimizedValidate(value, context)
    }
    if (this.nullable && value === null) {
      return []
    }
    if (value === undefined) {
      return this.required ? [new RequiredFail(`Is required`, value, context)] : []
    }
    return this.validateValue(value, context, { earlyFail: this.earlyFail, optimized: false, ...options })
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
    const contextStr = context ? `, { key: (context ? \`\${context}['${context}']\` : \`${context}\`) }` : ', context'
    const validatorName = `validator${id()}`
    const declarations = [`const ${validatorName} = ${validatorRef}`]
    // prettier-ignore
    const code: string[] = [
      ...this.nullCheckWrap([
        `  errors.push(...${validatorName}.validateValue(${valueRef}${contextStr}))`,
      ],valueRef, contextStr),
      ...(this.earlyFail || earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),
    ]
    return [
      {
        RequiredFail: RequiredFail
      },
      declarations,
      code
    ]
  }

  protected nullCheckWrap(code: string[], valueRef: string, contextStr: string, skip = false): string[] {
    if (skip) {
      return code
    }

    const result: string[] = []
    if (this.required) {
      if (this.nullable) {
        result.push(`if (${valueRef} !== undefined) {`)
        result.push(`  if (${valueRef} !== null) {`)
        result.push(...code)
        result.push(`  }`)
        result.push(`} else {`)
        result.push(`  errors.push(new RequiredFail(\`Is required\`, ${valueRef}${contextStr}))`)
        result.push(`}`)
      } else {
        result.push(`if (${valueRef} !== undefined) {`)
        result.push(...code)
        result.push(`} else {`)
        result.push(`  errors.push(new RequiredFail(\`Is required\`, ${valueRef}${contextStr}))`)
        result.push(`}`)
      }
    } else {
      if (this.nullable) {
        result.push(`if (${valueRef} != null) {`)
        result.push(...code)
        result.push(`}`)
      } else {
        result.push(`if (${valueRef} !== undefined) {`)
        result.push(...code)
        result.push(`}`)
      }
    }
    return result
  }

  protected optimize(schema?: unknown): void {
    const [imports, declarations, code] = this.codeGen(
      'value',
      'schema',
      () => {
        return this.codeGenId++
      },
      undefined,
      this.earlyFail
    )
    const functionBody = [
      ...Object.keys(imports).map(i => `const ${i} = imports['${i}']`),
      ...declarations,
      `return (value, context) => {`,
      `  const generatedFunction = true`,
      `  const errors = []`,
      ...code.map(l => `  ${l}`),
      `  return errors`,
      `}`
    ].join('\n')

    try {
      const functionGenerator = new Function('imports', 'schema', functionBody)
      const validateFunction = functionGenerator(imports, {
        schema,
        validateValue: this.validateValue.bind(this)
      })
      this.optimizedValidate = validateFunction
    } catch (e) {
      throw new Error(`Failed to compile optimized function(${e.message}):\n${functionBody}`)
    }
  }

  public abstract toString(options?: ValidatorExportOptions): string

  protected abstract validateValue(value: unknown, context?: string, options?: ValidateOptions): ValidationFailure[]
}
