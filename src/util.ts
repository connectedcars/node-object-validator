import { writeFileSync } from 'node:fs'

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

export function generateRustTypes(validators: ValidatorBase[], outputFile?: string | undefined): void {
  const options: ValidatorExportOptions = {
    types: true,
    language: 'rust'
  }
  const locationStr = outputFile ? `File location: ${outputFile}` : `stdout`
  // eslint-disable-next-line no-console
  console.log(`Generating ${validators.length} rust types: (${locationStr})`)

  let content = `use serde::{Deserialize, Serialize};\n\n`

  for (const validator of validators) {
    content += validator.toString(options)
  }

  // Write
  if (outputFile === undefined) {
    // eslint-disable-next-line no-console
    console.log(content)
  } else {
    // TODO: dont write to tmp
    writeFileSync(`/tmp/${outputFile}`, content)
  }
}
