import { RequiredFail, ValidationFailure, ValidationsError } from './errors'

// https://stackoverflow.com/questions/51651499/typescript-what-is-a-naked-type-parameter
// https://2ality.com/2019/07/testing-static-types.html
// Wrapping the types in an tuple force a specific type instead of allow any in the union
export type AssertEqual<T, Expected> = [T, Expected] extends [Expected, T] ? true : false

export type ReturnEqual<T, C> = [T, C] extends [C, T] ? C : never

// https://github.com/microsoft/TypeScript/issues/41746
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BaseObject = Record<string, any>

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
 * @property {boolean} [partialComparable=false] Is the validator able to be used in partial comparisons in other languages (floats which can't do a normal Eq etc) (generate comparator function/decorator) (default: false)
 * @property {boolean} [copyable=false] Is the validator able to be copied when passed around as a reference (like basic types (integers etc)) instead of objects, in other languages (default: false)
 * @property {boolean} [hashable=false] Is the validator able to be hashable in other languages (hashmap usage) (default: false)
 * @property {boolean} [defaultable=false] Is the validator able to be created with default values in other languages (default: false)
 * @property {boolean} [parseable=false] Is the validator able to be parsed in CLI's in other languages (default: false)
 * @property {boolean} [orderable=false] Is the validator able to be ordered/sorted in other languages (default: false)
 * @property {boolean} [partialOrderable=false] Is the validator able to be partially ordered/sorted in other languages (default: false)
 * @property {boolean} [forceHeap=false] Should the validator be forced to be heap allocated (pointer) in other languages when appropriate (default: false)
 * @property {string} [typeName='Something'] Required for generating other language types (default: undefined)
 */
export interface ValidatorOptions {
  earlyFail?: boolean
  optimize?: boolean
  required?: boolean
  nullable?: boolean
  comparable?: boolean
  partialComparable?: boolean
  copyable?: boolean
  hashable?: boolean
  defaultable?: boolean
  parseable?: boolean
  orderable?: boolean
  partialOrderable?: boolean
  forceHeap?: boolean
  typeName?: string
}

export type SupportedLanguages = 'typescript' | 'rust'
export interface ValidatorExportOptions {
  language?: SupportedLanguages
  jsonSafeTypes?: boolean
  types?: boolean
  parent?: ValidatorBase
  taggedUnionKey?: string
  typeDefinitions?: Record<string, string>
  typeNameFromParent?: string
}

export function isValidator(value: unknown): value is ValidatorBase {
  if (value instanceof ValidatorBase) {
    return true
  }
  return false
}

export function generateOptionsString(options: ValidatorOptions, defaults: ValidatorOptions): string {
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
  if (options.typeName !== undefined && options.typeName !== defaults.typeName) {
    selectedOptions.push(`typeName: ${options.typeName}`)
  }
  if (options.comparable !== undefined && options.comparable !== defaults.comparable) {
    selectedOptions.push(`comparable: ${options.comparable}`)
  }
  if (options.partialComparable !== undefined && options.partialComparable !== defaults.partialComparable) {
    selectedOptions.push(`partialComparable: ${options.partialComparable}`)
  }
  if (options.defaultable !== undefined && options.defaultable !== defaults.defaultable) {
    selectedOptions.push(`defaultable: ${options.defaultable}`)
  }
  if (options.hashable !== undefined && options.hashable !== defaults.hashable) {
    selectedOptions.push(`hashable: ${options.hashable}`)
  }
  if (options.copyable !== undefined && options.copyable !== defaults.copyable) {
    selectedOptions.push(`copyable: ${options.copyable}`)
  }
  if (options.parseable !== undefined && options.parseable !== defaults.parseable) {
    selectedOptions.push(`parseable: ${options.parseable}`)
  }
  if (options.orderable !== undefined && options.orderable !== defaults.orderable) {
    selectedOptions.push(`orderable: ${options.orderable}`)
  }
  if (options.partialOrderable !== undefined && options.partialOrderable !== defaults.partialOrderable) {
    selectedOptions.push(`partialOrderable: ${options.partialOrderable}`)
  }
  if (options.forceHeap !== undefined && options.forceHeap !== defaults.forceHeap) {
    selectedOptions.push(`forceHeap: ${options.forceHeap}`)
  }
  return selectedOptions.length > 0 ? `{ ${selectedOptions.join(', ')} }` : ''
}

export abstract class ValidatorBase<T = unknown> {
  public tsType!: T
  public required: boolean
  public nullable: boolean
  public earlyFail: boolean
  public comparable: boolean
  public partialComparable: boolean
  public hashable: boolean
  public defaultable: boolean
  public copyable: boolean
  public parseable: boolean
  public orderable: boolean
  public partialOrderable: boolean
  public forceHeap: boolean
  public typeName: string | undefined

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
      partialComparable: false,
      hashable: false,
      defaultable: false,
      copyable: false,
      parseable: false,
      orderable: false,
      partialOrderable: false,
      forceHeap: false,
      typeName: undefined
    }
    const mergedOptions = { ...defaults, ...options }

    this.optionsString = options ? generateOptionsString(options, defaults) : ''

    this.required = mergedOptions.required
    this.earlyFail = mergedOptions.earlyFail
    this.nullable = mergedOptions.nullable
    this.comparable = mergedOptions.comparable
    this.partialComparable = mergedOptions.partialComparable
    this.hashable = mergedOptions.hashable
    this.defaultable = mergedOptions.defaultable
    this.typeName = mergedOptions.typeName
    this.copyable = mergedOptions.copyable
    this.parseable = mergedOptions.parseable
    this.orderable = mergedOptions.orderable
    this.partialOrderable = mergedOptions.partialOrderable
    this.forceHeap = mergedOptions.forceHeap
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
