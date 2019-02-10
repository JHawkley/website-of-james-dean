import React, { Fragment } from "react";
import ReactDOMServer from "react-dom/server";
import Modal from "react-modal";
import PropTypes from "prop-types";
import ModalContext from "common/ModalContext";
import LightboxContext from "common/LightboxContext";
import ScrollLockedContext from "common/ScrollLockedContext";
import ModalDisplayer from "components/AppRoot/ModalDisplayer";
import LightboxDisplayer from "components/AppRoot/LightboxDisplayer";

const NoScriptAppRoot = ({children, className}) => {
  // Based on: https://github.com/facebook/react/issues/11423#issuecomment-341760646
  const staticMarkup = ReactDOMServer.renderToStaticMarkup(
    <Fragment>
      <style dangerouslySetInnerHTML={{ __html: ".js-only { display: none !important; }"}} />
      <div id="app-root" className={className}>
        <div id="app-container">
          {children}
        </div>
      </div>
    </Fragment>
  );

  return <noscript dangerouslySetInnerHTML={{ __html: staticMarkup }} />;
};

NoScriptAppRoot.displayName = "AppRoot.NoScript";

NoScriptAppRoot.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
}

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

  static NoScript = NoScriptAppRoot;

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

    const className = ["js-only"];
    if (customClass) className.push(customClass);
    if (loading) className.push("loading");

    return (
      <div ref={Modal.setAppElement} id="app-root" className={className.join(" ")}>
        <div id="app-container">
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