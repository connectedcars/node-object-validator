import { RequiredFail, ValidationErrorContext, ValidationFailure, ValidationsError } from './errors'

// https://stackoverflow.com/questions/51651499/typescript-what-is-a-naked-type-parameter
// https://2ality.com/2019/07/testing-static-types.html
// Wrapping the types in an tuple force a specific type instead of allow any in the union
export type AssertEqual<T, Expected> = [T, Expected] extends [Expected, T] ? true : never

// TODO: Give better name
export function isValidType<T>(value: unknown, errors: ValidationFailure[]): value is T {
  return errors.length === 0
}

export type CodeGenResult = [{ [key: string]: unknown }, string[], string[]]

/**
 * @typedef ValidatorOptions
 * @property {boolean} [optimize=true] Generate an optimized function for doing the validation (default: true)
 */
export type ValidatorOptions = {
  /**
   * Generate an optimized function for doing the validation (default: false)
   */
  optimize?: boolean
  required?: boolean
  nullCheck?: boolean
  earlyFail?: boolean
}

export interface ValidateOptions {
  earlyFail?: boolean
  optimized?: boolean
}

export interface ValidatorExportOptions {
  types?: boolean
}

export interface Validator {
  validate(value: unknown, context?: ValidationErrorContext, options?: ValidateOptions): ValidationFailure[]
  codeGen(
    valueRef: string,
    validatorRef: string,
    id: () => number,
    context?: ValidationErrorContext,
    earlyFail?: boolean
  ): CodeGenResult
  toString(options?: ValidatorExportOptions): string
}

export function isValidator(value: unknown): value is Validator {
  if (value instanceof ValidatorBase) {
    return true
  }
  return false
}

export function generateOptionsString(options: ValidatorOptions, defaults: Required<ValidatorOptions>): string {
  const selectedOptions: string[] = []
  if (options.required !== undefined && options.required !== defaults.required) {
    selectedOptions.push(`required: ${options.required}`)
  }
  if (options.nullCheck !== undefined && options.nullCheck !== defaults.nullCheck) {
    selectedOptions.push(`nullCheck: ${options.nullCheck}`)
  }
  if (options.earlyFail !== undefined && options.earlyFail !== defaults.earlyFail) {
    selectedOptions.push(`earlyFail: ${options.earlyFail}`)
  }
  if (options.optimize !== undefined && options.optimize !== defaults.optimize) {
    selectedOptions.push(`optimize: ${options.optimize}`)
  }
  return selectedOptions.length > 0 ? `{ ${selectedOptions.join(', ')} }` : ''
}

export abstract class ValidatorBase<T> implements Validator {
  public schema?: unknown
  public required: boolean
  public nullCheck: boolean
  public earlyFail: boolean

  protected codeGenId = 1
  protected optimizedValidate: ((value: unknown, context?: ValidationErrorContext) => ValidationFailure[]) | null
  protected optionsString: string

  public constructor(options?: ValidatorOptions) {
    const defaults = { required: true, nullCheck: true, earlyFail: false, optimize: false }
    const mergedOptions = { ...defaults, ...options }

    this.optionsString = options ? generateOptionsString(options, defaults) : ''

    this.required = mergedOptions.required
    this.nullCheck = mergedOptions.nullCheck
    this.earlyFail = mergedOptions.earlyFail
    this.optimizedValidate = null
  }

  public isValid(obj: unknown): obj is T {
    const errors = this.validate(obj)
    return errors.length === 0
  }

  public isType(obj: unknown, errors: ValidationFailure[]): obj is T {
    return errors.length === 0
  }

  public cast(obj: unknown): T {
    const errors = this.validate(obj)
    if (this.isType(obj, errors)) {
      return obj
    } else {
      throw new ValidationsError('One of more validations failed', errors)
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext, options?: ValidateOptions): ValidationFailure[] {
    if (options?.optimized !== false && this.optimizedValidate !== null) {
      return this.optimizedValidate(value, context)
    }
    if (this.nullCheck && value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return this.validateValue(value, context, { earlyFail: this.earlyFail, optimized: false, ...options })
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: ValidationErrorContext,
    earlyFail?: boolean
  ): CodeGenResult {
    const contextStr = context
      ? `, { key: (context && context.key ? \`\${context.key}['${context.key}']\` : \`${context.key}\`) }`
      : ', context'
    const validatorName = `validator${id()}`
    const declarations = [`const ${validatorName} = ${validatorRef}`]
    // prettier-ignore
    const code: string[] = [
      `if (${valueRef} != null) {`,
      `  errors.push(...${validatorName}.validateValue(${valueRef}${contextStr}))`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredFail(\`Is required\`${contextStr}))`] : []),
      '}',
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

  protected optimize(): void {
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
        schema: this.schema,
        validateValue: this.validateValue.bind(this)
      })
      this.optimizedValidate = validateFunction
    } catch (e) {
      throw new Error(`Failed to compile optimized function(${e.message}):\n${functionBody}`)
    }
  }

  public abstract toString(options?: ValidatorExportOptions): string

  protected abstract validateValue(
    value: unknown,
    context?: ValidationErrorContext,
    options?: ValidateOptions
  ): ValidationFailure[]
}
