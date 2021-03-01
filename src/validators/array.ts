import { CodeGenResult, Validator, ValidatorBase, ValidatorOptions } from '../common'
import { NotArrayFail, RequiredFail, ValidationErrorContext, ValidationFailure, WrongLengthFail } from '../errors'

// TODO: Implement isArray function

export function validateArray(
  schema: Validator,
  value: unknown,
  minLength = 0,
  maxLength = Number.MAX_SAFE_INTEGER,
  context?: ValidationErrorContext
): ValidationFailure[] {
  if (!Array.isArray(value)) {
    return [new NotArrayFail(`Must be an array (received "${value}")`, context)]
  }
  if ((minLength !== 0 && value.length < minLength) || value.length > maxLength) {
    return [
      new WrongLengthFail(`Must contain between ${minLength} and ${maxLength} entries (found ${value.length})`, context)
    ]
  }
  const errors = []
  const validator = schema
  for (const [i, item] of value.entries()) {
    errors.push(...validator.validate(item, { key: `${context?.key || ''}[${i}]` }))
  }
  return errors
}

export class ArrayValidator<T extends Array<unknown>, O = never> extends ValidatorBase<T | O> {
  public schema: Validator
  private minLength: number
  private maxLength: number
  private required: boolean

  public constructor(
    schema: Validator,
    minLength = 0,
    maxLength = Number.MAX_SAFE_INTEGER,
    options?: ValidatorOptions
  ) {
    super()
    this.schema = schema
    this.minLength = minLength
    this.maxLength = maxLength
    const mergedOptions = { required: true, optimize: false, ...options }
    this.required = mergedOptions.required
    if (mergedOptions.optimize) {
      this.optimize()
    }
  }

  public validate(value: unknown, context?: ValidationErrorContext): ValidationFailure[] {
    if (value == null) {
      return this.required ? [new RequiredFail(`Is required`, context)] : []
    }
    return validateArray(this.schema, value, this.minLength, this.maxLength, context)
  }

  public codeGen(
    valueRef: string,
    validatorRef: string,
    id = () => {
      return this.codeGenId++
    },
    context?: ValidationErrorContext
  ): CodeGenResult {
    const contextStr = context ? `, { key: \`${context.key}\` }` : ', context'
    const arrayValueRef = `arrayValue${id()}`
    const iRef = `i${id()}`
    const itemRef = `item${id()}`
    const schemaRef = `scheme${id()}`
    let imports: { [key: string]: unknown } = {
      NotArrayFail: NotArrayFail,
      WrongLengthFail: WrongLengthFail,
      RequiredError: RequiredFail
    }
    const declarations = [`const ${schemaRef} = ${validatorRef}.schema`]

    const validator = this.schema
    const [propImports, propDeclarations, propCode] = validator.codeGen(itemRef, schemaRef, id, {
      key: `${context?.key || ''}[\${${iRef}}]`
    })
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
      `      errors.push(new WrongLengthFail(\`Must contain between ${this.minLength} and ${this.maxLength} entries (found \${${arrayValueRef}.length})\`${contextStr}))`,
      `    }`,
      `  } else {`,
      `    errors.push(new NotArrayFail(\`Must be an array (received "\${${valueRef}}")\`${contextStr}))`,
      `  }`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredError(\`Is required\`${contextStr}))`] : []),
      '}'
    ]

    return [imports, declarations, code]
  }
}

export class RequiredArray<T extends Array<unknown>> extends ArrayValidator<T> {
  private validatorType: 'RequiredArray' = 'RequiredArray'

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
  private validatorType: 'OptionalArray' = 'OptionalArray'

  public constructor(
    schema: Validator,
    minLength = 0,
    maxLength = Number.MAX_SAFE_INTEGER,
    options?: ValidatorOptions
  ) {
    super(schema, minLength, maxLength, { ...options, required: false })
  }
}
