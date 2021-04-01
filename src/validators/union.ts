import {
  CodeGenResult,
  ValidateOptions,
  Validator,
  ValidatorBase,
  ValidatorExportOptions,
  ValidatorOptions
} from '../common'
import { NotObjectFail, RequiredFail, UnionFail, ValidationErrorContext, ValidationFailure } from '../errors'
import { ExactStringValidator } from './exact-string'
import { isPlainObject, ObjectValidator } from './object'

export function isUnion<T>(schema: Validator[], value: unknown, context?: ValidationErrorContext): value is T {
  const errors = validateUnion(schema, value, context)
  if (errors.length === 0) {
    return true
  }
  return false
}

function findUnionKey(schema: ObjectValidator[]): string | null {
  let unionKey: string | null = null
  for (const key of Object.keys(schema[0].schema)) {
    const firstValidator = schema[0].schema[key]
    if (firstValidator instanceof ExactStringValidator) {
      const seenExpected: string[] = [firstValidator.expected]
      for (let i = 1; i < schema.length; i++) {
        const validator = schema[i].schema[key]
        if (validator instanceof ExactStringValidator) {
          if (seenExpected.includes(validator.expected)) {
            break
          }
          seenExpected.push(validator.expected)
        }
      }
      if (seenExpected.length === schema.length) {
        unionKey = key
        break
      }
    }
  }
  return unionKey
}

export interface ValidateUnionOptions extends ValidateOptions {
  every?: boolean
}

export function validateUnion(
  schema: Validator[],
  value: unknown,
  context?: ValidationErrorContext,
  options?: ValidateUnionOptions
): ValidationFailure[] {
  const errors: ValidationFailure[] = []

  if (!options?.every && schema.length > 1 && schema.every((v): v is ObjectValidator => v instanceof ObjectValidator)) {
    const unionKey = findUnionKey(schema)
    if (unionKey !== null) {
      if (!isPlainObject(value)) {
        return [new NotObjectFail(`Must be an object (received "${value}")`, context)]
      }
      for (const validator of schema) {
        const errors = validator.schema[unionKey].validate(value[unionKey])
        if (errors.length === 0) {
          return validator.validate(value, context, options)
        }
      }
      return [new UnionFail(`Union key '${unionKey}' did not match (received "${value}")`, [], context)]
    }
  }

  for (const [index, validator] of schema.entries()) {
    const propName = `${context?.key || ''}(${index})`
    const currentErrors = validator.validate(
      value,
      { key: propName },
      { optimized: false, earlyFail: false, ...options }
    )
    if (currentErrors.length === 0) {
      return []
    } else {
      errors.push(
        new UnionFail(`Union entry failed validation with ${currentErrors.length} errors`, currentErrors, {
          key: propName
        })
      )
      if (options?.earlyFail) {
        return errors
      }
    }
  }
  return errors
}

export interface UnionValidatorOptions extends ValidatorOptions {
  every?: boolean
}

export class UnionValidator<T, O = never> extends ValidatorBase<T | O> {
  public schema: Validator[]
  private every: boolean

  public constructor(schema: Validator[], options?: UnionValidatorOptions) {
    super(options)
    this.schema = schema
    this.every = options?.every ? true : false
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
    const contextStr = context?.key ? `, { key: \`${context.key}\` }` : ', context'
    const unionValueRef = `unionValue${id()}`
    const schemaRef = `scheme${id()}`
    let imports: { [key: string]: unknown } = {
      RequiredFail: RequiredFail,
      UnionFail: UnionFail,
      NotObjectFail: NotObjectFail
    }
    const declarations = [`const ${schemaRef} = ${validatorRef}.schema`]

    // prettier-ignore
    const code = [
      `const ${unionValueRef} = ${valueRef}`,
      `const ${unionValueRef}orgErrors = errors`,
      `let ${unionValueRef}Errors = []`,
      `if (${unionValueRef} != null) {`,
      `  let errors = []`,
    ]

    let unionCode: string[] = []

    // Try to find an common key for the union to skip checking all entries
    let unionKey: string | null = null
    let unionKeyValueRef = ''
    if (
      !this.every &&
      this.schema.length > 1 &&
      this.schema.every((v): v is ObjectValidator => v instanceof ObjectValidator)
    ) {
      unionKey = findUnionKey(this.schema)
      if (unionKey !== null) {
        unionKeyValueRef = `unionKeyValue${id()}`
        unionCode.push(`  const ${unionKeyValueRef} = ${unionValueRef}['${unionKey}']`)
      }
    }

    for (const [index, validator] of this.schema.entries()) {
      const propName = context?.key ? `${context.key}('${index}')` : `(${index})`
      const [propImports, propDeclarations, propCode] = validator.codeGen(
        unionValueRef,
        `${schemaRef}[${index}]`,
        id,
        unionKey
          ? context
          : {
              key: propName
            }
      )
      imports = { ...imports, ...propImports }
      declarations.push(...propDeclarations)

      let entryCode = propCode.map(l => `  ${l}`)

      if (unionKey) {
        const expectedString = ((validator as ObjectValidator).schema[
          unionKey
        ] as ExactStringValidator).expected.replace(/'/g, "\\'")

        // prettier-ignore
        entryCode = [
          `  ${index > 0 ? '} else ' : ''}if (${unionKeyValueRef} === '${expectedString}') {`,
            ...entryCode.map(l => `  ${l}`),
          `    ${unionValueRef}Errors.push(...errors)`,
          ...(index === this.schema.length - 1 ? [
          `  } else {`,
          `     ${unionValueRef}Errors.push(new UnionFail(\`Union key '${unionKey}' did not match (received "\${${valueRef}}")\`, []${contextStr}))`,
          `  }`
          ]: []),
        ]
      } else {
        if (index > 0) {
          // prettier-ignore
          entryCode = [
            `  if (${unionValueRef}Errors.length > 0) {`,
            ...entryCode.map(l => `  ${l}`),
            `  }`
          ]
        }

        // prettier-ignore
        entryCode.push(
          `  if (errors.length > 0) {`,
          `    ${unionValueRef}Errors.push(`,
          `      new UnionFail(\`Union entry failed validation with \${errors.length} errors\`, errors, { key: '${propName}' })`,
          '    )',
          `  } else {`,
          `    ${unionValueRef}Errors = []`,
          `  }`,
          `  errors = []`
        )
      }

      unionCode.push(...entryCode)
    }

    if (unionKey !== null) {
      // prettier-ignore
      unionCode = [
        `  if (typeof ${unionValueRef} === 'object' && !Array.isArray(${unionValueRef})) {`,
        ...unionCode.map(l => `  ${l}`),
        `  } else {`,
        `    ${unionValueRef}Errors.push(new NotObjectFail(\`Must be an object (received "\${${valueRef}}")\`${contextStr}))`,
        `  }`
      ]
    }

    // prettier-ignore
    code.push(
      ...unionCode,
      `  ${unionValueRef}orgErrors.push(...${unionValueRef}Errors)`,
      ...(this.required ? [
      `} else {`,
      `  errors.push(new RequiredFail(\`Is required\`${contextStr}))`] : []),
      '}',
      ...(earlyFail ? [
      `if (errors.length > 0) {`,
      `  return errors`,
      `}`] : []),
    )

    return [imports, declarations, code]
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types) {
      return `${this.schema.map(v => v.toString(options)).join(' | ')}`
    }
    const schemaStr = `[\n${this.schema.map(v => `${v.toString(options).replace(/(^|\n)/g, '$1  ')}`).join(',\n')}\n]`
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${schemaStr}${optionsStr})`
  }

  protected validateValue(
    value: unknown,
    context?: ValidationErrorContext,
    options?: ValidateOptions
  ): ValidationFailure[] {
    return validateUnion(this.schema, value, context, { earlyFail: this.earlyFail, every: this.every, ...options })
  }
}

export class RequiredUnion<T> extends UnionValidator<T> {
  public constructor(schema: Validator[], options?: ValidatorOptions) {
    super(schema, { ...options, required: true })
  }
}

export class OptionalUnion<T> extends UnionValidator<T, undefined | null> {
  public constructor(schema: Validator[], options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}

export class EnumValidator<T, O = never> extends UnionValidator<T, O> {
  public constructor(schema: string[], options?: ValidatorOptions) {
    super(
      schema.map(e => new ExactStringValidator(e)),
      options
    )
  }
}

export class RequiredEnum<T> extends EnumValidator<T> {
  public constructor(schema: string[], options?: ValidatorOptions) {
    super(schema, { ...options, required: true })
  }
}

export class OptionalEnum<T> extends EnumValidator<T, undefined | null> {
  public constructor(schema: string[], options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}
