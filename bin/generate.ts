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
        const interfaceType = checker.getTypeAtLocation(node.name)
        for (const prop of interfaceType.getProperties()) {
          const propType = checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration)
          if (propType.isClassOrInterface()) {
            console.log(`  ${prop.name}: subtype`)
          } else if (propType.isTypeParameter()) {
            console.log(`  ${prop.name}: generic`)
          } else {
            const typeName = checker.typeToString(propType)
            console.log(`  ${prop.name}: ${typeName}`)
          }
        }
        console.log('}')
      }
    })
  }
  return 0
}

/*
function typeToValidator(type: string) {
  switch (type) {
    case 'string':
  }
}*/

main(process.argv)
  .then(exitCode => {
    process.exit(exitCode)
  })
  .catch(e => {
    console.error(e)
  })
