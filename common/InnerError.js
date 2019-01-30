class InnerError extends Error {

  constructor(message, innerError) {
    super(message);
    Error.captureStackTrace?.(this, InnerError);
    this.innerError = innerError;
  }

}

export default InnerError;