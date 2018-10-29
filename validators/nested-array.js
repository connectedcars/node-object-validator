const { ValidationError } = require('../lib/errors')

function NestedArray(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, required = true) {
  return {
    type: 'NestedArray',
    children: {},
    validate: function(key, val) {
      if (val == null) {
        if (required) {
          return new ValidationError(`Field \`${key}\` (${this.type}) is required`, { key, val })
        } else {
          return
        }
      }
      if (!Array.isArray(val)) {
        return new ValidationError(`Field \`${key}\` (${this.type}) must be an array (received "${val}")`, { key, val })
      }
      if ((minLength !== 0 && val.length < minLength) || val.length > maxLength) {
        return new ValidationError(
          `Field \`${key}\` (${this.type}) must contain between ${minLength} and ${maxLength} entries (found ${
            val.length
          })`,
          { key, val }
        )
      }
    }
  }
}

module.exports = NestedArray
