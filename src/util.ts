import { ValidatorBase, ValidatorExportOptions } from './common'

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

export function serdeDecorators(
  comparable = false,
  hashable = false,
  defaultable = false,
  unionKey: string | undefined = undefined,
  renameAll: string | undefined = 'camelCase'
): string[] {
  const decorators = []

  const deriveMacros = [`Serialize`, `Deserialize`, `Debug`, `Clone`]
  if (comparable === true) {
    deriveMacros.push(`PartialEq`)
    deriveMacros.push(`Eq`)
  }
  if (hashable === true) {
    deriveMacros.push(`Hash`)
  }
  if (defaultable === true) {
    deriveMacros.push(`Default`)
  }

  decorators.push(`#[derive(${deriveMacros.join(', ')})]`)

  if (renameAll !== undefined) {
    decorators.push(`#[serde(rename_all = "${renameAll}")]`)
  }

  if (unionKey !== undefined) {
    decorators.push(`#[serde(tag = "${unionKey}")]`)
  }

  return decorators
}

export function serdeDecoratorsString(
  comparable = false,
  hashable = false,
  defaultable = false,
  unionKey: string | undefined = undefined,
  renameAll: string | undefined = 'camelCase'
): string {
  const serdeStr = serdeDecorators(comparable, hashable, defaultable, unionKey, renameAll)
    .map(decorator => decorator + '\n')
    .join('')
  return serdeStr
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
