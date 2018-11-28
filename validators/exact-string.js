const { ValidationError } = require('../lib/errors')

class ExactString {
  constructor(expectedStr, required = true) {
    this.type = 'ExactString'
    this._expectedStr = expectedStr
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
    if (val !== this._expectedStr) {
      return new ValidationError(
        `Field \`${key}\` (${this.type}) must strictly equal "${this._expectedStr}" (received "${val}")`,
        { key, val }
      )
    }
  }
}

module.exports = { ExactString }
