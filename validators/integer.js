const { ValidationError } = require('../lib/errors')

function Integer(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = true) {
  return {
    type: 'Integer',
    validate: function(key, val) {
      if (val == null) {
        if (required) {
          return new ValidationError(`Field \`${key}\` (${this.type}) is required`, { key, val })
        } else {
          return
        }
      }
      if (typeof val !== 'number' || !Number.isInteger(val)) {
        return new ValidationError(`Field \`${key}\` (${this.type}) must be an integer (received "${val}")`, {
          key,
          val
        })
      }
      if (val < min || val > max) {
        return new ValidationError(
          `Field \`${key}\` (${this.type}) must be between ${min} and ${max} (received "${val}")`,
          { key, val }
        )
      }
    }
  }
}

module.exports = Integer
