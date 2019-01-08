import Modal from 'react-modal';
import { timespan } from "tools/css";
import styleVars from "styles/vars.json";

const modalTransition = timespan(styleVars.duration.modal);

const overlayClasses = {
  base: "modal-overlay",
  afterOpen: "after-open",
  beforeClose: "before-close"
};

const contentClasses = {
  base: "modal-content",
  afterOpen: "after-open",
  beforeClose: "before-close"
};

const ModalPopup = (props) => {
  return (
    <Modal
      {...props}
      portalClassName="modal-popup"
      overlayClassName={overlayClasses}
      className={contentClasses}
      closeTimeoutMS={modalTransition}
    />
  );
};

export default ModalPopup;