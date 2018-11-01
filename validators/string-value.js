const { ValidationError } = require('../lib/errors')

function StringValue(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, required = true) {
  return {
    type: 'StringValue',
    validate: function(key, val) {
      if (val == null) {
        if (required) {
          return new ValidationError(`Field \`${key}\` (${this.type}) is required`, { key, val })
        } else {
          return
        }
      }
      if (typeof val !== 'string') {
        return new ValidationError(`Field \`${key}\` (${this.type}) must be a string (received "${val}")`, { key, val })
      }
      if ((minLength !== 0 && val.length < minLength) || val.length > maxLength) {
        return new ValidationError(
          `Field \`${key}\` (${
            this.type
          }) must contain between ${minLength} and ${maxLength} characters (received "${val}")`,
          { key, val }
        )
      }
    }
  }
}

module.exports = StringValue
