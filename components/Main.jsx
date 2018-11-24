import PropTypes from "prop-types";
import { extensions as maybe } from "tools/maybe";
import Lightbox from "./Lightbox";
import Page from "./Page";

export default class Main extends React.Component {

  static propTypes = {
    article: PropTypes.string,
    articlePages: PropTypes.arrayOf((arr, i) => Page.isPage(arr[i])).isRequired,
    articleTimeout: PropTypes.bool.isRequired,
    timeout: PropTypes.bool.isRequired
  };

  componentDidUpdate(prevProps) {
    // In the case the route begins to transition, close the lightbox.
    if (this.props.articleTimeout !== prevProps.articleTimeout)
      if (!this.props.articleTimeout)
        Lightbox.forceClose();
  }
  
  render() {
    const { article, timeout, articleTimeout, articlePages } = this.props;
    const klass = "article-timeout"::maybe.when(articleTimeout);

    return (
      <div id="main" className={klass} style={{display: timeout ? "flex" : "none"}}>
        {articlePages.map(SomePage => {
          const pageName = SomePage.pageName;
          return <SomePage key={pageName} active={article === pageName} />;
        })}
        <Lightbox />
      </div>
    );
  }
}