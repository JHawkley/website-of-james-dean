import React from "react";
import PropTypes from "prop-types";
import ModalContext from "lib/ModalContext";
import LightboxContext from "lib/LightboxContext";
import ScrollLockedContext from "lib/ScrollLockedContext";
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

  appElement = null;

  modalContext = {
    open: (modalProps) => {
      if (this.props.routeChanging) return;
      this.setState({ modalProps });
    },
    close: () => this.setState({ modalProps: null })
  };

  lightboxContext = {
    open: (lightboxData, lightboxIndex) => {
      if (this.props.routeChanging) return;
      this.setState({ lightboxData, lightboxIndex });
    },
    close: () => this.setState({ lightboxData: null })
  };

  setAppElement = (el) => this.appElement = el;

  getAppElement = () => this.appElement;

  componentDidUpdate(prevProps) {
    const { routeChanging } = this.props;
    if (routeChanging !== prevProps.routeChanging && routeChanging)
      this.setState({ modalProps: null, lightboxData: null });
  }

  render() {
    const {
      lightboxContext, modalContext,
      getAppElement, setAppElement,
      props: { children, className: customClass, loading },
      state: { modalProps, lightboxData, lightboxIndex }
    } = this;

    const className = ["app-root", customClass, loading && "app-loading"].filter(Boolean).join(" ");

    return (
      <div ref={setAppElement} className={className}>
        <div className="app-container">
          <ScrollLockedContext.Provider value={Boolean(modalProps || lightboxData)}>
            <ModalContext.Provider value={modalContext}>
              <LightboxContext.Provider value={lightboxContext}>
                {children}
              </LightboxContext.Provider>
            </ModalContext.Provider>
          </ScrollLockedContext.Provider>
        </div>
        <LightboxDisplayer
          appElement={getAppElement}
          onCloseRequest={lightboxContext.close}
          images={lightboxData}
          initialIndex={lightboxIndex}
        />
        <ModalDisplayer
          appElement={getAppElement}
          modalProps={modalProps}
        />
      </div>
    );
  }
}

export default AppRoot;