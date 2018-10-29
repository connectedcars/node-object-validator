const { ValidationError } = require('../lib/errors')

function Float(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = true) {
  return {
    type: 'Float',
    validate: function(key, val) {
      if (val == null) {
        if (required) {
          return new ValidationError(`Field \`${key}\` (${this.type}) is required`, { key, val })
        } else {
          return
        }
      }
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
        return new ValidationError(`Field \`${key}\` (${this.type}) must be a float (received "${val}")`, { key, val })
      }
      if (val < min) {
        return new ValidationError(`Field \`${key}\` (${this.type}) must at least be ${min} (received "${val}")`, {
          key,
          val
        })
      }
      if (val > max) {
        return new ValidationError(`Field \`${key}\` (${this.type}) must at most be ${max} (received "${val}")`, {
          key,
          val
        })
      }
    }
  }
}

module.exports = Float
