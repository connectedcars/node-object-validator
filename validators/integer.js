const { ValidationError } = require('../lib/errors')

function Integer(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = true) {
  return {
    type: 'Integer',
    validate: function(key, val) {
      if (val == null) {
        if (required) {
          return new ValidationError(`Field \`${key}\` (${this.type}) is required`)
        } else {
          return
        }
      }
      if (typeof val !== 'number' || !Number.isInteger(val)) {
        return new ValidationError(`Field \`${key}\` (${this.type}) must be an integer (received "${val}")`)
      }
      if (val < min) {
        return new ValidationError(`Field \`${key}\` (${this.type}) must at least be ${min} (received "${val}")`)
      }
      if (val > max) {
        return new ValidationError(`Field \`${key}\` (${this.type}) must at most be ${max} (received "${val}")`)
      }
    }
  }
}

module.exports = Integer
