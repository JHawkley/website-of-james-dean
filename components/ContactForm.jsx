import PropTypes from "prop-types";
import ModalPopup from "./ModalPopup";
import { dew } from "tools/common";
import { base64 } from "tools/strings";
import { extensions as numEx } from "tools/numbers";
import { extensions as arrEx } from "tools/array";
import { extensions as maybe, nothing } from "tools/maybe";

const Fragment = React.Fragment;

function mapOfCharToIndex() {
  const output = {};
  const length = this.length;
  for (let i = 0; i < length; i++)
    output[this[i]] = i;
  return output;
}

const emailValidator = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;

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

function extractValue(ref) {
  return ref.current?.value.trim()::maybe.filter(str => str !== "");
}

class ContactForm extends React.Component {

  static propTypes = {
    displayed: PropTypes.bool.isRequired,
    onModalOpen: PropTypes.func,
    onModalClose: PropTypes.func
  };

  formRef = React.createRef();
  nameRef = React.createRef();
  emailRef = React.createRef();
  msgRef = React.createRef();

  constructor() {
    super();

    this.state = {
      isModalOpen: false,
      validationErrors: nothing
    };
  }

  handleSend = () => {
    const formEl = this.formRef.current;
    if (formEl::maybe.isEmpty())
      throw new Error("contact form's send-message handler activated before being rendered");
    
    const name = extractValue(this.nameRef);
    const email = extractValue(this.emailRef);
    const msg = extractValue(this.msgRef);

    const errors = [];

    if (name::maybe.isEmpty())
      errors.push("The 'name' field contained no meaningful text.");

    if (email::maybe.isEmpty())
      errors.push("The 'email' field contained no meaningful text.");
    else if (!email::maybe.every(str => emailValidator.test(str)))
      errors.push("The 'email' field did not validate as a proper e-mail address.");

    if (msg::maybe.isEmpty())
      errors.push("The 'message' field contained no meaningful text.");
    
    if (errors.length > 0)
      this.setState({ validationErrors: errors }, this.openModal);
    else {
      formEl.action = outs("NEQ2XkoymrJD+/q0L3rY6rbA0dT5lkbtghFe13NpRHSGd2plbsTfE0caNQA=");
      formEl.submit();
      formEl.action = "#";
    }
  }

  openModal = () => this.setState({ isModalOpen: true }, this.props.onModalOpen);

  closeModal = () => this.setState({ isModalOpen: false }, this.props.onModalClose);

  componentDidUpdate(prevProps) {
    // If the form isn't displayed, close the modal.
    if (this.props.displayed !== prevProps.displayed)
      if (!this.props.displayed)
        this.closeModal();
  }

  render() {
    const isModalOpen = this.state.isModalOpen;
    const validationErrors = this.state.validationErrors::arrEx.orNothing()
      ?? ["There were no errors; this component is bugged."];
    const nextPath = dew(() => {
      if (typeof location === "undefined") return nothing;

      const buffer = [location.origin, location.pathname, "#contacted"];
      return buffer.join("");
    });

    return (
      <Fragment>
        <form method="post" action="#" ref={this.formRef}>
          <div className="field half first">
            <label htmlFor="name">Name</label>
            <input type="text" name="name" id="name" ref={this.nameRef} />
          </div>
          <div className="field half">
            <label htmlFor="email">Email</label>
            <input type="text" name="email" id="email" ref={this.emailRef} />
          </div>
          <div className="field">
            <label htmlFor="message">Message</label>
            <textarea name="message" id="message" rows="4" ref={this.msgRef}></textarea>
          </div>
          <input type="hidden" name="_next" id="_next" value={nextPath} />
          <ul className="actions">
            <li><input type="button" value="Send Message" className="special" onClick={this.handleSend} /></li>
            <li><input type="reset" value="Reset" /></li>
          </ul>
        </form>
        <ModalPopup isOpen={isModalOpen} onRequestClose={this.closeModal} contentLabel="Form Validation Errors">
          <p>Failed to submit the form due to the following errors:</p>
          <ul>
            {validationErrors.map((reason, i) => {
              return <li key={i}>{reason}</li>
            })}
          </ul>
          <button onClick={this.closeModal}>OK</button>
        </ModalPopup>
      </Fragment>
    );
  }

}

export default ContactForm;