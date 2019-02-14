import React from "react";
import { noop } from "tools/common";

export default React.createContext({ open: noop, close: noop });