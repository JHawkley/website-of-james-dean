class BadBindingError extends TypeError {

  constructor(message, boundValue) {
    const msg = [];
    msg.push(`bad \`this\` binding`);
    if (message) msg.push(message);
    super(msg.join("; "));
    TypeError.captureStackTrace?.(this, BadBindingError);
    this.boundValue = boundValue;
  }

}

export default BadBindingError;