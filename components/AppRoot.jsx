import React from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import ModalContext from "common/ModalContext";
import LightboxContext from "common/LightboxContext";
import ScrollLockedContext from "common/ScrollLockedContext";
import ModalDisplayer from "components/AppRoot/ModalDisplayer";
import LightboxDisplayer from "components/AppRoot/LightboxDisplayer";

class AppRoot extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    loading: PropTypes.bool,
    routeChanging: PropTypes.bool
  };

  static defaultProps = {
    loading: false,
    routeChanging: false
  }

  state = {
    modalProps: null,
    lightboxData: null,
    lightboxIndex: 0
  };

  modalContext = {
    open: (modalProps) => this.setState({ modalProps }),
    close: () => this.setState({ modalProps: null })
  };

  lightboxContext = {
    open: (lightboxData, lightboxIndex) => this.setState({ lightboxData, lightboxIndex }),
    close: () => this.setState({ lightboxData: null })
  };

  componentDidUpdate(prevProps) {
    const { routeChanging } = this.props;
    if (routeChanging !== prevProps.routeChanging && routeChanging)
      this.setState({ modalProps: null, lightboxData: null });
  }

  render() {
    const {
      lightboxContext,
      props: { children, className: customClass, loading },
      state: { modalProps, lightboxData, lightboxIndex }
    } = this;

    const className = ["js-only", "app-root", customClass, loading && "app-loading"].filter(Boolean).join(" ");

    return (
      <div ref={Modal.setAppElement} className={className}>
        <div className="app-container">
          <ScrollLockedContext.Provider value={Boolean(modalProps || lightboxData)}>
            <ModalContext.Provider value={this.modalContext}>
              <LightboxContext.Provider value={this.lightboxContext}>
                {children}
              </LightboxContext.Provider>
            </ModalContext.Provider>
          </ScrollLockedContext.Provider>
        </div>
        <LightboxDisplayer
          onCloseRequest={lightboxContext.close}
          images={lightboxData}
          initialIndex={lightboxIndex}
        />
        <ModalDisplayer modalProps={modalProps} />
      </div>
    );
  }
}

export default AppRoot;