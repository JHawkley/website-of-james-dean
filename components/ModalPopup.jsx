import React from "react";
import PropTypes from "prop-types";
import { dew } from "tools/common";
import { memoize } from "tools/functions";
import ModalContext from "lib/ModalContext";

class ModalPopup extends React.PureComponent {

  static contextType = ModalContext;

  static propTypes = {
    isOpen: PropTypes.bool
  };

  static defaultProps = {
    isOpen: false
  };

  getModalProps = dew(() => {
    // eslint-disable-next-line no-unused-vars
    const _getter = memoize(({isOpen, ...modalProps}) => modalProps);
    return () => _getter(this.props);
  });

  componentDidMount() {
    if (this.props.isOpen)
      this.context.open(this.getModalProps());
  }

  componentDidUpdate(prevProps) {
    const { isOpen } = this.props;

    if (isOpen !== prevProps.isOpen) {
      if (isOpen) this.context.open(this.getModalProps());
      else this.context.close();
    }
  }

  componentWillUnmount() {
    if (this.props.isOpen) this.context.close();
  }

  render() {
    return null;
  }

}

export default ModalPopup;