import React from "react";
import PropTypes from "prop-types";
import { dew } from "tools/common";
import { base64 } from "tools/strings";
import { memoize } from "tools/functions";
import { extensions as numEx } from "tools/numbers";
import { resolve } from "url";

function mapOfCharToIndex() {
  const output = {};
  const length = this.length;
  for (let i = 0; i < length; i++)
    output[this[i]] = i;
  return output;
}

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const charsToIndex = chars::mapOfCharToIndex();
const vpfr = [
  179, 253, 191, 2, 251, 221, 28, 56, 219, 185, 140, 29, 99, 72, 97, 71, 239, 192, 170, 230,
  33, 149, 71, 18, 154, 199, 215, 10, 139, 190, 22, 64, 135, 202, 185, 240, 92, 49, 56, 72,
  118, 101, 153, 15, 2, 162, 104, 254, 64, 150, 14, 54, 41, 50, 163, 247, 114, 154, 204, 115,
  147, 80, 2, 119
];

/*
function rng(count) {
  const min = 1;
  const max = 255;
  const range = max - min;
  const output = [];
  for (let i = 0; i < count; i++)
    output[i] = ((Math.random() * range) | 0) + min;
  return "[" + output.join(", ") + "]";
}
console.log(rng(64));

function ins(str) {
  const barr = base64.encode(str).split("");
  const barrLen = barr.length;
  const vpfrLen = vpfr.length;
  const charsLen = chars.length;
  for (let i = 0; i < barrLen; i++) {
    const offset = vpfr[i::reflow(vpfrLen - 1)];
    const ci = charsToIndex[barr[i]];
    if (typeof ci === "undefined") continue;
    const co = (ci + offset)::reflow(charsLen - 1);
    barr[i] = chars[co];
  }
  return barr.join("");
}
// */

function outs(str) {
  const barr = str.split("");
  const barrLen = barr.length;
  const vpfrLen = vpfr.length;
  const charsLen = chars.length;
  for (let i = 0; i < barrLen; i++) {
    const offset = vpfr[i::numEx.reflow(vpfrLen - 1)];
    const ci = charsToIndex[barr[i]];
    if (typeof ci === "undefined") continue;
    const co = (ci - offset)::numEx.reflow(charsLen - 1);
    barr[i] = chars[co];
  }
  return base64.decode(barr.join(""));
}

const FormContext = React.createContext(null);

const processNext = (next) => {
  if (!process.browser) return next;
  if (!next) return null;
  return resolve(location.origin, next);
};

class SpreeForm extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node,
    action: PropTypes.string.isRequired,
    next: PropTypes.string,
    validate: PropTypes.func
  };

  formRef = React.createRef();

  send = () => {
    const { formRef: { current: formEl }, props: { validate, action } } = this;

    if (!formEl) return;
    if (validate && validate() !== true) return;

    formEl.action = outs(action);
    formEl.submit();
    formEl.action = "#";
  }

  getNext = dew(() => {
    const _processNext = memoize(processNext);
    return () => _processNext(this.props.next);
  });

  render() {
    const next = this.getNext();
    return (
      <FormContext.Provider value={this.send}>
        <form method="post" action="#" ref={this.formRef}>
          {this.props.children}
          {next && <input type="hidden" name="_next" id="_next" value={next} />}
        </form>
      </FormContext.Provider>
    );
  }

}

const SendButton = (props) => {
  return (
    <FormContext.Consumer>
      {send => <input {...props} type="button" onClick={send} />}
    </FormContext.Consumer>
  );
};

SendButton.displayName = "SpreeForm.SendButton";

SpreeForm.SendButton = SendButton;

export default SpreeForm;