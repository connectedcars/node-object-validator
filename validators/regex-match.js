const { ValidationError } = require('../lib/errors')

class RegexMatch {
  /**
   *
   * @param {Regex} regex
   * @param {boolean} required
   */
  constructor(regex, required = true) {
    this.type = 'RegexMatch'
    this._regex = regex
    this._required = required
  }

  validate(key, val) {
    if (val == null) {
      if (this._required) {
        return new ValidationError(`Field \`${key}\` (${this.type}) is required`, { key, val })
      } else {
        return
      }
    }
    if (typeof val !== 'string') {
      return new ValidationError(`Field \`${key}\` (${this.type}) must be a string (received "${val}")`, { key, val })
    }
    if (!val.match(this._regex)) {
      return new ValidationError(`Field \`${key}\` (${this.type}) did not match '${this._regex}' (received "${val}")`, {
        key,
        val
      })
    }
    return
  }
}

module.exports = { RegexMatch }
