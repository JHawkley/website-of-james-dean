import ReactDOMServer from "react-dom/server";
import Router from "next/router";
import Head from "next/head";
import stylesheet from "styles/main.scss";
import lightboxStyle from "react-image-lightbox/style.css";
import Modal from "react-modal";
import { parse as parseUrl } from "url";
import { extensions as objEx, dew } from "tools/common";
import { extensions as strEx } from "tools/strings";
import { extensions as maybe, nothing } from "tools/maybe";

import NoJavaScript from "components/NoJavaScript";
import Header from "components/Header";
import Main from "components/Main";
import Footer from "components/Footer";
import Page from "components/Page";

// Making use of `babel-plugin-wildcard`.
import * as pageIndex from "../components/pages";

const { Fragment } = React;

const [pageComponents, knownPages] = dew(() => {
  const components = [];
  pageIndex::objEx.forOwnProps((module) => {
    if (Page.isPage(module)) components.push(module);
  });
  return [components, new Set(components.map(c => c.pageName))];
});

// Little component to help solve a hydration error in the version of React in use.
// See: https://github.com/facebook/react/issues/11423#issuecomment-341760646
const NoScript = (props) => {
  const { children, ...otherProps } = props;
  const staticMarkup = ReactDOMServer.renderToStaticMarkup(children);
  return (<noscript {...otherProps} dangerouslySetInnerHTML={{ __html: staticMarkup }} />);
}

const hashToArticle = (articleHash) => {
  if (articleHash::strEx.isNullishOrEmpty()) return "";
  if (articleHash.startsWith("#")) {
    const article = articleHash.substring(1);
    if (!knownPages.has(article)) return "404";
    return article;
  }
  return "";
}

Modal.setAppElement('#__next');

class IndexPage extends React.Component {

  constructor(props) {
    super(props);
    this.transitionTarget = nothing;
    this.state = {
      isArticleVisible: false,
      timeout: false,
      articleTimeout: false,
      article: "",
      loading: "is-loading"
    };
    this.setState = ::this.setState;
    this.onRouteChangeComplete = ::this.onRouteChangeComplete;
    this.doStateUpdate = ::this.doStateUpdate;
  }

  componentDidMount() {
    if (typeof window.history.scrollRestoration !== "undefined")
      window.history.scrollRestoration = "manual";
    Router.events.on("hashChangeComplete", this.onRouteChangeComplete);
    Router.events.on("routeChangeComplete", this.onRouteChangeComplete);
    
    this.timeoutId = setTimeout(this.setState, 100, { loading: "" });
    // Restore location.
    this.onRouteChangeComplete(Router.router.asPath);
  }

  componentWillUnmount() {
    Router.events.off("hashChangeComplete", this.onRouteChangeComplete);
    Router.events.off("routeChangeComplete", this.onRouteChangeComplete);
    
    if (this.timeoutId)
      clearTimeout(this.timeoutId);
  }
  
  onRouteChangeComplete(as) {
    const newArticle = hashToArticle(parseUrl(as).hash);
    const oldArticle = this.transitionTarget ?? this.state.article;

    if (newArticle === oldArticle) return;

    const canStartTransition = this.transitionTarget::maybe.isEmpty();
    this.transitionTarget = newArticle;

    if (canStartTransition) this.doStateUpdate();
  }
  
  doStateUpdate() {
    const article = this.transitionTarget::maybe.get();
    const finalState = !!article;
    
    if (this.state.timeout && !this.state.articleTimeout) {
      // Middle transition state.
      this.setState({ article }, () => {
        // Fixes a small presentation issue on narrow-screen devices.
        window.scrollTo(window.scrollX, 0);
        // Transition to our final, desired state.
        this.setState(
          { timeout: finalState, articleTimeout: finalState },
          () => setTimeout(this.doStateUpdate, 25)
        );
      });
    }
    else if (finalState && !this.state.timeout) {
      // Transitioning from header.
      this.setState(
        { isArticleVisible: true },
        () => setTimeout(this.setState, 325, { timeout: true }, this.doStateUpdate)
      );
    }
    else if (this.state.article !== article && this.state.articleTimeout) {
      // Transitioning from article.
      this.setState({ articleTimeout: false }, () => setTimeout(this.doStateUpdate, 325));
    }
    else if (!finalState && this.state.isArticleVisible) {
      // Finish transition into header.
      this.setState({ isArticleVisible: false }, this.doStateUpdate);
    }
    else {
      this.transitionTarget = nothing;
    }
  }
  
  render() {
    const { loading, isArticleVisible, timeout, articleTimeout, article } = this.state;
  
    return (
      <Fragment>
        <Head>
          <title>A Programmer's Place</title>
          <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,600,600i" rel="stylesheet" />
        </Head>

        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        <style dangerouslySetInnerHTML={{ __html: lightboxStyle }} />
        <style dangerouslySetInnerHTML={{ __html: "body { overflow-y: scroll; }"}} />

        {/* A special no-script version of the website. */}
        <NoScript>
          <style dangerouslySetInnerHTML={{ __html: ".js-only { display: none !important; }"}} />
          
          <div className="body is-article-visible">
            <div className="prevent-scroll">
              <div id="wrapper">
                <NoJavaScript />
              </div>
              <div id="bg" />
            </div>
          </div>
        </NoScript>

        {/* The normal version of the website. */}
        <div className={`body js-only ${loading} ${isArticleVisible ? "is-article-visible" : ""}`}>
          <div className="prevent-scroll">
            <div id="wrapper">
              <Header timeout={timeout} />
              <Main
                article={article}
                articlePages={pageComponents}
                articleTimeout={articleTimeout}
                timeout={timeout}
              />
              <Footer timeout={timeout} />
            </div>
            <div id="bg" />
          </div>
        </div>

      </Fragment>
    );
  }

}

export default IndexPage;
