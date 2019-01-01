import PropTypes from "prop-types";
import { extensions as mapEx } from "tools/maps";

export default class Main extends React.PureComponent {

  static propTypes = {
    article: PropTypes.string,
    articleTimeout: PropTypes.bool.isRequired,
    timeout: PropTypes.bool.isRequired,
    articlePages: PropTypes.instanceOf(Map).isRequired,
    appContext: PropTypes.object.isRequired
  };
  
  render() {
    const { article, timeout, articleTimeout, articlePages, appContext } = this.props;

    const display = timeout ? "flex" : "none";
    const klass = articleTimeout ? "article-timeout" : null;

    return (
      <div id="main" className={klass} style={{display}}>
        {articlePages::mapEx.mapToArray(([pageName, SomePage]) => {
          return <SomePage key={pageName} id={pageName} active={article === pageName} appContext={appContext} />;
        })}
      </div>
    );
  }
}