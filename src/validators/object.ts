import {
  CodeGenResult,
  ValidateOptions,
  Validator,
  ValidatorBase,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { NotObjectFail, RequiredFail, ValidationErrorContext, ValidationFailure } from '../errors'

export function isObject<T extends Record<string, unknown>>(
  schema: Record<string, Validator>,
  value: unknown,
  context?: ValidationErrorContext
): value is T {
  const errors = validateObject(schema, value, context, { earlyFail: true })
  if (errors.length === 0) {
    return true
  }
  return false
}

function isObjectType(value: unknown): value is { [key: string]: unknown } {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function validateObject(
  schema: Record<string, Validator>,
  value: unknown,
  context?: ValidationErrorContext,
  options?: ValidateOptions
): ValidationFailure[] {
  const errors: ValidationFailure[] = []
  if (!isObjectType(value)) {
    errors.push(new NotObjectFail(`Must be an object (received "${value}")`, context))
    return errors
  }
  for (const key of Object.keys(schema)) {
    const validator = schema[key]
    const keyName = context?.key ? `${context.key}['${key}']` : key
    errors.push(...validator.validate(value[key], { key: keyName }, { optimized: false, earlyFail: false, ...options }))
    if (options?.earlyFail && errors.length > 0) {
      return errors
    }
  }
  return errors
}

export class ObjectValidator<T extends Record<string, unknown>, O = never> extends ValidatorBase<T | O> {
  public schema: Record<string, Validator>

  public constructor(schema: Record<string, Validator>, options?: ValidatorOptions) {
    super(options)
    this.schema = schema
    if (options?.optimize) {
      this.optimize()
    }
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
    const contextStr = context ? `, { key: \`${context.key}\` }` : ', context'
    const objValueRef = `objValue${id()}`
    const schemaRef = `scheme${id()}`
    let imports: { [key: string]: unknown } = {
      NotObjectError: NotObjectFail,
      RequiredError: RequiredFail
    }
    const declarations = [`const ${schemaRef} = ${validatorRef}.schema`]

    // prettier-ignore
    const code = [
      `const ${objValueRef} = ${valueRef}`,
      `if (${objValueRef} != null) {`,
      `  if (typeof ${objValueRef} === 'object' && !Array.isArray(${objValueRef})){`
    ]
    for (const key of Object.keys(this.schema)) {
      const validator = this.schema[key]
      const propName = context?.key ? `${context.key}['${key}']` : key
      const [propImports, propDeclarations, propCode] = validator.codeGen(
        `${objValueRef}['${key}']`,
        `${schemaRef}['${key}']`,
        id,
        {
          key: propName
        },
        earlyFail
      )
      imports = { ...imports, ...propImports }
      declarations.push(...propDeclarations)
      code.push(...propCode.map(l => `    ${l}`))
    }
    // prettier-ignore
    code.push(
      `  } else {`,
      `    errors.push(new NotObjectError(\`Must be an object (received "\${${valueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
      '}',
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),

    )

    return [imports, declarations, code]
  }

  public toString(options?: ValidatorExportOptions): string {
    const schemaStr = `{\n${Object.keys(this.schema)
      .map(k => `'${k}': ${this.schema[k].toString(options)}`.replace(/(^|\n)/g, '$1  '))
      .join(',\n')}\n}`
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${schemaStr}${optionsStr})`
  }

  protected validateValue(
    value: unknown,
    context?: ValidationErrorContext,
    options?: ValidateOptions
  ): ValidationFailure[] {
    return validateObject(this.schema, value, context, { earlyFail: this.earlyFail, ...options })
  }
}

export class RequiredObject<T extends Record<string, unknown>> extends ObjectValidator<T> {
  public constructor(schema: Record<string, Validator>, options?: ValidatorOptions) {
    super(schema, { ...options, required: true })
  }
}

export class OptionalObject<T extends Record<string, unknown>> extends ObjectValidator<T, null | undefined> {
  public constructor(schema: Record<string, Validator>, options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}
