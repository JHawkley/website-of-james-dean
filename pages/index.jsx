import React, { Fragment } from "react";
import PropTypes from "prop-types";
import ReactDOMServer from "react-dom/server";
import Head from "next/head";
import { canScrollRestore as transitionsSupported } from "tools/scrollRestoration";

import { dew, is, singleton } from "tools/common";
import { timespan, dequote } from "tools/css";
import { Future, CallSync, Stream, AbortedError, wait as asyncWaitFn } from "tools/async";
import { extensions as asyncEx, delayToNextFrame, awaitWhile, abortable, preloadImage } from "tools/async";
import { extensions as asyncIterEx } from "tools/asyncIterables";
import { extensions as maybe, nothing } from "tools/maybe";
import { extensions as mapEx } from "tools/maps";
import * as parsing from "tools/parsing/index";
import dynamic from "next/dynamic";
import DynamicLoader from "components/DynamicLoader";

import PreloadSync from "components/Preloader/PreloadSync";
import NoJavaScript from "components/NoJavaScript";
import Wrapper from "components/Wrapper";
import Lightbox from "components/Lightbox";
import LoadingSpinner from "components/LoadingSpinner";

import styleVars from "styles/vars.json";

const isProduction = process.env.NODE_ENV === 'production';

const articleTransition = timespan(styleVars.duration.article);
const throbberFadeTime = timespan(styleVars.duration.modal);

const $$dynError = Symbol("dynamic-import:error");
const $$dynPastDelay = Symbol("dynamic-import:past-delay");
const $$dynDone = Symbol("dynamic-import:done");
const $$dynRetry = Symbol("dynamic-import:retry");

const $$transMiddle = Symbol("transition:middle");
const $$transFromIndex = Symbol("transition:from-index");
const $$transFromArticle = Symbol("transition:from-article");
const $$transFinalizeIndex = Symbol("transition:finalize-index");
const $$transDone = Symbol("transition:done");

const $componentMounted = "component mounted";
const $componentUnmounted = "component unmounted";

const fixedLoaderStyle = { zIndex: 3 };

class IndexPage extends React.PureComponent {

  static propTypes = {
    expectedArticle: PropTypes.string,
    preloadedArticle: PropTypes.func,
    notifyPageReady: PropTypes.func.isRequired,
    elementRef: PropTypes.func
  };

  static defaultProps = {
    expectedArticle: ""
  };

  static getInitialProps({query}) {
    const expectedArticle = query?.article ?? "";
    return { expectedArticle };
  }

  scrollPrevention = new Set();

  appContext = dew(() => {
    const openLightbox = (data, index = 0) => {
      const { lightboxData: curData } = this.state;
      if (curData && curData !== data)
        throw new Error("only one gallery may be shown by the lightbox at a time");
      this.scrollPrevention.add(data);
      this.setState({ lightboxData: data, lightboxIndex: index, preventScroll: this.scrollPrevention.size > 0 });
    };
    const closeLightbox = () => {
      const { lightboxData: curData } = this.state;
      this.scrollPrevention.delete(curData);
      this.setState({ lightboxData: nothing, lightboxIndex: 0, preventScroll: this.scrollPrevention.size > 0 });
    };
    const enableScroll = (source) => {
      if (!source) throw new Error("a source object must be provided to enable scrolling");
      this.scrollPrevention.delete(source);
      this.setState({ preventScroll: this.scrollPrevention.size > 0 });
    };
    const disableScroll = (source) => {
      if (!source) throw new Error("a source object must be provided to disable scrolling");
      this.scrollPrevention.add(source);
      this.setState({ preventScroll: this.scrollPrevention.size > 0 });
    };

    return Object.freeze({
      preloadSync: new PreloadSync(),
      makeGallery: (data) => Lightbox.makeGallery(data, openLightbox, closeLightbox),
      openLightbox, closeLightbox,
      enableScroll, disableScroll
    });
  });

  whenMountedFuture = new Future(p => p::asyncEx.abortionReason($componentMounted));

  whenUnmountedFuture = new Future(p => p::asyncEx.abortionReason($componentUnmounted));

  get didMount() {
    return this.whenMountedFuture.isCompleted;
  }

  get didUnmount() {
    return this.whenUnmountedFuture.isCompleted;
  }

  constructor(props) {
    super(props);

    this.state = {
      actualArticle: "",
      knownArticles: new Map(),
      asyncError: nothing,
      isArticleVisible: false,
      timeout: false,
      articleTimeout: false,
      loading: true,
      ...this.initialStateFor(props),
      lightboxData: nothing,
      lightboxIndex: 0,
      preventScroll: false
    };
  }

  wait = (delay) => asyncWaitFn(delay, this.whenUnmountedFuture.promise);

  frameSync = delayToNextFrame(this.whenUnmountedFuture.promise);

  // eslint-disable-next-line no-unused-vars
  initialStateFor(props) {
    return {};
  }

  async doLoading() {
    // Synchronize on when the CSS background image has loaded.
    const bgPromise = dew(() => {
      const bgImageSrc = dequote(styleVars.misc["bg-image"]);
      const bgPromise = preloadImage(bgImageSrc);
      return isProduction ? bgPromise : bgPromise.catch(() => {
        console.warn(`warning: failed to load the background image: ${bgImageSrc}`);
      });
    });

    // Put a max limit before we load anyways.
    const timerPromise = this.wait(2000);
    
    // Now race to see which resolves first!
    await Promise.race([bgPromise, timerPromise]);
  }

  transitionToArticle() {
    throw new Error("the method `transitionToArticle` must be overridden; do not call `super.transitionToArticle`");
  }

  bodyClass() {
    const { loading, isArticleVisible } = this.state;
    const className = ["body", "js-only"];
    if (loading) className.push("is-loading");
    if (isArticleVisible) className.push("is-article-visible");
    return className.join(" ");
  }

  componentDidMount() {
    if (!process.browser) return;
    this.whenMountedFuture.resolve();

    this.doLoading().then(
      () => !this.didUnmount && this.setState({ loading: false }),
      (asyncError) => !this.didUnmount && this.setState({ loading: false, asyncError })
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.expectedArticle !== prevProps.expectedArticle) {
      this.appContext.closeLightbox();
      this.transitionToArticle();
    }
    
    if (this.state.asyncError && this.state.asyncError !== prevState.asyncError)
      throw this.state.asyncError;
  }

  componentWillUnmount() {
    // Cancel asynchronous activities.
    this.whenUnmountedFuture.resolve();
  }

  extraContent() {
    return null;
  }

  render() {
    const {
      appContext,
      props: { elementRef },
      state: {
        lightboxData: lbData, lightboxIndex: lbIndex,
        preventScroll,
        loading, timeout, articleTimeout,
        actualArticle, knownArticles
      }
    } = this;
  
    return (
      <Fragment>
        <Head>
          <title>A Programmer's Place</title>
          <style dangerouslySetInnerHTML={{ __html: "body { overflow-y: scroll; }"}} />
        </Head>

        {/* A special no-script version of the website. */}
        <NoScript>
          <style dangerouslySetInnerHTML={{ __html: ".js-only { display: none !important; }"}} />
          
          <div className="body is-article-visible">
            <div className="hide-overflow">
              <div id="wrapper">
                <NoJavaScript />
              </div>
              <div id="bg" />
            </div>
          </div>
        </NoScript>

        {/* The normal version of the website. */}
        <div className={this.bodyClass()} ref={elementRef}>
          <div className="hide-overflow">
            <Wrapper
              preventScroll={preventScroll}
              article={actualArticle}
              articlePages={knownArticles}
              articleTimeout={articleTimeout}
              timeout={timeout}
              appContext={appContext}
            />
            <Lightbox images={lbData} initialIndex={lbIndex} onCloseRequest={appContext.closeLightbox} />
            <LoadingSpinner size="3x" fadeTime={throbberFadeTime} show={loading} style={fixedLoaderStyle} fixed />
            { this.extraContent() }
            <div id="bg" />
          </div>
        </div>

      </Fragment>
    );
  }

}

class SoftIndexPage extends IndexPage {

  static async getRenderProps(props, ctx, ssr) {
    const { expectedArticle } = props;
    if (!ssr || !expectedArticle) return props;
    try {
      const preloadedArticle = await resolve(expectedArticle).promise;
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
    const { props: { expectedArticle }, state: { actualArticle, isArticleVisible } } = this;
    // Use of `==` in this getter is intentional.
    if (actualArticle == nothing) return actualArticle == expectedArticle ? $$transDone : $$transMiddle;
    if (actualArticle === "" && isArticleVisible) return $$transFinalizeIndex;
    if (actualArticle == expectedArticle) return $$transDone;
    if (actualArticle !== "") return $$transFromArticle;
    return $$transFromIndex;
  }

  constructor(props) {
    super(props);
    // Begin loading the article, if necessary.
    this.resolveArticle();
  }

  resolveArticle = dew(() => {
    let lastArticle = null;
    const abortLoadSync = new CallSync((p) => {
      const decorated = abortable(p, this.whenUnmountedFuture.promise);
      return decorated::asyncEx.abortionReason("new article was requested");
    });

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

      const { props: { expectedArticle }, state: { knownArticles } } = this;
  
      // Can't get a null article; just return a promise that will abort
      // when we get a proper article.
      if (expectedArticle::maybe.isEmpty())
        return abortable(null, abortLoadSync.sync);

      // If we're getting the landing-page, synchronously return the faux component.
      if (expectedArticle === "")
        return LandingPageComponent;
  
      // No need to resolve an article that is already resolved.  Synchronously return it.
      if (knownArticles.has(expectedArticle))
        return knownArticles.get(expectedArticle);
      
      // And if we have this article resolving already, we can just wait for it to finish.
      if (lastArticle != null && lastArticle.article === expectedArticle)
        return lastArticle.promise();
  
      const resolvingArticle = resolve(expectedArticle);

      lastArticle = {
        article: expectedArticle,
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
    };
  });

  promiseState(newState) {
    return new Promise((resolve, reject) => {
      if (this.didUnmount) return reject(new AbortedError($componentUnmounted));
      this.setState(newState, resolve);
    });
  }

  initialStateFor(props) {
    const [article, mapElements] = dew(() => {
      const { expectedArticle, preloadedArticle } = props;
      if (!preloadedArticle)
        return [expectedArticle ?? "", []];
      
      const { article } = preloadedArticle;

      if (!isProduction && article !== expectedArticle) {
        console.warn([
          "preloaded component was for unexpected article",
          `expected = ${expectedArticle}, received = ${article}`
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
        actualArticle: nothing,
        timeout: true,
        articleTimeout: false,
        isArticleVisible: true
      };
      case "": return {
        actualArticle: "",
        timeout: false,
        articleTimeout: false,
        isArticleVisible: false
      };
      default: return {
        actualArticle: article,
        timeout: true,
        articleTimeout: true,
        isArticleVisible: true
      };
    }
  }

  async doLoading() {
    // Begin loading images from the super method.
    const superPromise = super.doLoading();

    const initialArticle = this.props.expectedArticle;
    let loadedComponent;

    try {
      // Wait for the article component to be loaded.
      loadedComponent = await awaitWhile(this.resolveArticle);
    }
    catch(error) {
      if (error instanceof AbortedError)
        throw new Error("initial article component was aborted");
      throw error;
    }

    if (loadedComponent.article !== initialArticle)
        await this.doHardTransition(loadedComponent.article);

    // Now wait for those images.
    await superPromise;
  }

  transitionToArticle() {
    if (!this.didMount)
      throw new Error("`transitionToArticle` was called before the component has finished mounting");
    // Call out to `resolveArticle` to begin loading the new article.
    if (this.props.expectedArticle::maybe.isDefined())
      this.resolveArticle();
    // If already transitioning, the changes will be picked up by `doSoftTransition`.
    if (this.transitioning) return;
    this.transitioning = true;

    this.doSoftTransition().catch((error) => {
      if (error instanceof AbortedError) return;
      this.setState({ asyncError: error });
    });
  }

  async doSoftTransition() {
    while (this.transitionState !== $$transDone && !this.didUnmount) {
      switch (this.transitionState) {
        case $$transMiddle: {
          // Middle transition state; nothing is currently displayed.
          // Wait for our component to finish loading.
          let loadedComponent;
          try {
            loadedComponent = await this.resolveArticle();
          }
          catch (error) {
            if (error instanceof AbortedError) continue;
            throw error;
          }
          const isArticle = loadedComponent.article !== "";
          // Set the active article.
          await this.promiseState({ actualArticle: loadedComponent.article });
          // If we're transitioning into an article, it should now be displayed.
          if (isArticle) await this.doNotifyPageReady();
          // Finalize transition.
          await this.promiseState({ timeout: isArticle, articleTimeout: isArticle });
          await this.wait(25);
          break;
        }
        case $$transFromIndex: {
          // Start transitioning from index.
          await this.promiseState({ isArticleVisible: true });
          await this.wait(articleTransition);
          // Deactivate the previous article.
          await this.promiseState({ timeout: true, actualArticle: nothing });
          break;
        }
        case $$transFromArticle: {
          // Start transitioning from article.
          await this.promiseState({ articleTimeout: false });
          await this.wait(articleTransition);
          // Deactivate the previous article.
          await this.promiseState({ actualArticle: nothing });
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

  extraContent() {
    const { loading, actualArticle } = this.state;

    return (
      <LoadingSpinner
        delay={articleTransition * 0.5}
        fadeTime={throbberFadeTime}
        size="3x"
        show={loading ? false : actualArticle::maybe.isEmpty()}
        style={fixedLoaderStyle}
        background
        fixed
      />
    );
  }

}

class HardIndexPage extends IndexPage {

  static propTypes = {
    ...IndexPage.propTypes,
    routeChanging: PropTypes.bool.isRequired
  };

  static async getRenderProps(props) {
    const { expectedArticle } = props;
    const preloadedArticle = expectedArticle ? (await resolve(expectedArticle).promise) : LandingPageComponent;
    return { ...props, preloadedArticle, routeChanging: false };
  }

  static getRouteChangeProps(props) {
    return { ...props, routeChanging: true };
  }

  initialStateFor(props) {
    const { preloadedArticle } = props;

    if (preloadedArticle == null)
      throw new Error("there is no preloaded article to build state from");

    const { article } = preloadedArticle;

    switch (article) {
      case "": return {
        knownArticles: new Map(),
        actualArticle: article,
        timeout: false,
        articleTimeout: false,
        isArticleVisible: false
      };
      default: return {
        knownArticles: new Map([[article, preloadedArticle]]),
        actualArticle: article,
        timeout: true,
        articleTimeout: true,
        isArticleVisible: true
      };
    }
  }

  transitionToArticle() {
    if (!this.didMount)
      throw new Error("`transitionToArticle` was called before the component has finished mounting");
    if (this.didUnmount) return;
    this.setState(this.initialStateFor(this.props), this.props.notifyPageReady);
  }

  extraContent() {
    const { props: { routeChanging }, state: { loading } } = this;
    
    return (
      <LoadingSpinner
        delay={articleTransition}
        fadeTime={throbberFadeTime}
        hPos="right" vPos="bottom" size="2x"
        show={loading ? false : routeChanging}
        style={fixedLoaderStyle}
        fixed
      />
    );
  }

}

// Little component to help solve a hydration error in the version of React in use.
// See: https://github.com/facebook/react/issues/11423#issuecomment-341760646
const NoScript = (props) => {
  const { children, ...otherProps } = props;
  const staticMarkup = ReactDOMServer.renderToStaticMarkup(children);
  return (<noscript {...otherProps} dangerouslySetInnerHTML={{ __html: staticMarkup }} />);
}

// A false component for the landing-page; aka the article named empty-string.
const LandingPageComponent = () => null;
LandingPageComponent.article = "";

// The context for resolving articles.  This is an effort to correct a problem with using `import`.
// The `react-loadable-plugin` Next.js provides for Webpack produces a loadable-manifest that is
// incompatible with imports that make use of string-interpolation.
const articlesCtx = dew(() => {
  const { atomic: { str }, combinators: { oneOf }, template: { parser: p, interpolate }, run } = parsing;
  const parser = p`./${interpolate}.${oneOf(str("js"), str("jsx"))}`;

  const lazyCtx = require.context("components/articles", false, /\.(js|jsx)$/, "lazy");
  const weakCtx = require.context("components/articles", false, /\.(js|jsx)$/, "weak");

  const mapOfKeys = new Map(weakCtx.keys().map(k => [run(parser, k)[0], k]));
  const keyFor = (article) => mapOfKeys.get(article) ?? throw new Error("the given article could not be located");

  const requireArticle = (article) => lazyCtx(keyFor(article));
  requireArticle.id = lazyCtx.id;
  requireArticle.resolve = (article) => weakCtx.resolve(keyFor(article));
  requireArticle.articles = () => [...mapOfKeys.keys()];
  requireArticle.keys = weakCtx.keys;
  requireArticle.moduleFor = keyFor;
  return requireArticle;
});

// A function for resolving components.  Provides a lot of features we're not using!  :D
function resolve(article) {
  if (!article::is.string())
    throw new Error(`expected \`article\` to be a string, but got \`${article}\` instead`);

  if (article === "")
    throw new Error("cannot resolve the landing-page component");

  const progress = new Stream();
  const progressUpdates = progress::asyncIterEx.fromLatest();
  const Component = dynamic(() => articlesCtx(article), {
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
    webpack: () => [articlesCtx.resolve(article)],
    modules: [articlesCtx.moduleFor(article)]
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

const TheIndexPage = transitionsSupported || !process.browser ? SoftIndexPage : HardIndexPage;

export default TheIndexPage;
