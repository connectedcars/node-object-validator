function ValidationError(message, context = {}) {
  this.name = 'ValidationError'
  this.message = message
  if (context.key) {
    this.key = context.key
  }
  if (context.val) {
    this.val = context.val
  }
}
ValidationError.prototype = new Error()

module.exports = {
  ValidationError
}
