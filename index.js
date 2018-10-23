class ObjectValidator {
  constructor(schema) {
    this.schema = schema
  }

  validate(obj) {
    for (const key in this.schema) {
      this.schema[key].validate(key, obj[key])
    }
  }
}

module.exports = ObjectValidator
