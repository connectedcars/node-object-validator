function ValidationError(message) {
  this.name = 'ValidationError'
  this.message = message
  this.stack = new Error(message).stack
}
ValidationError.prototype = new Error()

module.exports = {
  ValidationError
}
