const { ValidationError } = require('../lib/errors')

class NestedArray {
  constructor(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, required = true) {
    this.type = 'NestedArray'
    this.children = {}
    this._minLength = minLength
    this._maxLength = maxLength
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
    if (!Array.isArray(val)) {
      return new ValidationError(`Field \`${key}\` (${this.type}) must be an array (received "${val}")`, { key, val })
    }
    if ((this._minLength !== 0 && val.length < this._minLength) || val.length > this._maxLength) {
      return new ValidationError(
        `Field \`${key}\` (${this.type}) must contain between ${this._minLength} and ${
          this._maxLength
        } entries (found ${val.length})`,
        { key, val }
      )
    }
  }
}

module.exports = { NestedArray }
