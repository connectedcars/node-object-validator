export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter, index) => {
    return index == 0 ? letter.toLowerCase() : '_' + letter.toLowerCase()
  })
}
