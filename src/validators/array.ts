import {
  CodeGenResult,
  ValidateOptions,
  ValidatorBase,
  ValidatorBaseOptions,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { NotArrayFail, RequiredFail, ValidationFailure, WrongLengthFail } from '../errors'

export function isArray<T extends ValidatorBase>(
  schema: T,
  value: unknown,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  context?: string
): value is Array<T['tsType']> {
  const errors = validateArray(schema, value, minLength, maxLength, context, { earlyFail: true })
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateArray(
  schema: ValidatorBase,
  value: unknown,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  context?: string,
  options?: ValidateOptions
): ValidationFailure[] {
  if (!Array.isArray(value)) {
    return [new NotArrayFail(`Must be an array`, value, context)]
  }
  if ((minLength !== 0 && value.length < minLength) || value.length > maxLength) {
    return [
      new WrongLengthFail(
        `Must contain between ${minLength} and ${maxLength} entries (found ${value.length})`,
        value,
        context
      )
    ]
  }
  const errors = []
  const validator = schema
  for (const [i, item] of value.entries()) {
    errors.push(
      ...validator.validate(item, `${context || ''}[${i}]`, { optimized: false, earlyFail: false, ...options })
    )
    if (options?.earlyFail && errors.length > 0) {
      return errors
    }
  }
  return errors
}

export abstract class ArrayValidator<T extends ValidatorBase = never, O = never> extends ValidatorBase<
  Array<T['tsType']> | O
> {
  public schema: T
  private minLength: number
  private maxLength: number

  public constructor(schema: T, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorBaseOptions) {
    super(options)
    this.schema = schema
    this.minLength = minLength
    this.maxLength = maxLength
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

    const arrayValueRef = `arrayValue${id()}`
    const iRef = `i${id()}`
    const itemRef = `item${id()}`
    const schemaRef = `scheme${id()}`
    let imports: { [key: string]: unknown } = {
      NotArrayFail: NotArrayFail,
      WrongLengthFail: WrongLengthFail,
      RequiredFail: RequiredFail
    }
    const declarations = [`const ${schemaRef} = ${validatorRef}.schema`]

    const validator = this.schema
    const [propImports, propDeclarations, propCode] = validator.codeGen(
      itemRef,
      schemaRef,
      id,
      `${context || ''}[\${${iRef}}]`,
      earlyFail
    )
    imports = { ...imports, ...propImports }
    declarations.push(...propDeclarations)

    // prettier-ignore
    const code = [
      `const ${arrayValueRef} = ${valueRef}`,
      ...this.nullCheckWrap([
      `  if (Array.isArray(${arrayValueRef})){`,
      `    if (${this.minLength ? `${arrayValueRef}.length >= ${this.minLength} && ` : '' }${arrayValueRef}.length <= ${this.maxLength}) {`,
      `      for (const [${iRef}, ${itemRef}] of ${arrayValueRef}.entries()) {`,
      ...propCode.map(l => `        ${l}`),
      `      }`,
      `    } else {`,
      `      errors.push(new WrongLengthFail(\`Must contain between ${this.minLength} and ${this.maxLength} entries (found \${${arrayValueRef}.length})\`, ${arrayValueRef}${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotArrayFail(\`Must be an array\`, ${arrayValueRef}${contextStr}))`,
      `  }`,
      ], arrayValueRef, contextStr),
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
    return validateArray(this.schema, value, this.minLength, this.maxLength, context, {
      earlyFail: this.earlyFail,
      ...options
    })
  }

  private typeString(options?: ValidatorExportOptions): string {
    const language = options?.language ?? 'typescript'
    switch (language) {
      case 'typescript': {
        let typeStr = `Array<${this.schema.toString(options)}>`

        if (this.required === false) {
          typeStr += ` | undefined`
        }
        if (this.nullable === true) {
          typeStr += ` | null`
        }

        return typeStr
      }
      case 'rust': {
        const isOption = !this.schema.required || this.schema.nullable
        const schemaStr = this.schema.toString(options)
        const innerType = isOption ? `Option<${schemaStr}>` : schemaStr
        return `Vec<${innerType}>`
      }
      default: {
        throw new Error(`Language: '${options?.language}' unknown`)
      }
    }
  }

  private constructorString(options?: ValidatorExportOptions): string {
    const schemaStr = this.schema.toString(options)
    const minLengthStr = this.minLength !== 0 || this.maxLength !== Number.MAX_SAFE_INTEGER ? `, ${this.minLength}` : ''
    const maxLengthStr = this.maxLength !== Number.MAX_SAFE_INTEGER ? `, ${this.maxLength}` : ''
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''

    return `new ${this.constructor.name}(${schemaStr}${minLengthStr}${maxLengthStr}${optionsStr})`
  }
}

export class RequiredArray<T extends ValidatorBase> extends ArrayValidator<T> {
  public constructor(schema: T, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(schema, minLength, maxLength, { ...options })
  }
}

export class OptionalArray<T extends ValidatorBase> extends ArrayValidator<T, undefined> {
  public constructor(schema: T, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(schema, minLength, maxLength, { ...options, required: false })
  }
}

export class NullableArray<T extends ValidatorBase> extends ArrayValidator<T, null> {
  public constructor(schema: T, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(schema, minLength, maxLength, { ...options, nullable: true })
  }
}

export class OptionalNullableArray<T extends ValidatorBase> extends ArrayValidator<T, undefined | null> {
  public constructor(schema: T, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, options?: ValidatorOptions) {
    super(schema, minLength, maxLength, { ...options, required: false, nullable: true })
  }
}
