import PropTypes from "prop-types";
import Lightbox from "components/Lightbox";
import { ImageSync } from "components/AsyncImage";
import { extensions as mapEx } from "tools/maps";

export default class Main extends React.PureComponent {

  static propTypes = {
    article: PropTypes.string,
    articleTimeout: PropTypes.bool.isRequired,
    timeout: PropTypes.bool.isRequired,
    imageSync: PropTypes.instanceOf(ImageSync),
    articlePages: PropTypes.instanceOf(Map).isRequired
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
        {articlePages::mapEx.mapToArray(([pageName, SomePage]) => {
          return <SomePage key={pageName} id={pageName} active={article === pageName} imageSync={imageSync} />;
        })}
        <Lightbox />
      </div>
    );
  }
}