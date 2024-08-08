import { UnionValidator, UnixDateTimeValidator } from '..'
import { CodeGenResult, ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotObjectFail, RequiredFail, ValidationFailure } from '../errors'
import { addTypeDef, toPascalCase, toSnakeCase } from '../util'

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
  options?: ValidatorOptions
): ValidationFailure[] {
  const errors: ValidationFailure[] = []
  if (!isPlainObject(value)) {
    errors.push(new NotObjectFail(`Must be an object`, value, context))
    return errors
  }
  for (const key of Object.keys(schema)) {
    const validator = schema[key]
    const keyName = context ? `${context}['${key}']` : key
    errors.push(...validator.validate(value[key], keyName, { optimize: false, earlyFail: false, ...options }))
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
  public typeName?: string

  private deriveMacro?: string[]

  public constructor(schema: T, options?: ValidatorOptions) {
    super(options)
    this.typeName = options?.typeName
    this.schema = schema
    this.deriveMacro = options?.deriveMacro
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

  protected validateValue(value: unknown, context?: string, options?: ValidatorOptions): ValidationFailure[] {
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
        if (options?.typeDefinitions === undefined) {
          throw new Error(`'typeDefinitions' is not set on ${this.toString()}`)
        }
        if (options?.parent === undefined) {
          if (this.typeName === undefined) {
            throw new Error(`'typeName' option is not set, with no parent set on ${this.toString()}`)
          }
        } else {
          if (this.typeName === undefined) {
            if (options.typeNameFromParent === undefined) {
              throw new Error(`'typeName' option is not set, and 'options.objectKey' is not set on ${this.toString()}`)
            } else {
              this.typeName = toPascalCase(`${options.typeNameFromParent}`)
            }
          }
        }

        // Serde
        let serdeStr: string
        let deriveMacro: string[] | undefined = undefined

        if (this.deriveMacro !== undefined) {
          const deriveMacroStr = this.deriveMacro.join(', ')
          serdeStr = `#[derive(${deriveMacroStr})]\n`
          deriveMacro = this.deriveMacro
        } else if (options.deriveMacro !== undefined) {
          const deriveMacroStr = options.deriveMacro.join(', ')
          serdeStr = `#[derive(${deriveMacroStr})]\n`
          deriveMacro = this.deriveMacro
        } else {
          serdeStr = `#[derive(Serialize, Deserialize, Debug, Clone)]\n`
        }
        serdeStr += `#[serde(rename_all = "camelCase")]\n`

        // Type definition
        const lines = Object.entries(this.schema)
          .filter(([k]) => options.taggedUnionKey === undefined || k !== options.taggedUnionKey)
          .map(([k, v]) => {
            let serdeWithStr = ``
            // The Date and DateTime variants uses the default
            if (v instanceof UnixDateTimeValidator) {
              if (v.required === false || v.nullable === true) {
                throw new Error(
                  `Object key cannot be an Optional UnixDateTime. (Needs custom serialization). For: ${k.toString()}`
                )
              }
              serdeWithStr += `    #[serde(with = "chrono::serde::ts_seconds")]\n`
            }
            if (v.required === false || v.nullable === true) {
              serdeWithStr += `    #[serde(skip_serializing_if = "Option::is_none")]\n`
            }
            return `${serdeWithStr}    pub ${toSnakeCase(k)}: ${v.toString({ ...options, parent: this, typeNameFromParent: k, deriveMacro })},`
          })

        // If part of a Union
        // Don't addTypeDef() when in an enum with wrapped values (non tagged union)
        if (options?.parent instanceof UnionValidator) {
          if (Object.keys(this.schema).length === 1) {
            // Rust enum with data inside
            // If there's only 1 key in this.schema, save that single key as 'enumVariantName'
            // B example: rust: Enum{A, B(u8)} -> { 'b': 85 }
            const [enumVariantName, enumVariantValue] = Object.entries(this.schema)[0]
            return `${toPascalCase(enumVariantName)}(${enumVariantValue.toString({ ...options, parent: this, deriveMacro })})`
          } else {
            const typeDef = `${serdeStr}pub struct ${this.typeName} {\n${lines.join('\n')}\n}\n\n`
            addTypeDef(this.typeName, typeDef, options?.typeDefinitions)
            return this.typeName
          }
        } else {
          // Tagged union
          const typeDef = `${serdeStr}pub struct ${this.typeName} {\n${lines.join('\n')}\n}\n\n`
          addTypeDef(this.typeName, typeDef, options?.typeDefinitions)
        }

        // Normal reference
        const isOption = !this.required || this.nullable
        return isOption ? `Option<${this.typeName}>` : `${this.typeName}`
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
