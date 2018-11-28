const { ValidationError } = require('../lib/errors')

class DateObject {
  constructor(required = true) {
    this.type = 'DateObject'
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
    if (!(val instanceof Date)) {
      return new ValidationError(`Field \`${key}\` (${this.type}) must be a Date object`, { key, val })
    }
  }
}

module.exports = { DateObject }
