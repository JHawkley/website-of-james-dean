import PropTypes from "prop-types";
import ReactDOMServer from "react-dom/server";
import Head from "next/head";
import { canScrollRestore as transitionsSupported } from "pages/_app"

import stylesheet from "styles/main.scss";
import lightboxStyle from "react-image-lightbox/style.css";

import { dew, is, singleton } from "tools/common";
import { Future, CallSync, Stream, wait as asyncWaitFn } from "tools/async";
import { extensions as asyncEx, delayToNextFrame, awaitAll, awaitWhile, abortable } from "tools/async";
import { extensions as maybe, nothing } from "tools/maybe";
import { extensions as mapEx } from "tools/maps";
import dynamic from "next/dynamic";
import DynamicLoader from "components/DynamicLoader";

import { ImageSync } from "components/AsyncImage";
import NoJavaScript from "components/NoJavaScript";
import Header from "components/Header";
import Main from "components/Main";
import Footer from "components/Footer";

import bgImage from "static/images/placeholder_bg.jpg";

const isProduction = process.env.NODE_ENV === 'production';
const isServer = !process.browser;

const { Fragment } = React;

const $$dynError = Symbol("dynamic-import:error");
const $$dynPastDelay = Symbol("dynamic-import:past-delay");
const $$dynDone = Symbol("dynamic-import:done");
const $$dynRetry = Symbol("dynamic-import:retry");

const $$transMiddle = Symbol("transition:middle");
const $$transFromIndex = Symbol("transition:from-index");
const $$transFromPage = Symbol("transition:from-page");
const $$transFinalizeIndex = Symbol("transition:finalize-index");
const $$transDone = Symbol("transition:done");

class IndexPage extends React.PureComponent {

  static propTypes = {
    expectedPage: PropTypes.string,
    preloadedArticle: PropTypes.func,
    notifyPageReady: PropTypes.func.isRequired,
    elementRef: PropTypes.func
  };

  static defaultProps = {
    expectedPage: ""
  };

  static getInitialProps({query}) {
    const expectedPage = query?.page ?? "";
    return { expectedPage };
  }

  imageSync = new ImageSync();

  whenMountedFuture = new Future();

  whenUnmountedFuture = new Future();

  get didMount() {
    return this.whenMountedFuture.isCompleted;
  }

  get didUnmount() {
    return this.whenUnmountedFuture.isCompleted;
  }

  constructor(props) {
    super(props);

    this.state = {
      actualPage: "",
      knownArticles: new Map(),
      asyncError: nothing,
      isArticleVisible: false,
      timeout: false,
      articleTimeout: false,
      loading: true,
      ...this.initialStateFor(props)
    };
  }

  wait = (delay) => asyncWaitFn(delay, this.whenUnmountedFuture.promise);

  frameSync = delayToNextFrame(this.whenUnmountedFuture.promise);

  // eslint-disable-next-line no-unused-vars
  initialStateFor(props) {
    return {};
  }

  async doLoading() {
    // Synchronize on when the CSS background image and the phase 0 images have loaded.
    const bgPromise = isProduction ? bgImage.preload() : bgImage.preload().catch(() => {
      console.warn(`Warning: failed to load the background image: ${bgImage.src}`);
    });

    // Bundle our image-related promises.
    const imagesPromise = awaitAll([bgPromise, this.imageSync.loadToPhase(0)]);

    // Put a max limit before we load anyways.
    const timerPromise = this.wait(2000);
    
    // Now race to see which resolves first!
    await Promise.race([imagesPromise, timerPromise]);
  }

  transitionToPage() {
    throw new Error("the method `transitionToPage` must be overridden; do not call `super.transitionToPage`");
  }

  bodyClass() {
    const { loading, isArticleVisible } = this.state;
    const klass = ["body", "js-only"];
    if (loading) klass.push("is-loading");
    if (isArticleVisible) klass.push("is-article-visible");
    return klass.join(" ");
  }

  componentDidMount() {
    if (isServer) return;
    this.whenMountedFuture.resolve();

    this.doLoading().then(
      () => !this.didUnmount && this.setState({ loading: false }, this.imageSync.loadAllPhases),
      (asyncError) => !this.didUnmount && this.setState({ loading: false, asyncError })
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.expectedPage !== prevProps.expectedPage)
      this.transitionToPage();
    
    if (this.state.asyncError && this.state.asyncError !== prevState.asyncError)
      throw this.state.asyncError;
  }

  componentWillUnmount() {
    // Cancel asynchronous activities.
    this.whenUnmountedFuture.resolve();
  }

  render() {
    const {
      imageSync,
      props: { elementRef },
      state: { timeout, articleTimeout, actualPage, knownArticles }
    } = this;
  
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
        <div className={this.bodyClass()} ref={elementRef}>
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

class SoftIndexPage extends IndexPage {

  static async getRenderProps(props, ctx, ssr) {
    const { expectedPage } = props;
    if (!ssr || !expectedPage) return props;
    try {
      const preloadedArticle = await resolve(expectedPage).promise;
      return { ...props, preloadedArticle };
    }
    catch {
      return props;
    }
  }

  static getRouteChangeProps() {
    return {};
  }

  transitioning = false;

  get transitionState() {
    const { props: { expectedPage }, state: { actualPage, isArticleVisible } } = this;
    // Use of `==` in this getter is intentional.
    if (actualPage == nothing) return actualPage == expectedPage ? $$transDone : $$transMiddle;
    if (actualPage === "" && isArticleVisible) return $$transFinalizeIndex;
    if (actualPage == expectedPage) return $$transDone;
    if (actualPage !== "") return $$transFromPage;
    return $$transFromIndex;
  }

  constructor(props) {
    super(props);
    // Begin loading the article, if necessary.
    this.resolveArticle();
  }

  resolveArticle = dew(() => {
    let lastArticle = null;
    const abortLoadSync = new CallSync();

    this.whenUnmountedFuture.promise.then(() => abortLoadSync.resolve());

    const finishArticle = async (Component) => {
      // Make sure we have mounted first.
      if (!this.didMount) await this.whenMountedFuture.promise;
      // Don't update if we have since unmounted.
      if (this.didUnmount) return Component;
      const knownArticles = this.state.knownArticles::mapEx.added(Component.article, Component);
      await this.promiseState({ knownArticles });
      return Component;
    }

    return () => {
      // Can't do anything if we have unmounted.
      if (this.didUnmount)
        throw new Error("cannot resolve article; page has already unmounted");

      const { props: { expectedPage }, state: { knownArticles } } = this;
  
      // Can't get a null article; just return a promise that will abort
      // when we get a proper article.
      if (expectedPage::maybe.isEmpty())
        return abortable(null, abortLoadSync.sync);

      // If we're getting the landing-page, synchronously return the faux component.
      if (expectedPage === "")
        return LandingPageComponent;
  
      // No need to resolve an article that is already resolved.  Synchronously return it.
      if (knownArticles.has(expectedPage))
        return knownArticles.get(expectedPage);
      
      // And if we have this article resolving already, we can just wait for it to finish.
      if (lastArticle != null && lastArticle.article === expectedPage)
        return lastArticle.promise();
  
      const resolvingArticle = resolve(expectedPage);

      lastArticle = {
        article: expectedPage,
        promise: singleton(() => {
          return resolvingArticle.promise
            .then(finishArticle)
            ::asyncEx.abortOn(abortLoadSync.sync);
        })
      };

      // The promise is actually created after the abort signal is raised.
      // However, we want to make sure that sending this signal doesn't create a race condition
      // between when this new `lastArticle` is set and other calls to `resolveArticle`.
      abortLoadSync.resolve();
      return lastArticle.promise();
    }
  });

  promiseState(newState) {
    if (this.didUnmount)
      return Promise.reject(new Error("component has dismounted during async operation"));
    return new Promise(resolve => this.setState(newState, resolve)).then(this.frameSync);
  }

  initialStateFor(props) {
    const [article, mapElements] = dew(() => {
      const { expectedPage, preloadedArticle } = props;
      if (!preloadedArticle)
        return [expectedPage ?? "", []];
      
      const { article } = preloadedArticle;

      if (!isProduction && article !== expectedPage) {
        console.warn([
          "preloaded component was for unexpected article",
          `expected = ${expectedPage}, received = ${article}`
        ].join("; "));
      }

      return preloadedArticle.article === "" ? ["", []] : [article, [[article, preloadedArticle]]];
    });

    return {
      knownArticles: new Map(mapElements),
      ...this.stateFor(article)
    };
  }

  stateFor(article) {
    switch (article) {
      case null:
      case undefined: return {
        actualPage: nothing,
        timeout: true,
        articleTimeout: false,
        isArticleVisible: true
      };
      case "": return {
        actualPage: "",
        timeout: false,
        articleTimeout: false,
        isArticleVisible: false
      };
      default: return {
        actualPage: article,
        timeout: true,
        articleTimeout: true,
        isArticleVisible: true
      };
    }
  }

  async doLoading() {
    // Begin loading images from the super method.
    const superPromise = super.doLoading();

    // Wait for the article component to be loaded.
    const initialArticle = this.props.expectedPage;
    const loadedComponent = await awaitWhile(this.resolveArticle);

    if (loadedComponent::asyncEx.isAborted())
      throw new Error("initial article component was aborted");
    
    if (loadedComponent.article !== initialArticle)
      await this.doHardTransition(loadedComponent.article);

    // Now wait for those images.
    await superPromise;
  }

  transitionToPage() {
    if (!this.didMount)
      throw new Error("`transitionToPage` was called before the component has finished mounting");
    // Call out to `resolveArticle` to begin loading the new article.
    if (this.props.expectedPage::maybe.isDefined())
      this.resolveArticle();
    // If already transitioning, the changes will be picked up by `doSoftTransition`.
    if (this.transitioning) return;
    this.transitioning = true;

    this.doSoftTransition().catch((error) => {
      this.setState({ asyncError: error });
    });
  }

  async doSoftTransition() {
    while (this.transitionState !== $$transDone && !this.didUnmount) {
      switch (this.transitionState) {
        case $$transMiddle: {
          // Middle transition state; nothing is currently displayed.
          // Wait for our component to finish loading.
          const loadedComponent = await this.resolveArticle();
          if (loadedComponent::asyncEx.isAborted()) continue;
          const isPage = loadedComponent.article !== "";
          // Set the active page.
          await this.promiseState({ actualPage: loadedComponent.article });
          // If we're transitioning into an article, it should now be displayed.
          if (isPage) await this.doNotifyPageReady();
          // Finalize transition.
          await this.promiseState({ timeout: isPage, articleTimeout: isPage });
          await this.wait(25);
          break;
        }
        case $$transFromIndex: {
          // Start transitioning from index.
          await this.promiseState({ isArticleVisible: true });
          await this.wait(325);
          // Deactivate the previous page.
          await this.promiseState({ timeout: true, actualPage: nothing });
          break;
        }
        case $$transFromPage: {
          // Start transitioning from article.
          await this.promiseState({ articleTimeout: false });
          await this.wait(325);
          // Deactivate the previous page.
          await this.promiseState({ actualPage: nothing });
          break;
        }
        case $$transFinalizeIndex: {
          // Finish transition into index.
          await this.promiseState({ isArticleVisible: false });
          // The index should be now be displayed.
          await this.doNotifyPageReady();
          break;
        }
      }
    }

    this.transitioning = false;
  }

  async doHardTransition(article) {
    const newState = this.stateFor(article);
    await this.promiseState(newState);
    if (article::maybe.isDefined())
      await this.doNotifyPageReady();
  }

  doNotifyPageReady() {
    this.props.notifyPageReady();
    return this.frameSync();
  }

  bodyClass() {
    return `${super.bodyClass()} with-transitions`;
  }

}

class HardIndexPage extends IndexPage {

  static async getRenderProps(props) {
    const { expectedPage } = props;
    const preloadedArticle = expectedPage ? (await resolve(expectedPage).promise) : LandingPageComponent;
    return { ...props, preloadedArticle };
  }

  initialStateFor(props) {
    const { preloadedArticle } = props;

    if (preloadedArticle == null)
      throw new Error("there is no preloaded article to build state from");

    const { article } = preloadedArticle;

    switch (article) {
      case "": return {
        knownArticles: new Map(),
        actualPage: article,
        timeout: false,
        articleTimeout: false,
        isArticleVisible: false
      };
      default: return {
        knownArticles: new Map([[article, preloadedArticle]]),
        actualPage: article,
        timeout: true,
        articleTimeout: true,
        isArticleVisible: true
      };
    }
  }

  transitionToPage() {
    if (!this.didMount)
      throw new Error("`transitionToPage` was called before the component has finished mounting");
    if (this.didUnmount) return;
    this.setState(this.initialStateFor(this.props), this.props.notifyPageReady);
  }

}

// Little component to help solve a hydration error in the version of React in use.
// See: https://github.com/facebook/react/issues/11423#issuecomment-341760646
const NoScript = (props) => {
  const { children, ...otherProps } = props;
  const staticMarkup = ReactDOMServer.renderToStaticMarkup(children);
  return (<noscript {...otherProps} dangerouslySetInnerHTML={{ __html: staticMarkup }} />);
}

// A false component for the landing page; aka article empty-string.
const LandingPageComponent = () => null;
LandingPageComponent.article = "";

// A function for resolving components.  Provides a lot of features we're not using!  :D
function resolve(article) {
  if (!article::is.string())
    throw new Error(`expected \`article\` to be a string, but got \`${article}\` instead`);

  if (article === "")
    throw new Error("cannot resolve the landing-page component");

  const progress = new Stream();
  const progressUpdates = progress::asyncEx.fromLatest();
  const Component = dynamic(() => import(`pages/articles/${article}`), {
    loading: DynamicLoader.bindCallbacks({
      onError(error, retryLoader) {
        let didRetry = false;
        const retry = () => {
          if (!didRetry) retryLoader();
          didRetry = true;
          progress.emit({ state: $$dynRetry, value: nothing, article });
        };
        progress.emit({ state: $$dynError, value: { error, retry }, article });
      },
      onPastDelay() {
        progress.emit({ state: $$dynPastDelay, value: nothing, article });
      }
    }),
    webpack: () => [require.resolveWeak(`pages/articles/${article}`)],
    modules: [require.resolveWeak(`pages/articles/${article}`)]
  });

  Component.preload().then(() => {
    progress.emit({ state: $$dynDone, value: Component, article });
    progress.done();
  });

  Component.article = article;

  const singletonPromise = singleton(async () => {
    for await (const { state, value } of progressUpdates) {
      switch (state) {
        case $$dynDone: return value;
        case $$dynError: throw value.error;
      }
    }
    throw new Error([
      "unexpected end-of-updates for the dynamic component belonging",
      `to the \`${article}\` article`
    ].join(" "));
  });

  return {
    get article() { return article; },
    get Component() { return Component },
    get loaded() { return progress.isCompleted && !progress.didError; },
    get promise() { return singletonPromise(); },
    async *updates() {
      for await (const result of progressUpdates) {
        switch (result.state) {
          case $$dynRetry:
            continue;
          default:
            yield result;
            continue;
        }
      }
    }
  };
}

const TheIndexPage = transitionsSupported || isServer ? SoftIndexPage : HardIndexPage;

export default TheIndexPage;
