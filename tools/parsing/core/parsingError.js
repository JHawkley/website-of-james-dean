import { copyOwn } from "tools/extensions/common";

export class ParsingError extends Error {
  constructor(state, message) {
    super(message);
    this.parserPosition = state.position + state.nestedOffset;
    this.parserState = state::copyOwn();
  }
}