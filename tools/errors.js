export class InnerError extends Error {

  constructor(innerError, ...errorParams) {
    super(...errorParams);
    Error.captureStackTrace?.(this, InnerError);
    this.innerError = innerError;
  }

}