import css from "styled-jsx/css";

const errorBlockQuote = css.resolve`
  blockquote { border-left-color: red; font-style: normal; }
  blockquote > :global(p:last-child) { margin-bottom: 0px; }
`;

export { errorBlockQuote };