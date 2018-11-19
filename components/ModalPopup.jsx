import Modal from 'react-modal';

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
      closeTimeoutMS={350}
    />
  );
};

export default ModalPopup;