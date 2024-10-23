import { addTypeDef, ArrayValidator, decoratorsString, ObjectValidator, RecordValidator, validateRustTypeName } from '..'
import { ValidatorBase, ValidatorExportOptions, ValidatorOptions } from '../common'
import { NotArrayFail, ValidationFailure, WrongLengthFail } from '../errors'

export function validateTuple(
  schema: ValidatorBase[],
  value: unknown,
  context?: string,
  options?: ValidatorOptions
): ValidationFailure[] {
  if (!Array.isArray(value)) {
    return [new NotArrayFail(`Must be an array`, value, context)]
  }
  if (value.length !== schema.length) {
    return [
      new WrongLengthFail(`Must contain exactly ${schema.length} entries (found ${value.length})`, value, context)
    ]
  }

  const errors = []
  for (let i = 0; i < schema.length; i++) {
    const validator = schema[i]
    const item = value[i]
    errors.push(
      ...validator.validate(item, `${context || ''}[${i}]`, { optimize: false, earlyFail: false, ...options })
    )
    if (options?.earlyFail && errors.length > 0) {
      return errors
    }
  }

  return errors
}

export abstract class TupleValidator<T extends ValidatorBase[], O = never> extends ValidatorBase<
  { [K in keyof T]: T[K]['tsType'] } | O
> {
  public schema: T

  public constructor(schema: [...T], options?: ValidatorOptions) {
    super(options)
    this.schema = schema
    if (options?.optimize !== false) {
      this.optimize(schema)
    }
  }

  public toString(options?: ValidatorExportOptions): string {
    if (options?.types === true) {
      return this.typeString(options)
    } else {
      return this.constructorString(options)
    }
  }

  protected validateValue(value: unknown, context?: string, options?: ValidatorOptions): ValidationFailure[] {
    return validateTuple(this.schema, value, context, {
      earlyFail: this.earlyFail,
      ...options
    })
  }

  private typeString(options?: ValidatorExportOptions): string {
    const language = options?.language ?? 'typescript'
    switch (language) {
      case 'typescript': {
        let typeStr = `[${this.schema.map(e => e.toString(options)).join(', ')}]`

        if (this.required === false) {
          typeStr += ` | undefined`
        }
        if (this.nullable === true) {
          typeStr += ` | null`
        }

        return typeStr
      }
      case 'rust': {
        // If we are inlining, don't generate type (typeName check so objects can still use the reference)
        if (
          (options?.parent instanceof ObjectValidator ||
            options?.parent instanceof ArrayValidator ||
            options?.parent instanceof RecordValidator) &&
          this.typeName === undefined
        ) {
          const types = Object.values(this.schema).map(v => v.toString(options))
          return `${types.join(', ')}`
        }

        if (options?.typeDefinitions === undefined) {
          throw new Error(`'typeDefinitions' is not set on ${this.toString()}`)
        }
        if (options?.parent === undefined && this.typeName === undefined) {
          // Ignore typeNameFromParent as we will inline instead
          throw new Error(`'typeName' is not set, with no parent set on ${this.toString()}`)
        }
        if (this.typeName === undefined) {
          throw new Error(`'typeName' is not set when trying to generate named tuple ${this.toString()}`)
        }

        validateRustTypeName(this.typeName, this)

        // Overwrite from parent
        if (options.parent?.hashable === true) {
          this.hashable = true
        }
        if (options.parent?.comparable === true) {
          this.comparable = true
        }
        if (options.parent?.defaultable === true) {
          this.defaultable = true
        }

        const serdeStr = decoratorsString(this, language, undefined)

        // Type generation
        const types = Object.values(this.schema).map(v => v.toString({ ...options, parent: this }))
        addTypeDef(
          this.typeName,
          `${serdeStr}pub struct ${this.typeName}(${types.join(', ')});\n\n`,
          options.typeDefinitions
        )

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
    const schemaStr = `[${this.schema.map(e => e.toString(options)).join(', ')}]`
    const optionsStr = this.optionsString !== '' ? `, ${this.optionsString}` : ''
    return `new ${this.constructor.name}(${schemaStr}${optionsStr})`
  }
}

export class RequiredTuple<T extends ValidatorBase[]> extends TupleValidator<T> {
  public constructor(schema: [...T], options?: ValidatorOptions) {
    super(schema, { ...options })
  }
}

export class OptionalTuple<T extends ValidatorBase[]> extends TupleValidator<T, undefined> {
  public constructor(schema: [...T], options?: ValidatorOptions) {
    super(schema, { ...options, required: false })
  }
}

export class NullableTuple<T extends ValidatorBase[]> extends TupleValidator<T, null> {
  public constructor(schema: [...T], options?: ValidatorOptions) {
    super(schema, { ...options, nullable: true })
  }
}

export class OptionalNullableTuple<T extends ValidatorBase[]> extends TupleValidator<T, null | undefined> {
  public constructor(schema: [...T], options?: ValidatorOptions) {
    super(schema, { ...options, required: false, nullable: true })
  }
}
