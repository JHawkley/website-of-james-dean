class PredicateFailedError extends Error {

  constructor(message) {
    super(message);
    Error.captureStackTrace?.(this, PredicateFailedError);
  }

}

export default PredicateFailedError;