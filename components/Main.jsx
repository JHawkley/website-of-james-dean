import PropTypes from "prop-types";
import Lightbox from "./Lightbox";
import Page from "./Page";
import { ImageSync } from "./AsyncImage";

export default class Main extends React.Component {

  static propTypes = {
    article: PropTypes.string,
    articlePages: PropTypes.arrayOf((arr, i) => Page.isPage(arr[i])).isRequired,
    articleTimeout: PropTypes.bool.isRequired,
    timeout: PropTypes.bool.isRequired,
    imageSync: PropTypes.instanceOf(ImageSync)
  };

  componentDidUpdate(prevProps) {
    // In the case the route begins to transition, close the lightbox.
    if (this.props.articleTimeout !== prevProps.articleTimeout)
      if (!this.props.articleTimeout)
        Lightbox.forceClose();
  }
  
  render() {
    const { article, timeout, articleTimeout, articlePages, imageSync } = this.props;

    const display = timeout ? "flex" : "none";
    const klass = articleTimeout ? "article-timeout" : null;

    return (
      <div id="main" className={klass} style={{display}}>
        {articlePages.map(SomePage => {
          const pageName = SomePage.pageName;
          return <SomePage key={pageName} active={article === pageName} imageSync={imageSync} />;
        })}
        <Lightbox />
      </div>
    );
  }
}