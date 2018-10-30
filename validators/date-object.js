const { ValidationError } = require('../lib/errors')

function DateObject(required = true) {
  return {
    type: 'DateObject',
    validate: function(key, val) {
      if (val == null) {
        if (required) {
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
}

module.exports = DateObject
