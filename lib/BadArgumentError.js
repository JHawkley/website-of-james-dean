class BadArgumentError extends TypeError {

  constructor(message, argumentName, argumentValue) {
    const msg = [];
    if (argumentName) msg.push(`bad argument \`${argumentName}\``);
    if (message) msg.push(message);
    super(msg.join("; ") || "bad argument");
    TypeError.captureStackTrace?.(this, BadArgumentError);
    this.argumentName = argumentName;
    this.argumentValue = argumentValue;
  }

}

export default BadArgumentError;