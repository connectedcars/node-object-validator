const { ValidationError } = require('../lib/errors')

function Float(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = true) {
  return {
    type: 'Float',
    validate: function(key, val) {
      if (val == null) {
        if (required) {
          return new ValidationError(`Field \`${key}\` (${this.type}) is required`)
        } else {
          return
        }
      }
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
        return new ValidationError(`Field \`${key}\` (${this.type}) must be a float (received "${val}")`)
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

module.exports = Float
