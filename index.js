const { NestedObject } = require('./validators')

class ObjectValidator {
  constructor(schema, optimize = true) {
    this.schema = this._parseSchema(schema)
    if (optimize) {
      this.validate = this._generateValidateFunction()
    }
  }
  _parseSchema(schema) {
    let result = {}
    for (const key in schema) {
      if (key.indexOf('$') !== -1) {
        continue
      }
      if (!schema[key].hasOwnProperty('validate')) {
        let type = schema[`${key}$type`]
        if (!type) {
          type = NestedObject()
        }
        type.children = this._parseSchema(schema[key])
        result[key] = type
        continue
      }
      result[key] = schema[key]
    }

    return result
  }

  _generateValidateFunction() {
    let validators = []
    let lines = [`let errors = []`, `let err`]
    let generateFunction = (schema, prefix = '', objName = 'obj') => {
      for (const key in schema) {
        let validatorName = `${key}Validator` + validators.length
        validators.push(`let ${validatorName} = schema${prefix}['${key}']`)
        lines.push(`err = ${validatorName}.validate('${key}', ${objName}['${key}'])`)
        lines.push(`if (err) {`)
        lines.push(`  errors.push(err)`)
        lines.push(`}`)
        if (schema[key].type === 'NestedObject') {
          lines.push(`if (!err && ${objName}.hasOwnProperty('${key}')) {`)
          lines.push(`let ${key}${objName} = ${objName}['${key}']`)
          generateFunction(schema[key].children, `${prefix}['${key}'].children`, `${key}${objName}`)
          lines.push(`}`)
        } else if (schema[key].type === 'NestedArray') {
          lines.push(`if (!err && ${objName}.hasOwnProperty('${key}')) {`)
          lines.push(`for (let ${key}${objName} of ${objName}['${key}']) {`)
          generateFunction(schema[key].children, `${prefix}['${key}'].children`, `${key}${objName}`)
          lines.push(`}`)
          lines.push(`}`)
        }
      }
    }
    generateFunction(this.schema)
    lines.push(`return errors`)

    let functionGenerator = new Function(
      'schema',
      validators.join('\n') + '\n' + 'return (obj) => {\n' + lines.join('\n') + '\n}'
    )
    return functionGenerator(this.schema)
  }

  validate(obj) {
    return this._validate(this.schema, obj)
  }
  _validate(schema, obj) {
    let errors = []
    for (const key in schema) {
      const validator = schema[key]
      const err = validator.validate(key, obj[key])
      if (err) {
        errors.push(err)
      } else if (key in obj) {
        if (validator.type === 'NestedObject') {
          errors.push(...this._validate(validator.children, obj[key]))
        } else if (validator.type === 'NestedArray') {
          for (const item of obj[key]) {
            errors.push(...this._validate(validator.children, item))
          }
        }
      }
    }
    return errors
  }
}

module.exports = ObjectValidator
