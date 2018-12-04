import PropTypes from "prop-types";
import ReactDOMServer from "react-dom/server";
import Head from "next/head";
import stylesheet from "styles/main.scss";
import lightboxStyle from "react-image-lightbox/style.css";

import { dew } from "tools/common";
import { wait, frameSync } from "tools/async";
import { extensions as strEx } from "tools/strings";
import { extensions as arrEx } from "tools/array";
import { extensions as maybe, nothing } from "tools/maybe";

import NoJavaScript from "components/NoJavaScript";
import Header from "components/Header";
import Main from "components/Main";
import Footer from "components/Footer";
import Page from "components/Page";

// Require all page-components and dump them into an array.
// This is making use of a special feature of webpack.
const context = require.context("../components/pages", false, /\.(js|jsx)$/);
const pageIndex = context.keys().map(file => context(file));

const { Fragment } = React;

const [pageComponents, knownPages] = dew(() => {
  const components = pageIndex::arrEx.collect(({"default": module = nothing}) => {
    if (module::maybe.isEmpty()) return void 0;
    if (!Page.isPage(module)) return void 0;
    return module;
  });

  const nameSet = new Set();
  const collisions = [];
  components.forEach(comp => {
    const { pageName } = comp;
    if (nameSet.has(pageName)) collisions.push(pageName);
    else nameSet.add(pageName);
  });

  if (collisions::arrEx.isNonEmpty())
    throw new Error(`there were multiple page-components with the same name: ${collisions.join(", ")}`);

  return [components, nameSet];
});

// Little component to help solve a hydration error in the version of React in use.
// See: https://github.com/facebook/react/issues/11423#issuecomment-341760646
const NoScript = (props) => {
  const { children, ...otherProps } = props;
  const staticMarkup = ReactDOMServer.renderToStaticMarkup(children);
  return (<noscript {...otherProps} dangerouslySetInnerHTML={{ __html: staticMarkup }} />);
}

const resolvePageToArticle = (page = null) => {
  if (page::strEx.isNullishOrEmpty()) return "";
  if (!knownPages.has(page)) return "404";
  return page;
}

class IndexPage extends React.Component {

  static propTypes = {
    page: PropTypes.string.isRequired,
    transitionsSupported: PropTypes.bool,
    notifyPageReady: PropTypes.func.isRequired
  };

  transitionTarget = nothing;

  transitionTimeout = nothing;

  loadingTimeout = nothing;

  didUnmount = false;

  constructor(props) {
    super(props);

    const havePage = !props.page::strEx.isNullishOrEmpty();
    this.state = {
      isArticleVisible: havePage,
      timeout: havePage,
      articleTimeout: havePage,
      article: havePage ? props.page : "",
      loading: true
    };
  } 

  setLoadingTimeout = (id) => this.loadingTimeout = id;

  setTransitionTimeout = (id) => this.transitionTimeout = id;

  pushState(newState) {
    if (this.didUnmount)
      return new Promise.reject(new Error("component has dismounted during async operation"));
    return new Promise(resolve => this.setState(newState, resolve)).then(frameSync);
  }

  componentDidMount() {
    dew(async () => {
      await frameSync();
      if (this.didUnmount) return;
      this.setState({ loading: false });
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.page !== prevProps.page)
      this.transitionToPage();
  }

  componentWillUnmount() {
    // Cancel asynchronous transitions.
    this.transitionTarget = nothing;
    this.transitionTimeout::maybe.forEach(clearTimeout);
    this.loadingTimeout::maybe.forEach(clearTimeout);
    this.didUnmount = true;
  }

  transitionToPage() {
    const { page, transitionsSupported } = this.props;
    const newArticle = resolvePageToArticle(page);
    const oldArticle = this.transitionTarget ?? this.state.article;

    if (newArticle === oldArticle) return;

    if (!transitionsSupported)
      this.hardTransition(newArticle);
    else {
      const canBeginTransition = this.transitionTarget::maybe.isEmpty();
      this.transitionTarget = newArticle;
      if (!canBeginTransition) return;
      this.beginSoftTransition().catch((error) => {
        // An error is thrown if the component was unmounted during transition.
        // We can ignore this circumstance.
        if (this.didUnmount) return;
        console.error(error);
        // Otherwise, we need to recover; we'll do so by hard transitioning.
        this.hardTransition(this.transitionTarget ?? this.state.article ?? "");
      });
    }
  }
  
  async beginSoftTransition() {
    while (this.transitionTarget::maybe.isDefined()) {
      const {
        transitionTarget: nextArticle,
        state: { timeout, articleTimeout }
      } = this;
      const finalState = !!nextArticle;

      if (timeout && !articleTimeout) {
        // Middle transition state; nothing is currently displayed.
        await this.pushState({ article: nextArticle });
        // If we're transitioning into an article, it should now be displayed.
        if (finalState) await this.doNotifyPageReady();
        // Finalize transition.
        await this.pushState({ timeout: finalState, articleTimeout: finalState });
        await wait(25, this.setTransitionTimeout);
      }
      else if (finalState && !timeout) {
        // Start transitioning from header.
        await this.pushState({ isArticleVisible: true });
        await wait(325, this.setTransitionTimeout);
        await this.pushState({ timeout: true });
      }
      else if (this.state.article !== nextArticle && articleTimeout) {
        // Start transitioning from article.
        await this.pushState({ articleTimeout: false });
        await wait(325, this.setTransitionTimeout);
      }
      else if (!finalState && this.state.isArticleVisible) {
        // Finish transition into header.
        await this.pushState({ isArticleVisible: false });
        // The header should be now be displayed.
        await this.doNotifyPageReady();
      }
      else {
        this.transitionTarget = nothing;
      }
    }
  }

  hardTransition(nextPage) {
    const finalState = !!nextPage;
    const newState = {
      article: nextPage,
      timeout: finalState,
      articleTimeout: finalState,
      isArticleVisible: finalState
    };
    this.setState(newState, this.props.notifyPageReady);
  }

  doNotifyPageReady() {
    this.props.notifyPageReady();
    return frameSync();
  }
  
  render() {
    const { loading, isArticleVisible, timeout, articleTimeout, article } = this.state;
    const { transitionsSupported } = this.props;

    const klass = ["body", "js-only"];
    if (loading) klass.push("is-loading");
    if (isArticleVisible) klass.push("is-article-visible");
    if (transitionsSupported) klass.push("with-transitions");
  
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
        <div className={klass.join(" ")}>
          <div className="prevent-scroll">
            <div id="wrapper">
              <Header timeout={timeout} transition={transitionsSupported} />
              <Main
                article={article}
                articlePages={pageComponents}
                articleTimeout={articleTimeout}
                timeout={timeout}
                transition={transitionsSupported}
              />
              <Footer timeout={timeout} transition={transitionsSupported} />
            </div>
            <div id="bg" />
          </div>
        </div>

      </Fragment>
    );
  }

}

export default IndexPage;
