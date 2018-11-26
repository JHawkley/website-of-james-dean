import ReactDOMServer from "react-dom/server";
import Router from "next/router";
import Head from "next/head";
import stylesheet from "styles/main.scss";
import lightboxStyle from "react-image-lightbox/style.css";
import Modal from "react-modal";
import { parse as parseUrl } from "url";
import { extensions as objEx, dew, delayFor } from "tools/common";
import { extensions as strEx } from "tools/strings";
import { extensions as maybe, nothing } from "tools/maybe";

import NoJavaScript from "components/NoJavaScript";
import Header from "components/Header";
import Main from "components/Main";
import Footer from "components/Footer";
import Page from "components/Page";

// Making use of `babel-plugin-wildcard`.
import * as pageIndex from "../components/pages";

// Setup the modal dialog system.  This should probably be in a custom app component.
Modal.setAppElement('#__next');

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

class IndexPage extends React.Component {

  transitionTarget = nothing;

  transitionTimeout = nothing;

  loadingTimeout = nothing;

  state = {
    isArticleVisible: false,
    timeout: false,
    articleTimeout: false,
    article: "",
    loading: "is-loading"
  };

  setLoadingTimeout = (id) => this.loadingTimeout = id;

  setTransitionTimeout = (id) => this.transitionTimeout = id;

  pushState(newState) {
    return new Promise(resolve => this.setState(newState, resolve));
  }

  componentDidMount() {
    if (typeof window.history.scrollRestoration !== "undefined")
      window.history.scrollRestoration = "manual";
    Router.events.on("hashChangeComplete", this.onRouteChangeComplete);
    Router.events.on("routeChangeComplete", this.onRouteChangeComplete);

    dew(async () => {
      await delayFor(100, this.setLoadingTimeout);
      this.setState({ loading: "" });
    });

    // Restore location.
    this.onRouteChangeComplete(Router.router.asPath);
  }

  componentWillUnmount() {
    Router.events.off("hashChangeComplete", this.onRouteChangeComplete);
    Router.events.off("routeChangeComplete", this.onRouteChangeComplete);

    // Cancel asynchronous transitions.
    this.transitionTarget = nothing;
    this.transitionTimeout::maybe.forEach(clearTimeout);
    this.loadingTimeout::maybe.forEach(clearTimeout);
  }
  
  onRouteChangeComplete = (as) => {
    const newArticle = hashToArticle(parseUrl(as).hash);
    const oldArticle = this.transitionTarget ?? this.state.article;

    if (newArticle === oldArticle) return;

    const canBeginTransition = this.transitionTarget::maybe.isEmpty();
    this.transitionTarget = newArticle;

    if (canBeginTransition) this.beginRouteTransition();
  }
  
  async beginRouteTransition() {
    while (this.transitionTarget::maybe.isDefined()) {
      const { transitionTarget: nextArticle, state: { timeout, articleTimeout } } = this;
      const finalState = !!nextArticle;

      if (timeout && !articleTimeout) {
        // Middle transition state.
        await this.pushState({ article: nextArticle });
        // Fixes a small presentation issue on narrow-screen devices.
        window.scrollTo(window.scrollX, 0);
        await this.pushState({ timeout: finalState, articleTimeout: finalState });
        await delayFor(25, this.setTransitionTimeout);
      }
      else if (finalState && !timeout) {
        // Transitioning from header.
        await this.pushState({ isArticleVisible: true });
        await delayFor(325, this.setTransitionTimeout);
        await this.pushState({ timeout: true });
      }
      else if (this.state.article !== nextArticle && articleTimeout) {
        // Transitioning from article.
        await this.pushState({ articleTimeout: false });
        await delayFor(325, this.setTransitionTimeout);
      }
      else if (!finalState && this.state.isArticleVisible) {
        // Finish transition into header.
        await this.pushState({ isArticleVisible: false });
      }
      else {
        this.transitionTarget = nothing;
      }
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
