import PropTypes from "prop-types";
import ReactDOMServer from "react-dom/server";
import Head from "next/head";
import environment from "?env";

import stylesheet from "styles/main.scss";
import lightboxStyle from "react-image-lightbox/style.css";

import { dew } from "tools/common";
import { extensions as promiseEx, wait, delayToNextFrame, awaitAll } from "tools/async";
import { extensions as strEx } from "tools/strings";
import { extensions as maybe, nothing } from "tools/maybe";

import { ImageSync } from "components/AsyncImage";
import NoJavaScript from "components/NoJavaScript";
import Header from "components/Header";
import Main from "components/Main";
import Footer from "components/Footer";
import FourOhFour from "pages/articles/404";
import $404 from "pages/articles/404?name";

import bgImage from "static/images/placeholder_bg.jpg";

const { isProduction } = environment.isProduction;
const { Fragment } = React;

// Little component to help solve a hydration error in the version of React in use.
// See: https://github.com/facebook/react/issues/11423#issuecomment-341760646
const NoScript = (props) => {
  const { children, ...otherProps } = props;
  const staticMarkup = ReactDOMServer.renderToStaticMarkup(children);
  return (<noscript {...otherProps} dangerouslySetInnerHTML={{ __html: staticMarkup }} />);
}

const resolve = async (page, knownArticles) => {
  if (page === "" || knownArticles.has(page))
    return { knownArticles, actualPage: page };
  
  const articleModule = await (import("pages/articles/" + page)::promiseEx.orUndefined());
  const component = articleModule?.default;

  if (component::maybe.isEmpty())
    return { knownArticles, actualPage: $404 };

  knownArticles = new Map(knownArticles.set(page, component));
  return { knownArticles, actualPage: page };
}

class IndexPage extends React.PureComponent {

  static propTypes = {
    expectedPage: PropTypes.string.isRequired,
    transitionsSupported: PropTypes.bool,
    notifyPageReady: PropTypes.func.isRequired,
    elementRef: PropTypes.func
  };

  static getInitialProps = ({query}) => ({ expectedPage: query?.page ?? "" });

  imageSync = new ImageSync();

  transitionTarget = nothing;

  transitionTimeout = nothing;

  loadingTimeout = nothing;

  animationHandle = nothing;

  didUnmount = false;

  constructor(props) {
    super(props);

    const havePage = !props.expectedPage::strEx.isNullishOrEmpty();
    this.state = {
      knownArticles: new Map([[$404, FourOhFour]]),
      actualPage: props.expectedPage,
      isArticleVisible: havePage,
      timeout: havePage,
      articleTimeout: havePage,
      loading: true
    };
  }

  setTransitionTimeout = (id) => this.transitionTimeout = id;

  setLoadingTimeout = (id) => this.loadingTimeout = id;

  frameSync = delayToNextFrame((handle) => this.animationHandle = handle);

  promiseState(newState) {
    if (this.didUnmount)
      return new Promise.reject(new Error("component has dismounted during async operation"));
    return new Promise(resolve => this.setState(newState, resolve)).then(this.frameSync);
  }

  componentDidMount() {
    dew(async () => {
      // Wait for the page to be loaded.
      await this.hardTransition();

      // Synchronize on when the CSS background image and the phase 0 images have loaded.
      const bgPromise = isProduction ? bgImage.preload() : bgImage.preload().catch(() => {
        console.warn(`Warning: failed to load the background image: ${bgImage.src}`);
      });
      // Bundle our image-related promises.
      const imagesPromise = awaitAll([bgPromise, this.imageSync.loadToPhase(0)]);
      // Put a max limit before we load anyways.
      const timerPromise = wait(2000, this.setLoadingTimeout);
      // Now wait for whichever resolves first.
      await Promise.race([imagesPromise, timerPromise]);

      if (this.didUnmount) return;
      this.setState({ loading: false }, this.imageSync.loadAllPhases);
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.expectedPage !== prevProps.expectedPage)
      this.transitionToPage();
  }

  componentWillUnmount() {
    // Cancel asynchronous activities.
    this.transitionTarget = nothing;
    this.transitionTimeout::maybe.forEach(clearTimeout);
    this.loadingTimeout::maybe.forEach(clearTimeout);
    this.animationHandle::maybe.forEach(cancelAnimationFrame);
    this.didUnmount = true;
  }

  async acquireComponent() {
    const { props: { expectedPage }, state: { knownArticles } } = this;
    const newState = await resolve(expectedPage, knownArticles);
    await this.promiseState(newState);
    return newState.actualPage === expectedPage;
  }

  transitionToPage() {
    const { expectedPage, transitionsSupported } = this.props;
    const currentPage = this.transitionTarget ?? this.state.actualPage;

    if (expectedPage === currentPage) return;

    if (!transitionsSupported)
      this.hardTransition();
    else {
      const canBeginTransition = this.transitionTarget::maybe.isEmpty();
      this.transitionTarget = expectedPage;
      if (!canBeginTransition) return;
      this.beginSoftTransition().catch((error) => {
        // An error is thrown if the component was unmounted during transition.
        // We can ignore this circumstance.
        if (this.didUnmount) return;
        if (!isProduction) console.error(error);
        // Otherwise, we need to recover; we'll do so by hard transitioning.
        this.hardTransition(this.transitionTarget ?? this.state.actualPage ?? "");
      });
    }
  }
  
  async beginSoftTransition() {
    while (this.transitionTarget::maybe.isDefined()) {
      const {
        transitionTarget: targetPage,
        state: { timeout, articleTimeout, actualPage }
      } = this;
      const finalState = !!targetPage;

      if (timeout && !articleTimeout) {
        console.log("middle transition");
        // Middle transition state; nothing is currently displayed.
        if (targetPage !== actualPage) {
          console.log("fetching state");
          // Finish getting our new state.
          await this.acquireComponent();
          this.transitionTarget = this.state.actualPage;
        }
        else {
          console.log("final transitions");
          // If we're transitioning into an article, it should now be displayed.
          if (finalState) await this.doNotifyPageReady();
          // Finalize transition.
          await this.promiseState({ timeout: finalState, articleTimeout: finalState });
          await wait(25, this.setTransitionTimeout);
        }
      }
      else if (finalState && !timeout) {
        console.log("transition from header");
        // Start transitioning from header.
        await this.promiseState({ isArticleVisible: true });
        await wait(325, this.setTransitionTimeout);
        await this.promiseState({ timeout: true });
      }
      else if (this.state.actualPage !== targetPage && articleTimeout) {
        console.log("transitioning from article");
        // Start transitioning from article.
        await this.promiseState({ articleTimeout: false });
        await wait(325, this.setTransitionTimeout);
      }
      else if (!finalState && this.state.isArticleVisible) {
        console.log("final transition into header");
        // Finish transition into header.
        await this.promiseState({ isArticleVisible: false });
        // The header should be now be displayed.
        await this.doNotifyPageReady();
      }
      else {
        console.log("done");
        this.transitionTarget = nothing;
      }
    }
  }

  async hardTransition(givenPage) {
    const haveGivenPage = givenPage::maybe.isDefined();
    
    if (haveGivenPage) {
      const knownArticles = this.state.knownArticles;
      const actualPage = knownArticles.has(givenPage) ? givenPage : $404;
      const finalState = !!actualPage;
      const newState = {
        actualPage,
        timeout: finalState,
        articleTimeout: finalState,
        isArticleVisible: finalState
      };
      this.setState(newState, this.props.notifyPageReady);
    }
    else {
      // Hide the page while waiting for the load.
      await this.promiseState({ timeout: true, articleTimeout: false });
      await this.acquireComponent();
      const finalState = !!this.state.actualPage;
      const newState = {
        timeout: finalState,
        articleTimeout: finalState,
        isArticleVisible: finalState
      };
      this.setState(newState, this.props.notifyPageReady);
    }
  }

  doNotifyPageReady() {
    this.props.notifyPageReady();
    return this.frameSync();
  }
  
  render() {
    const {
      imageSync,
      props: { transitionsSupported, elementRef },
      state: { loading, isArticleVisible, timeout, articleTimeout, actualPage, knownArticles }
    } = this;

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
        <div className={klass.join(" ")} ref={elementRef}>
          <div className="prevent-scroll">
            <div id="wrapper">
              <Header timeout={timeout} transition={transitionsSupported} imageSync={imageSync} />
              <Main
                article={actualPage}
                articlePages={knownArticles}
                articleTimeout={articleTimeout}
                timeout={timeout}
                transition={transitionsSupported}
                imageSync={imageSync}
              />
              <Footer timeout={timeout} transition={transitionsSupported} imageSync={imageSync} />
            </div>
            <div id="bg" />
          </div>
        </div>

      </Fragment>
    );
  }

}

export default IndexPage;
