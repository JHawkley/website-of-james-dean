import { backtrack } from "../modifiers/backtrack";

export const tag = (pattern, parser) => {
  parser.parserSource = pattern;
  return backtrack.mark(parser);
};