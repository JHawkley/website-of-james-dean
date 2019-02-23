import React, { Fragment } from "react";
import ModalPopup from "./ModalPopup";
import { extensions as arrEx } from "tools/array";
import SpreeForm from "components/SpreeForm";

import $contacted from "pages/contacted?route";

const $target = "NEQ2XkoymrJD+/q0L3rY6rbA0dT5lkbtghFe13NpRHSGd2plbsTfE0caNQA=";

const emailValidator = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;

const extractValue = (ref) => ref.current?.value.trim();

class ContactForm extends React.Component {

  state = {
    isModalOpen: false,
    validationErrors: null
  };

  nameRef = React.createRef();
  emailRef = React.createRef();
  msgRef = React.createRef();

  validate = () => {
    const name = extractValue(this.nameRef);
    const email = extractValue(this.emailRef);
    const msg = extractValue(this.msgRef);

    const errors = [];

    if (!name)
      errors.push("The 'name' field contained no meaningful text.");

    if (!email)
      errors.push("The 'email' field contained no meaningful text.");
    else if (!emailValidator.test(email))
      errors.push("The 'email' field did not validate as a proper e-mail address.");

    if (!msg)
      errors.push("The 'message' field contained no meaningful text.");
    
    if (errors.length === 0)
      return true;
    
    this.setState({ validationErrors: errors }, this.openModal);
    return false;
  }

  openModal = () => this.setState({ isModalOpen: true });

  closeModal = () => this.setState({ isModalOpen: false });

  render() {
    const isModalOpen = this.state.isModalOpen;
    const validationErrors = this.state.validationErrors::arrEx.orNothing()
      ?? ["There were no errors; this component is bugged."];

    return (
      <Fragment>
        <SpreeForm validate={this.validate} method="post" action={$target} next={$contacted} hidden>
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
          <ul className="actions">
            <li><SpreeForm.SendButton value="Send Message" className="special" /></li>
            <li><input type="reset" value="Reset" /></li>
          </ul>
        </SpreeForm>
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