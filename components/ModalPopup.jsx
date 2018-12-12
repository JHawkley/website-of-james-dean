import Modal from "react-modal";

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

const ModalPopup = (props) => (
  <Modal
    parentSelector={() => document.getElementById("__next")}
    {...props}
    portalClassName="modal-popup"
    overlayClassName={overlayClasses}
    className={contentClasses}
    closeTimeoutMS={350}
  />
);

export default ModalPopup;