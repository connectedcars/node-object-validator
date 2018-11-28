const { ValidationError } = require('../lib/errors')

class Integer {
  constructor(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = true) {
    this.type = 'Integer'
    this._min = min
    this._max = max
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
    if (typeof val !== 'number' || !Number.isInteger(val)) {
      return new ValidationError(`Field \`${key}\` (${this.type}) must be an integer (received "${val}")`, {
        key,
        val
      })
    }
    if (val < this._min || val > this._max) {
      return new ValidationError(
        `Field \`${key}\` (${this.type}) must be between ${this._min} and ${this._max} (received "${val}")`,
        { key, val }
      )
    }
  }
}

module.exports = { Integer }
