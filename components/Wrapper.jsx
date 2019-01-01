import PropTypes from "prop-types";
import Header from "components/Header";
import Main from "components/Main";
import Footer from "components/Footer";
import { ImageSync } from "components/AsyncImage";

const Wrapper = ({article, articlePages, articleTimeout, timeout, appContext}) => {
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
    </div>
  );
};

Wrapper.propTypes = {
  article: PropTypes.string,
  articlePages: PropTypes.instanceOf(Map).isRequired,
  articleTimeout: PropTypes.bool.isRequired,
  timeout: PropTypes.bool.isRequired,
  appContext: PropTypes.shape({
    imageSync: PropTypes.instanceOf(ImageSync).isRequired,
    makeGallery: PropTypes.func.isRequired,
    openLightbox: PropTypes.func.isRequired,
    closeLightbox: PropTypes.func.isRequired
  }).isRequired
};

export default Wrapper;