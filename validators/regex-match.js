const { ValidationError } = require('../lib/errors')

/**
 *
 * @param {Regex} regex
 * @param {boolean} required
 */
function RegexMatch(regex, required = true) {
  return {
    type: 'RegexMatch',
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
      if (!val.match(regex)) {
        return new ValidationError(`Field \`${key}\` (${this.type}) did not match '${regex}' (received "${val}")`, {
          key,
          val
        })
      }
      return
    }
  }
}

module.exports = RegexMatch
