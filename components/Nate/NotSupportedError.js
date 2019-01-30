class NotSupportedError extends Error {

  constructor(message) {
    super(message);
    Error.captureStackTrace?.(this, NotSupportedError);
  }

}

export default NotSupportedError;