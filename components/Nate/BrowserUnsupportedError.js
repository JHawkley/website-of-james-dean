class BrowserUnsupportedError extends Error {

  constructor(message) {
    super(message);
    Error.captureStackTrace?.(this, BrowserUnsupportedError);
  }

}

export default BrowserUnsupportedError;