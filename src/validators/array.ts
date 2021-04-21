import {
  CodeGenResult,
  ValidateOptions,
  Validator,
  ValidatorBase,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { NotArrayFail, RequiredFail, ValidationFailure, WrongLengthFail } from '../errors'

export function isArray<T>(
  schema: Validator,
  value: unknown,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  context?: string
): value is T {
  const errors = validateArray(schema, value, minLength, maxLength, context, { earlyFail: true })
  if (errors.length === 0) {
    return true
  }
  return false
}

export function validateArray(
  schema: Validator,
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

export class ArrayValidator<T extends Array<unknown>, O = never> extends ValidatorBase<T | O> {
  public schema: Validator
  private minLength: number
  private maxLength: number

  public constructor(
    schema: Validator,
    minLength = 0,
    maxLength = Number.MAX_SAFE_INTEGER,
    options?: ValidatorOptions
  ) {
    super(options)
    this.schema = schema
    this.minLength = minLength
    this.maxLength = maxLength
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
      `if (${arrayValueRef} != null) {`,
      `  if (Array.isArray(${arrayValueRef})){`,
      `    if (${this.minLength ? `${arrayValueRef}.length >= ${this.minLength} && ` : '' }${arrayValueRef}.length < ${this.maxLength}) {`,
      `      for (const [${iRef}, ${itemRef}] of ${arrayValueRef}.entries()) {`,
      ...propCode.map(l => `        ${l}`),
      `      }`,
      `    } else {`,
      `      errors.push(new WrongLengthFail(\`Must contain between ${this.minLength} and ${this.maxLength} entries (found \${${arrayValueRef}.length})\`, ${arrayValueRef}${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotArrayFail(\`Must be an array\`, ${arrayValueRef}${contextStr}))`,
      `  }`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredFail(\`Is required\`, ${arrayValueRef}${contextStr}))`] : []),
      '}',
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),
    ]

    return [imports, declarations, code]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return `Array<${this.schema.toString(options)}>`
    }
    const schemaStr = this.schema.toString(options)
    const minLengthStr = this.minLength !== 0 || this.maxLength !== Number.MAX_SAFE_INTEGER ? `, ${this.minLength}` : ''
    const maxLengthStr = this.maxLength !== Number.MAX_SAFE_INTEGER ? `, ${this.maxLength}` : ''
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${schemaStr}${minLengthStr}${maxLengthStr}${optionsStr})`
  }

  protected validateValue(value: unknown, context?: string, options?: ValidateOptions): ValidationFailure[] {
    return validateArray(this.schema, value, this.minLength, this.maxLength, context, {
      earlyFail: this.earlyFail,
      ...options
    })
  }
}

export class RequiredArray<T extends Array<unknown>> extends ArrayValidator<T> {
  public constructor(
    schema: Validator,
    minLength = 0,
    maxLength = Number.MAX_SAFE_INTEGER,
    options?: ValidatorOptions
  ) {
    super(schema, minLength, maxLength, { ...options, required: true })
  }
}

export class OptionalArray<T extends Array<unknown>> extends ArrayValidator<T, null | undefined> {
  public constructor(
    schema: Validator,
    minLength = 0,
    maxLength = Number.MAX_SAFE_INTEGER,
    options?: ValidatorOptions
  ) {
    super(schema, minLength, maxLength, { ...options, required: false })
  }
}
