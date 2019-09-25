import React from "react";
import PropTypes from "prop-types";
import { dew } from "tools/common";
import { memoize } from "tools/functions";
import { outs } from "tools/formSpree";
import { resolve } from "url";

const FormContext = React.createContext(null);

const processNext = (next) => {
  if (!process.browser) return null;
  if (!next) return null;
  return resolve(location.origin, next);
};

class SpreeForm extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node,
    next: PropTypes.string,
    validate: PropTypes.func,
    action: PropTypes.string.isRequired,
    hidden: PropTypes.bool
  };

  formRef = React.createRef();

  send = () => {
    const { formRef: { current: formEl }, props: { validate, action, hidden } } = this;

    if (!formEl) return;
    if (validate && validate() !== true) return;

    formEl.action = hidden ? outs(action) : action;
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