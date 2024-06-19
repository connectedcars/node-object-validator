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
