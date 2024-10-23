import { SupportedLanguages, ValidatorBase, ValidatorExportOptions } from './common'

export function toSnakeCase(str: string): string {
  // Check if the entire string is capitalized
  if (str === str.toUpperCase()) {
    return str
  }

  // Convert to snake case if the string is not fully capitalized
  return str.replace(/[A-Z]/g, (letter, index) => {
    return index === 0 ? letter.toLowerCase() : '_' + letter.toLowerCase()
  })
}

export function toPascalCase(str: string): string {
  // Check if the entire string is capitalized
  if (str === str.toUpperCase()) {
    return str
  }

  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function addTypeDef(typeName: string, typeValue: string, record: Record<string, string>): void {
  // Skip redefining stuff, so if you have a tagged union data object, it doesn't get redefined later on if it's used (without the parent, the key would get added in again)
  if (record[typeName] === undefined) {
    record[typeName] = typeValue
  }
}

const rustTypeNameRegex = /^(?:[A-Za-z_][A-Za-z0-9_]*)(?:::[A-Za-z_][A-Za-z0-9_]*)*$/
export function isValidRustTypeName(typeName: string): boolean {
  return rustTypeNameRegex.test(typeName)
}

export function validateRustTypeName(typeName: string, context: ValidatorBase): void {
  if (isValidRustTypeName(typeName) === false) {
    throw new Error(`validateRustTypeName(): Invalid Rust Type Name: '${typeName}'. In: ${context.toString()}`)
  }
}

export function decoratorsString(
  validator: ValidatorBase,
  typeLanguage: SupportedLanguages,
  unionKey: string | undefined
): string {
  if (typeLanguage === 'rust') {
    const options: SerdeDecoratorsOptions = {
      copyable: validator.copyable,
      hashable: validator.hashable,
      comparable: validator.comparable,
      partialComparable: validator.partialComparable,
      defaultable: validator.defaultable,
      unionKey: unionKey,
      renameAll: 'camelCase'
    }
    const serdeStr = serdeDecorators(options)
      .map(decorator => decorator + '\n')
      .join('')
    return serdeStr
  } else {
    throw new Error(`decoratorsString() called with unsupported language: ${typeLanguage}`)
  }
}

export interface SerdeDecoratorsOptions {
  comparable: boolean
  partialComparable: boolean
  hashable: boolean
  defaultable: boolean
  copyable: boolean
  unionKey?: string
  renameAll?: string
}
export function serdeDecorators(options: SerdeDecoratorsOptions): string[] {
  const decorators = []

  const deriveMacros = [`Serialize`, `Deserialize`, `Debug`, `Clone`]
  if (options.partialComparable) {
    deriveMacros.push(`PartialEq`)
  }
  if (options.comparable) {
    if (!options.partialComparable) {
      deriveMacros.push(`PartialEq`)
    }
    deriveMacros.push(`Eq`)
  }
  if (options.hashable === true) {
    deriveMacros.push(`Hash`)
  }
  if (options.defaultable === true) {
    deriveMacros.push(`Default`)
  }
  if (options.copyable === true) {
    deriveMacros.push(`Copy`)
  }

  decorators.push(`#[derive(${deriveMacros.join(', ')})]`)

  if (options.renameAll !== undefined) {
    decorators.push(`#[serde(rename_all = "${options.renameAll}")]`)
  }

  if (options.unionKey !== undefined) {
    decorators.push(`#[serde(tag = "${options.unionKey}")]`)
  }

  return decorators
}

export function generateRustTypes(validators: ValidatorBase[], inputOptions?: ValidatorExportOptions): string {
  const typeDefinitions: Record<string, string> = {}

  const options: ValidatorExportOptions = {
    ...inputOptions,
    types: true,
    language: 'rust',
    typeDefinitions
  }

  for (const validator of validators) {
    // The type definitions gets added to the hashmap
    validator.toString(options)
  }

  let importContent = ``
  let shouldImportDateTime = false
  let shouldImportHashMap = false

  // Alphabetical order: chrono, serde, hashmap
  let typeContent = ``
  for (const value of Object.values(typeDefinitions)) {
    if (value.includes('DateTime')) {
      shouldImportDateTime = true
    }
    if (value.includes('HashMap')) {
      shouldImportHashMap = true
    }
    typeContent += value
  }

  // Chrono (time)
  if (shouldImportDateTime) {
    importContent += `use chrono::{DateTime, Utc};\n`
  }
  // Serde
  importContent += `use serde::{Deserialize, Serialize};\n`
  // Hashmap (Record)
  if (shouldImportHashMap) {
    importContent += `use std::collections::HashMap;\n`
  }
  importContent += `\n`

  const content = importContent + typeContent
  return content
}
