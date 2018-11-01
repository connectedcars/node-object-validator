const { ValidationError } = require('../lib/errors')

function ExactString(expectedStr, required = true) {
  return {
    type: 'ExactString',
    validate: function(key, val) {
      if (val == null) {
        if (required) {
          return new ValidationError(`Field \`${key}\` (${this.type}) is required`, { key, val })
        } else {
          return
        }
      }
      if (val !== expectedStr) {
        return new ValidationError(
          `Field \`${key}\` (${this.type}) must strictly equal "${expectedStr}" (received "${val}")`,
          { key, val }
        )
      }
    }
  }
}

module.exports = ExactString
