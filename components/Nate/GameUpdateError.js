import InnerError from "lib/InnerError";

class GameUpdateError extends InnerError {

  constructor(message, innerError) {
    super(message, innerError);
  }

}

export default GameUpdateError;