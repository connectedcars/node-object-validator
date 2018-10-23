const NestedObject = require('./lib/nested-object')

const validate = (schema, obj) => {
  let errors = []
  for (const key in schema) {
    const validator = schema[key]
    const err = validator.validate(key, obj[key])
    if (err) {
      errors.push(err)
    } else if (key in obj) {
      if (validator.type === 'NestedObject') {
        errors.push(...validate(validator.children, obj[key]))
      }
    }
  }
  return errors
}

class ObjectValidator {
  constructor(schema) {
    this.schema = {}
    for (const key in schema) {
      if (key.indexOf('$') !== -1) {
        continue
      }
      if (!schema[key].hasOwnProperty('validate')) {
        let type = schema[`${key}$type`]
        if (!type) {
          type = NestedObject()
        }
        type.children = schema[key]
        this.schema[key] = type
        continue
      }
      this.schema[key] = schema[key]
    }
  }

  validate(obj) {
    return validate(this.schema, obj)
  }
}

module.exports = ObjectValidator
