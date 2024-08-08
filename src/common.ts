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

/**
 * @typedef ValidatorOptions
 * @property {boolean} [earlyFail=false] Stop validation on first failure (default: false)
 * @property {boolean} [optimize=true] Generate an optimized function for doing the validation (default: true)
 * @property {boolean} [required=true] Is the validator required/optional (default: false)
 * @property {boolean} [nullable=false] Is the validator nullable/optional (default: false)
 * @property {boolean} [comparable=false] Is the validator able to be used in comparisons in other languages (generate comparator function/decorator) (default: false)
 * @property {boolean} [hashable=false] Is the validator able to be hashable in other languages (hashmap usage) (default: false)
 * @property {string} [typeName='Something'] Required for generating other language types (default: undefined)
 */
export interface ValidatorOptions {
  earlyFail?: boolean
  optimize?: boolean
  required?: boolean
  nullable?: boolean
  comparable?: boolean
  hashable?: boolean
  typeName?: string
}

export interface ValidatorExportOptions {
  language?: 'typescript' | 'rust'
  jsonSafeTypes?: boolean
  types?: boolean
  parent?: ValidatorBase
  taggedUnionKey?: string
  typeNameFromParent?: string
  typeDefinitions?: Record<string, string>
}

export function isValidator(value: unknown): value is ValidatorBase {
  if (value instanceof ValidatorBase) {
    return true
  }
  return false
}

export function generateOptionsString(options: ValidatorOptions, defaults: ValidatorOptions): string {
  const selectedOptions: string[] = []
  if (options.earlyFail !== undefined && options.earlyFail !== defaults.earlyFail) {
    selectedOptions.push(`earlyFail: ${options.earlyFail}`)
  }
  if (options.optimize !== undefined && options.optimize !== defaults.optimize) {
    selectedOptions.push(`optimize: ${options.optimize}`)
  }
  if (options.required !== undefined && options.required !== defaults.required) {
    selectedOptions.push(`required: ${options.required}`)
  }
  if (options.nullable !== undefined && options.nullable !== defaults.nullable) {
    selectedOptions.push(`nullable: ${options.nullable}`)
  }
  if (options.comparable !== undefined && options.comparable !== defaults.comparable) {
    selectedOptions.push(`comparable: ${options.comparable}`)
  }
  if (options.hashable !== undefined && options.hashable !== defaults.hashable) {
    selectedOptions.push(`hashable: ${options.hashable}`)
  }
  if (options.typeName !== undefined && options.typeName !== defaults.typeName) {
    selectedOptions.push(`typeName: ${options.typeName}`)
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

  public constructor(options?: ValidatorOptions) {
    const defaults = {
      earlyFail: false,
      optimize: true,
      required: true,
      nullable: false,
      comparable: false,
      hashable: false,
      typeName: undefined
    }
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

  public validate(value: unknown, context?: string, options?: ValidatorOptions): ValidationFailure[] {
    if (options?.optimize !== false && this.optimizedValidate !== null) {
      return this.optimizedValidate(value, context)
    }
    if (this.nullable && value === null) {
      return []
    }
    if (value === undefined) {
      return this.required ? [new RequiredFail(`Is required`, value, context)] : []
    }
    return this.validateValue(value, context, { earlyFail: this.earlyFail, optimize: false, ...options })
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

  protected abstract validateValue(value: unknown, context?: string, options?: ValidatorOptions): ValidationFailure[]
}
