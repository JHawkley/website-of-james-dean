import React from "react";
import PropTypes from "prop-types";
import ModalContext from "common/ModalContext";

class Inner extends React.PureComponent {

  static propTypes = {
    modalContext: PropTypes.any.isRequired,
    modalProps: PropTypes.any.isRequired,
    isOpen: PropTypes.bool
  };

  static defaultProps = {
    isOpen: false
  };

  static displayName = ".ModalPopup";

  componentDidMount() {
    const { modalContext, modalProps, isOpen } = this.props;
    if (isOpen) modalContext.open(modalProps);
  }

  componentDidUpdate(prevProps) {
    const { modalContext, modalProps, isOpen } = this.props;
    let doOpen = false;

    if (isOpen !== prevProps.isOpen) {
      if (isOpen) doOpen = true;
      else modalContext.close();
    }

    if (modalProps !== prevProps.modalProps)
      doOpen = isOpen;
    
    if (doOpen)
      modalContext.open(modalProps);
  }

  componentWillUnmount() {
    const { modalContext, isOpen } = this.props;
    if (isOpen) modalContext.close();
  }

  render() {
    return null;
  }

}

const ModalPopup = ({isOpen, ...modalProps}) => (
  <ModalContext.Consumer>
    {modal => <Inner modalContext={modal} modalProps={modalProps} isOpen={isOpen} />}
  </ModalContext.Consumer>
);

ModalPopup.propTypes = {
  isOpen: PropTypes.bool
};

ModalPopup.defaultProps = {
  isOpen: false
};

export default ModalPopup;