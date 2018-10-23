class ObjectValidator {
  constructor(schema) {
    this.schema = schema
  }

  validate(obj) {
    let errors = []
    for (const key in this.schema) {
      const err = this.schema[key].validate(key, obj[key])
      if (err) {
        errors.push(err)
      }
    }
    return errors
  }
}

module.exports = ObjectValidator
