import React from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { dew } from "tools/common";
import { timespan } from "tools/css";
import { Task, wait, frameSync } from "tools/async";
import styleVars from "styles/vars.json";

const modalTransition = timespan(styleVars["duration"]["modal"]);

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

class ModalDisplayer extends React.PureComponent {

  static propTypes = {
    appElement: PropTypes.func.isRequired,
    modalProps: PropTypes.any
  };

  state = {
    cachedModalProps: this.props.modalProps
  };

  doCloseTask = dew(() => {
    const doClose = async (stopSignal) => {
      try {
        if (!this.state.cachedModalProps) return;
        await wait(modalTransition, stopSignal);
        await frameSync(stopSignal);
        this.setState({ cachedModalProps: null });
      }
      catch { void 0; }
    };

    return new Task(doClose);
  });

  componentDidUpdate(prevProps) {
    const { modalProps } = this.props;
    if (modalProps !== prevProps.modalProps) {
      if (modalProps) {
        this.doCloseTask.stop();
        this.setState({ cachedModalProps: modalProps });
      }
      else {
        this.doCloseTask.start();
      }
    }
  }

  componentWillUnmount() {
    this.doCloseTask.stop();
  }

  render() {
    const {
      props: { appElement, modalProps },
      state: { cachedModalProps }
    } = this;

    if (!cachedModalProps) return null;

    return (
      <Modal
        {...cachedModalProps}
        appElement={appElement()}
        isOpen={Boolean(!modalProps ? false : cachedModalProps)}
        portalClassName="modal-popup"
        overlayClassName={overlayClasses}
        className={contentClasses}
        closeTimeoutMS={modalTransition}
      />
    );
  }

}

export default ModalDisplayer;