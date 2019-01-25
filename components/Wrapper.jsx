import React from "react";
import PropTypes from "prop-types";
import Header from "components/Header";
import Main from "components/Main";
import Footer from "components/Footer";
import { PreloadSync } from "components/Preloader";

class Wrapper extends React.PureComponent {

  static propTypes = {
    preventScroll: PropTypes.bool,
    article: PropTypes.string,
    articlePages: PropTypes.instanceOf(Map).isRequired,
    articleTimeout: PropTypes.bool.isRequired,
    timeout: PropTypes.bool.isRequired,
    appContext: PropTypes.shape({
      preloadSync: PropTypes.instanceOf(PreloadSync).isRequired,
      makeGallery: PropTypes.func.isRequired,
      openLightbox: PropTypes.func.isRequired,
      closeLightbox: PropTypes.func.isRequired,
      enableScroll: PropTypes.func.isRequired,
      disableScroll: PropTypes.func.isRequired
    }).isRequired
  };

  static getDerivedStateFromProps(props) {
    if (!props.preventScroll) return null;
    if (!process.browser) return null;
    return { scrollX: window.scrollX, scrollY: window.scrollY };
  }

  state = { scrollX: 0, scrollY: 0 };

  componentDidUpdate(prevProps) {
    if (!process.browser) return;
    if (this.props.preventScroll !== prevProps.preventScroll)
      if (!this.props.preventScroll)
        window.scrollTo(this.state.scrollX, this.state.scrollY);
  }

  render() {
    const {
      props: { preventScroll, article, articlePages, articleTimeout, timeout, appContext },
      state: { scrollY }
    } = this;
    return (
      <div id="wrapper">
        <Header timeout={timeout} appContext={appContext} />
        <Main
          article={article}
          articlePages={articlePages}
          articleTimeout={articleTimeout}
          timeout={timeout}
          appContext={appContext}
        />
        <Footer timeout={timeout} appContext={appContext} />
        { preventScroll && (
          <style jsx global>
            {`
              .ReactModal__Body--open {
                position: fixed;
                width: 100%;
                height: 100%;
              }
              #wrapper { margin-top: -${scrollY}px; }
            `}
          </style>
        ) }
      </div>
    );
  }

}

export default Wrapper;