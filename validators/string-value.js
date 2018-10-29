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
      if (minLength !== 0) {
        if (val.length < minLength) {
          return new ValidationError(
            `Field \`${key}\` (${this.type}) must at least contain ${minLength} characters (received "${val}")`,
            { key, val }
          )
        }
      }
      if (val.length > maxLength) {
        return new ValidationError(
          `Field \`${key}\` (${this.type}) must at most contain ${maxLength} characters (received "${val}")`,
          { key, val }
        )
      }
    }
  }
}

module.exports = StringValue
