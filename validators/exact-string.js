const { ValidationError } = require('../lib/errors')

function ExactString(expectedStr, required = true) {
  return {
    type: 'ExactString',
    validate: function(key, str) {
      if (str == null) {
        if (required) {
          throw new ValidationError(`${this.type}: Field \`${key}\` is required`)
        } else {
          return
        }
      }
      if (str !== expectedStr) {
        throw new ValidationError(
          `${this.type}: Field \`${key}\` must strictly equal "${expectedStr}" (received "${str}")`
        )
      }
    }
  }
}

module.exports = ExactString
