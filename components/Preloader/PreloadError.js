import { is } from "tools/common";
import InnerError from "lib/InnerError";

class PreloadError extends InnerError {

  static wrap(error) {
    if (error::is.error()) return new PreloadError(error.message, error);
    return new PreloadError("an unspecified preload error ocurred", error);
  }

}

export default PreloadError;