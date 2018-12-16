import PropTypes from "prop-types";
import Lightbox from "components/Lightbox";
import { extensions as mapEx } from "tools/maps";

export default class Main extends React.PureComponent {

  static propTypes = {
    pages: PropTypes.instanceOf(Map).isRequired,
    activePage: PropTypes.string.isRequired,
    timeout: PropTypes.bool.isRequired,
    articleTimeout: PropTypes.bool.isRequired,
    url: PropTypes.any.isRequired
  };

  componentDidUpdate(prevProps) {
    // In the case the route begins to transition, close the lightbox.
    if (this.props.articleTimeout !== prevProps.articleTimeout)
      if (!this.props.articleTimeout)
        Lightbox.forceClose();
  }
  
  render() {
    const { pages, activePage, timeout, articleTimeout, url } = this.props;

    const display = timeout ? "flex" : "none";
    const klass = articleTimeout ? "article-timeout" : null;

    return (
      <div id="main" className={klass} style={{display}}>
        {pages::mapEx.mapToArray(([SomePage, pageProps]) => {
          const { name, isPage } = SomePage.pageData;

          // Filter out components that aren't pages.
          if (!isPage) return null;

          return (
            <SomePage
              {...pageProps}
              key={name}
              id={name}
              active={activePage === name}
              url={url}
            />
          );
        })}
        <Lightbox />
      </div>
    );
  }
}