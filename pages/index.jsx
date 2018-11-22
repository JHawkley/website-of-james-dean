import ReactDOMServer from "react-dom/server";
import Router from "next/router";
import Head from "next/head";
import stylesheet from "styles/main.scss";
import lightboxStyle from "react-image-lightbox/style.css";
import Modal from "react-modal";
import { collectProps } from "/tools/common";

import NoJavaScript from "/components/NoJavaScript";
import Header from "/components/Header";
import Main from "/components/Main";
import Footer from "/components/Footer";
import Page from "/components/Page";

const { Fragment } = React;

// Little component to help solve a hydration error in the version of React in use.
// See: https://github.com/facebook/react/issues/11423#issuecomment-341760646
const NoScript = (props) => {
  const { children } = props;
  const { otherProps } = props::collectProps((k, v) => k !== "children" ? v : void 0);
  const staticMarkup = ReactDOMServer.renderToStaticMarkup(children);
  return (<noscript {...otherProps} dangerouslySetInnerHTML={{ __html: staticMarkup }} />);
}

Modal.setAppElement('#__next');

class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isArticleVisible: false,
      timeout: false,
      articleTimeout: false,
      article: "",
      loading: "is-loading"
    };
    this.setState = ::this.setState;
    this.tryStateUpdate = ::this.tryStateUpdate;
    this.doStateUpdate = ::this.doStateUpdate;
  }

  componentDidMount() {
    if (typeof window.history.scrollRestoration !== "undefined")
      window.history.scrollRestoration = "manual";
    Router.router.events.on("hashChangeComplete", this.tryStateUpdate);
    
    this.timeoutId = setTimeout(this.setState, 100, { loading: "" });
    // Restore location.
    this.tryStateUpdate();
  }

  componentWillUnmount() {
    Router.router.events.off("hashChangeComplete", this.tryStateUpdate);
    
    if (this.timeoutId)
      clearTimeout(this.timeoutId);
  }
  
  tryStateUpdate() {
    if (this.transitionStarted) return;
    this.transitionStarted = true;
    this.doStateUpdate();
  }
  
  doStateUpdate() {
    const article = this.getArticleFromHash();
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
      this.transitionStarted = false;
    }
  }
  
  getArticleFromHash() {
    const articleHash = window.location.hash;
    if (articleHash.length > 1 && articleHash.startsWith("#")) {
      const article = articleHash.substring(1);
      if (!Page.knownArticles.has(article)) return "404";
      return article;
    }
    return "";
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
              <div className="js-only">
                <Header timeout={timeout} />
                <Main
                  isArticleVisible={isArticleVisible}
                  timeout={timeout}
                  articleTimeout={articleTimeout}
                  article={article}
                />
                <Footer timeout={timeout} />
              </div>
            </div>
            <div id="bg" />
          </div>
        </div>

      </Fragment>
    );
  }
}

export default IndexPage;
