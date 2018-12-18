import PropTypes from "prop-types";
import ReactDOMServer from "react-dom/server";
import Head from "next/head";
import { isProduction, isServer } from "?env";
import { canScrollRestore as transitionsSupported } from "pages/_app"

import stylesheet from "styles/main.scss";
import lightboxStyle from "react-image-lightbox/style.css";

import { dew, is } from "tools/common";
import { Future, CallSync, BufferedStream, wait as asyncWaitFn } from "tools/async";
import { extensions as asyncEx, delayToNextFrame, awaitAll, awaitWhile } from "tools/async";
import { extensions as maybe, nothing } from "tools/maybe";
import { extensions as mapEx } from "tools/maps";
//import { dynamic } from "tools/dynamic";
import dynamic from "next/dynamic";
import DynamicLoader from "components/DynamicLoader";

import { ImageSync } from "components/AsyncImage";
import NoJavaScript from "components/NoJavaScript";
import Header from "components/Header";
import Main from "components/Main";
import Footer from "components/Footer";

import bgImage from "static/images/placeholder_bg.jpg";

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

// Little component to help solve a hydration error in the version of React in use.
// See: https://github.com/facebook/react/issues/11423#issuecomment-341760646
const NoScript = (props) => {
  const { children, ...otherProps } = props;
  const staticMarkup = ReactDOMServer.renderToStaticMarkup(children);
  return (<noscript {...otherProps} dangerouslySetInnerHTML={{ __html: staticMarkup }} />);
}

function resolve(article, knownArticles = new Map()) {
  if (!article::is.string())
    throw new Error(`expected \`article\` to be a string, but got \`${article}\` instead`);

  if (article === "" || knownArticles.has(article) === true) {
    const Component = article === "" ? nothing : knownArticles.get(article);
    return {
      article, Component,
      updates: dew(async function*() {
        yield { state: $$dynDone, value: Component, article };
      })
    };
  }

  const progress = new BufferedStream();
  const articleComponent = dynamic(() => import(`pages/articles/${article}`), {
    loading: DynamicLoader.bindCallbacks({
      onError(error, retryLoader) {
        const retry = () => {
          retryLoader();
          progress.emit({ state: $$dynRetry, value: nothing, article });
        };
        progress.emit({ state: $$dynError, value: { error, retry }, article });
      },
      onPastDelay() {
        progress.emit({ state: $$dynPastDelay, value: nothing, article });
      }
    }),
    modules: [`pages/articles/${article}`],
    webpack: () => [require.resolveWeak(`pages/articles/${article}`)]
  });

  articleComponent.preload().then(() => {
    progress.emit({ state: $$dynDone, value: articleComponent, article });
    progress.done();
  });

  return {
    article,
    Component: articleComponent,
    updates: dew(async function*() {
      for await (const result of progress) {
        switch (result.state) {
          case $$dynRetry:
            continue;
          default:
            yield result;
            continue;
        }
      }
    })
  };
}

async function wrapResolvingComponent({article, updates}) {
  if (article === "") return { article, Component: nothing };

  for await (const { state, value } of updates) {
    switch (state) {
      case $$dynDone: return { article, value };
      case $$dynError: throw value.error;
    }
  }

  throw new Error(`unexpected end-of-updates for the dynamic component belonging to the \`${article}\` article`);
}

function acquireComponent(resolvingComponent, knownArticles = new Map()) {
  const { article, Component } = resolvingComponent;
  const newArticles = article === "" ? knownArticles : knownArticles::mapEx.added(article, Component);
  const promise = wrapResolvingComponent(resolvingComponent);

  return { articles: newArticles, promise };
}

class IndexPage extends React.PureComponent {

  static propTypes = {
    expectedPage: PropTypes.string,
    notifyPageReady: PropTypes.func.isRequired,
    elementRef: PropTypes.func
  };

  static getInitialProps({query}) {
    const expectedPage = query?.page ?? "";
    return { expectedPage };
  }

  static getRouteChangeProps() {
    return {};
  }

  imageSync = new ImageSync();

  whenMountedFuture = new Future();

  whenUnmountedFuture = new Future();

  abortLoadSync = new CallSync();

  loadingComponent = nothing;

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

  get didUnmount() {
    return this.whenUnmountedFuture.isCompleted;
  }

  constructor(props) {
    super(props);

    const { expectedPage } = props;
    const actualPage = expectedPage ?? "";
    const havePage = actualPage !== "";

    // Bootstrap our article.  This is usually handled by `manageArticle`, but we need the state now!
    const { articles, promise } = acquireComponent(resolve(actualPage));
    this.loadingComponent = this.finalizeLoadingComponent(
      actualPage, this.whenMountedFuture.promise.then(() => promise)
    );

    this.state = {
      actualPage,
      knownArticles: articles,
      asyncError: nothing,
      isArticleVisible: havePage,
      timeout: havePage,
      articleTimeout: havePage,
      loading: true
    };
  }

  wait = (delay) => asyncWaitFn(delay, this.whenUnmountedFuture.promise);

  frameSync = delayToNextFrame(this.whenUnmountedFuture.promise);

  promiseState(newState) {
    if (this.didUnmount)
      return Promise.reject(new Error("component has dismounted during async operation"));
    return new Promise(resolve => this.setState(newState, resolve)).then(this.frameSync);
  }

  componentDidMount() {
    if (isServer) return;
    this.whenMountedFuture.resolve();

    dew(async () => {
      // Synchronize on when the CSS background image and the phase 0 images have loaded.
      const bgPromise = isProduction ? bgImage.preload() : bgImage.preload().catch(() => {
        console.warn(`Warning: failed to load the background image: ${bgImage.src}`);
      });
      // Bundle our image-related promises.
      const imagesPromise = awaitAll([bgPromise, this.imageSync.loadToPhase(0)]);

      // Wait for the article component to be loaded.
      const loadedComponent = await awaitWhile(() => this.loadingComponent);
      if (loadedComponent::asyncEx.isAborted())
        throw new Error("article component promised before mounting was aborted");
      await this.doHardTransition(loadedComponent.article);
      this.loadingComponent = nothing;

      // Put a max limit before we load anyways.
      const timerPromise = this.wait(2000);
      
      // Now wait for whichever resolves first.
      await Promise.race([imagesPromise, timerPromise]);

      if (this.didUnmount) return;
      this.setState({ loading: false }, this.imageSync.loadAllPhases);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.expectedPage !== prevProps.expectedPage) {
      this.abortLoadSync.resolve();
      if (this.props.expectedPage::maybe.isDefined()) {
        const resolvingComponent = resolve(this.props.expectedPage, this.state.knownArticles);
        this.loadingComponent = this.manageComponent(resolvingComponent);
      }
      this.transitionToPage();
    }
    
    if (this.state.asyncError && this.state.asyncError !== prevState.asyncError)
      throw this.state.asyncError;
  }

  componentWillUnmount() {
    // Cancel asynchronous activities.
    this.abortLoadSync.resolve();
    this.whenUnmountedFuture.resolve();
    this.loadingComponent = nothing;
  }

  async manageComponent(resolvingComponent) {
    const { article } = resolvingComponent;

    const managedPromise = dew(async () => {
      const {
        articles: updatedArticles,
        promise: promisedComponent
      } = acquireComponent(resolvingComponent, this.state.knownArticles);

      await this.promiseState({ knownArticles: updatedArticles });
      return await promisedComponent;
    });

    return this.finalizeLoadingComponent(article, managedPromise);
  }

  finalizeLoadingComponent(article, loadingComponent) {
    loadingComponent.catch(() => {
        const rollbackArticles = this.state.knownArticles::mapEx.without(article);
        this.promiseState({ knownArticles: rollbackArticles });
    });
    return loadingComponent::asyncEx.abortOn(this.abortLoadSync.sync);
  }

  transitionToPage() {
    if (!this.whenMountedFuture.isCompleted)
      throw new Error("`transitionToPage` was called before the component has finished mounting");
    if (this.transitioning) return;
    this.transitioning = true;

    this.beginSoftTransition().catch((error) => {
      this.setState({ asyncError: error });
    });
  }

  async beginSoftTransition() {
    while (this.transitionState !== $$transDone && !this.didUnmount) {
      switch (this.transitionState) {
        case $$transMiddle: {
          // Middle transition state; nothing is currently displayed.
          if (this.loadingComponent::maybe.isEmpty())
            throw new Error("in middle transition state, but no component is loading");
          // Wait for our component to finish loading.
          const loadedComponent = await this.loadingComponent;
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

    this.loadingComponent = nothing;
    this.transitioning = false;
  }

  async doHardTransition(article) {
    switch (article) {
      case "":
        await this.promiseState({
          actualPage: "",
          timeout: false,
          articleTimeout: false,
          isArticleVisible: false
        });
        await this.doNotifyPageReady();
        return;
      case null:
      case undefined:
        await this.promiseState({
          actualPage: nothing,
          timeout: true,
          articleTimeout: false,
          isArticleVisible: true
        });
        return;
      default:
        await this.promiseState({
          actualPage: article,
          timeout: true,
          articleTimeout: true,
          isArticleVisible: true
        });
        await this.doNotifyPageReady();
        return;
    }
  }

  doNotifyPageReady() {
    this.props.notifyPageReady();
    return this.frameSync();
  }
  
  render() {
    const {
      imageSync,
      props: { elementRef },
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
