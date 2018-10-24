const { ValidationError } = require('../lib/errors')

function NestedArray(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, required = true) {
  return {
    type: 'NestedArray',
    children: {},
    validate: function(key, val) {
      if (val == null) {
        if (required) {
          return new ValidationError(`Field \`${key}\` (${this.type}) is required`)
        } else {
          return
        }
      }
      if (!Array.isArray(val)) {
        return new ValidationError(`Field \`${key}\` (${this.type}) must be an array (received "${val}")`)
      }
      if (minLength !== 0) {
        if (val.length < minLength) {
          return new ValidationError(
            `Field \`${key}\` (${this.type}) must at least contain ${minLength} entries (found ${val.length})`
          )
        }
      }
      if (val.length > maxLength) {
        return new ValidationError(
          `Field \`${key}\` (${this.type}) must at most contain ${maxLength} entries (found ${val.length})`
        )
      }
    }
  }
}

module.exports = NestedArray
