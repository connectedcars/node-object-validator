import {
  CodeGenResult,
  ValidateOptions,
  ValidatorBase,
  ValidatorBaseOptions,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { NotObjectFail, RequiredFail, ValidationFailure } from '../errors'
import { toSnakeCase } from '../util'

export function isObject<T extends ObjectSchema>(
  schema: T,
  value: unknown,
  context?: string
): value is ObjectWrap<UndefinedToOptional<{ [K in keyof T]: T[K]['tsType'] }>> {
  const errors = validateObject(schema, value, context, { earlyFail: true })
  if (errors.length === 0) {
    return true
  }
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPlainObject(value: unknown): value is Record<string | number | symbol, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function validateObject(
  schema: Record<string, ValidatorBase>,
  value: unknown,
  context?: string,
  options?: ValidateOptions
): ValidationFailure[] {
  const errors: ValidationFailure[] = []
  if (!isPlainObject(value)) {
    errors.push(new NotObjectFail(`Must be an object`, value, context))
    return errors
  }
  for (const key of Object.keys(schema)) {
    const validator = schema[key]
    const keyName = context ? `${context}['${key}']` : key
    errors.push(...validator.validate(value[key], keyName, { optimized: false, earlyFail: false, ...options }))
    if (options?.earlyFail && errors.length > 0) {
      return errors
    }
  }
  return errors
}

export type ObjectSchema = Record<string, ValidatorBase>

// https://github.com/Microsoft/TypeScript/issues/26705
export type IsUndefined<T, K> = undefined extends T ? K : never
export type IsNotUndefined<T, K> = undefined extends T ? never : K
export type UndefinedKeys<T> = { [K in keyof T]-?: IsUndefined<T[K], K> }[keyof T]
export type NotUndefinedKeys<T> = { [K in keyof T]-?: IsNotUndefined<T[K], K> }[keyof T]
export type IncludeUndefinedTypes<T extends Record<string, unknown>> = { [K in UndefinedKeys<T>]: T[K] }
export type ExcludeUndefinedTypes<T extends Record<string, unknown>> = { [K in NotUndefinedKeys<T>]: T[K] }
export type UndefinedToOptional<T extends Record<string, unknown>> = ExcludeUndefinedTypes<T> &
  Partial<IncludeUndefinedTypes<T>>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ObjectWrap<T> = T extends Record<string, any> ? { [K in keyof T]: T[K] } : never

export abstract class ObjectValidator<T extends ObjectSchema = never, O = never> extends ValidatorBase<
  ObjectWrap<UndefinedToOptional<{ [K in keyof T]: T[K]['tsType'] }>> | O
> {
  public schema: ObjectSchema
  private typeStringGenerated: boolean

  public constructor(schema: T, options?: ValidatorBaseOptions) {
    super(options)
    this.typeStringGenerated = false
    this.schema = schema
    if (options?.optimize !== false) {
      this.optimize(schema)
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
    const objValueRef = `objValue${id()}`
    const schemaRef = `scheme${id()}`
    let imports: { [key: string]: unknown } = {
      NotObjectFail: NotObjectFail,
      RequiredFail: RequiredFail
    }
    const declarations = [`const ${schemaRef} = ${validatorRef}.schema`]

    const propValidationCode: string[] = []
    for (const key of Object.keys(this.schema)) {
      const validator = this.schema[key]
      const propName = context ? `${context}['${key}']` : key
      const [propImports, propDeclarations, propCode] = validator.codeGen(
        `${objValueRef}['${key}']`,
        `${schemaRef}['${key}']`,
        id,
        propName,
        earlyFail
      )
      imports = { ...imports, ...propImports }
      declarations.push(...propDeclarations)
      propValidationCode.push(...propCode)
    }

    // prettier-ignore
    const code = [
      `const ${objValueRef} = ${valueRef}`,
      ...this.nullCheckWrap([
      `  if (typeof ${objValueRef} === 'object' ${!this.nullable ? `&& ${objValueRef} !== null ` : ''}&& !Array.isArray(${objValueRef})) {`,
      ...propValidationCode.map(l => `    ${l}`),
      `  } else {`,
      `    errors.push(new NotObjectFail(\`Must be an object\`, ${objValueRef}${contextStr}))`,
      `  }`,
      ], objValueRef, contextStr),
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),
    ]

    return [imports, declarations, code]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types === true) {
      return this.typeString(options)
    } else {
      return this.constructorString(options)
    }
  }

  protected validateValue(value: unknown, context?: string, options?: ValidateOptions): ValidationFailure[] {
    return validateObject(this.schema, value, context, { earlyFail: this.earlyFail, ...options })
  }

  private typeString(options?: ValidatorExportOptions): string {
    const language = options?.language ?? 'typescript'
    switch (language) {
      case 'typescript': {
        const lines = Object.keys(this.schema).map(k =>
          `'${k}': ${this.schema[k].toString(options)}`.replace(/(^|\n)/g, '$1  ')
        )
        let typeStr = `{\n${lines.join('\n')}\n}`

        if (this.required === false) {
          typeStr += ` | undefined`
        }
        if (this.nullable === true) {
          typeStr += ` | null`
        }

        return typeStr
      }
      case 'rust': {
        if (options?.rustTypeName === undefined) {
          throw new Error(`'rustTypeName' option is not set`)
        }
        if (!this.typeStringGenerated) {
          this.typeStringGenerated = true

          const lines = Object.keys(this.schema).map(k => `  ${toSnakeCase(k)}: ${this.schema[k].toString(options)},`)
          return `struct ${options?.rustTypeName} {\n${lines.join('\n')}\n}`
        }
        const isOption = !this.required || this.nullable
        return isOption ? `Option<${options.rustTypeName}>` : `${options.rustTypeName}`
      }
      default: {
        throw new Error(`Language: '${options?.language}' unknown`)
      }
    }
  }

  private constructorString(options?: ValidatorExportOptions): string {
    const lines = Object.keys(this.schema).map(k =>
      `'${k}': ${this.schema[k].toString(options)}`.replace(/(^|\n)/g, '$1  ')
    )
    const schemaStr = `{\n${lines.join(',\n')}\n}`
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${schemaStr}${optionsStr})`
  }
}

export class RequiredObject<T extends ObjectSchema> extends ObjectValidator<T> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options })
  }
}

export class OptionalObject<T extends ObjectSchema> extends ObjectValidator<T, undefined> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}

export class NullableObject<T extends ObjectSchema> extends ObjectValidator<T, null> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, nullable: true })
  }
}

export class OptionalNullableObject<T extends ObjectSchema> extends ObjectValidator<T, undefined | null> {
  public constructor(schema: T, options?: ValidatorOptions) {
    super(schema, { ...options, required: false, nullable: true })
  }
}
