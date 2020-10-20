import * as ts from 'typescript'

async function main(argv: string[]): Promise<number> {
  const files = ['./src/test.ts']

  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS
  })

  const checker = program.getTypeChecker()

  const sourceFiles = program.getSourceFiles()

  for (const sourceFile of sourceFiles) {
    if (sourceFile.isDeclarationFile) {
      continue
    }
    console.log(`${sourceFile.fileName}:`)

    ts.forEachChild(sourceFile, node => {
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        console.log(`interface ${node.name.text} {`)
        const type = checker.getTypeAtLocation(node.name)
        for (const prop of type.getProperties()) {
          const type = checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration))
          console.log(`  ${prop.name}: ${type}`)
        }
        console.log('}')
      }
    })
  }

  return 0
}

main(process.argv)
  .then(exitCode => {
    process.exit(exitCode)
  })
  .catch(e => {
    console.error(e)
  })
