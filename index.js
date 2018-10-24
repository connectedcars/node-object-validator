const { NestedObject } = require('./validators')

class ObjectValidator {
  constructor(schema) {
    this.schema = this._parseSchema(schema)
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
