import PropTypes from "prop-types";
import ReactDOMServer from "react-dom/server";
import Head from "next/head";
import environment from "?env";

import stylesheet from "styles/main.scss";
import lightboxStyle from "react-image-lightbox/style.css";

import { dew, compareOwnProps } from "tools/common";
import { wait, delayToNextFrame } from "tools/async";
import { extensions as maybe, nothing } from "tools/maybe";

import NoJavaScript from "components/NoJavaScript";
import Header from "components/Header";
import Main from "components/Main";
import Footer from "components/Footer";
import { canScrollRestore } from "tools/scrollRestoration";

import bgImage from "static/images/placeholder_bg.jpg";

const { isProduction } = environment;
const { Fragment } = React;

const $$middle = Symbol("middle");
const $$fromIndex = Symbol("fromIndex");
const $$fromPage = Symbol("fromPage");
const $$finalizeIndex = Symbol("finalizeIndex");
const $$done = Symbol("done");

// Little component to help solve a hydration error in the version of React in use.
// See: https://github.com/facebook/react/issues/11423#issuecomment-341760646
const NoScript = (props) => {
  const { children, ...otherProps } = props;
  const staticMarkup = ReactDOMServer.renderToStaticMarkup(children);
  return (<noscript {...otherProps} dangerouslySetInnerHTML={{ __html: staticMarkup }} />);
}

const propTypes = {
  RoutePage: PropTypes.func,
  routeProps: PropTypes.object,
  notifyPageReady: PropTypes.func.isRequired,
  elementRef: PropTypes.func.isRequired,
  url: PropTypes.any.isRequired
};

const render = (elementRef, url, components, activePage, withTransitions, bodyState) => {
  const { loading, isArticleVisible, timeout, articleTimeout } = bodyState;

  const klass = ["body", "js-only"];
  if (loading) klass.push("is-loading");
  if (isArticleVisible) klass.push("is-article-visible");
  if (withTransitions) klass.push("with-transitions");

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
            <Header timeout={timeout} />
            <Main
              pages={components}
              activePage={activePage ?? ""}
              articleTimeout={articleTimeout}
              timeout={timeout}
              url={url}
            />
            <Footer timeout={timeout} />
          </div>
          <div id="bg" />
        </div>
      </div>
    </Fragment>
  );
}

class SoftBody extends React.PureComponent {

  static propTypes = propTypes;

  static getDerivedStateFromProps({RoutePage, routeProps}, prevState) {
    if (RoutePage::maybe.isEmpty()) return nothing;

    const { components } = prevState;
    if (!components.has(RoutePage) || !compareOwnProps(routeProps, components.get(RoutePage)))
      return { components: new Map(components.set(RoutePage, routeProps)) };
    
    return nothing;
  }

  transitionTimeout = nothing;

  loadingTimeout = nothing;

  animationHandle = nothing;

  didUnmount = false;

  transitioning = false;

  constructor(props, ...args) {
    super(props, ...args);

    const { RoutePage } = props;

    const initialState = dew(() => {
      if (RoutePage::maybe.isEmpty())
        return { isArticleVisible: true, timeout: true, articleTimeout: false };
      const { isPage } = RoutePage.pageData;
      return { isArticleVisible: isPage, timeout: isPage, articleTimeout: isPage };
    });

    this.state = {
      components: new Map(),
      ActivePage: RoutePage,
      loading: true,
      ...initialState
    };
  }

  get transitionState() {
    const { props: { RoutePage }, state: { ActivePage, isArticleVisible } } = this;
    // Use of `==` in this getter is intentional.
    if (ActivePage == null) return ActivePage == RoutePage ? $$done : $$middle;
    if (!ActivePage.pageData.isPage && isArticleVisible) return $$finalizeIndex;
    if (ActivePage == RoutePage) return $$done;
    if (ActivePage.pageData.isPage) return $$fromPage;
    return $$fromIndex;
  }

  setTransitionTimeout = (id) => this.transitionTimeout = id;

  setLoadingTimeout = (id) => this.loadingTimeout = id;

  frameSync = delayToNextFrame((handle) => this.animationHandle = handle);

  promiseState(newState) {
    if (this.didUnmount)
      return Promise.reject(new Error("component has dismounted during async operation"));
    return new Promise(resolve => this.setState(newState, resolve)).then(this.frameSync);
  }

  componentDidMount() {
    dew(async () => {
      // Preload the background image, but display the page anyways if it is not loaded
      // after 2 seconds lapses.
      const bgPromise = isProduction ? bgImage.preload() : bgImage.preload().catch(() => {
        console.warn(`Warning: failed to load the background image: ${bgImage.src}`);
      });

      const timerPromise = wait(2000, this.setLoadingTimeout);
      
      await Promise.race([bgPromise, timerPromise]);

      if (this.didUnmount) return;
      this.setState({ loading: false });
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.RoutePage !== prevProps.RoutePage)
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

  transitionToPage() {
    if (this.transitioning) return;

    this.transitioning = true;

    this.beginTransition().catch((error) => {
      // Do something...
    });
  }

  async beginTransition() {
    while (this.transitionState !== $$done) {
      switch (this.transitionState) {
        case $$middle: {
          // Middle transition state; nothing is currently displayed.
          const RoutePage = this.props.RoutePage;
          const isPage = RoutePage.pageData.isPage;
          // Set the active page.
          await this.promiseState({ ActivePage: RoutePage });
          // If we're transitioning into an article, it should now be displayed.
          if (isPage) await this.doNotifyPageReady();
          // Finalize transition.
          await this.promiseState({ timeout: isPage, articleTimeout: isPage });
          await wait(25, this.setTransitionTimeout);
          break;
        }
        case $$fromIndex: {
          // Start transitioning from index.
          await this.promiseState({ isArticleVisible: true });
          await wait(325, this.setTransitionTimeout);
          // Deactivate the previous page.
          await this.promiseState({ timeout: true, ActivePage: null });
          break;
        }
        case $$fromPage: {
          // Start transitioning from article.
          await this.promiseState({ articleTimeout: false });
          await wait(325, this.setTransitionTimeout);
          // Deactivate the previous page.
          await this.promiseState({ ActivePage: null });
          break;
        }
        case $$finalizeIndex: {
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

  doNotifyPageReady() {
    this.props.notifyPageReady();
    return this.frameSync();
  }

  render() {
    const { props: { elementRef, url }, state: { components, ActivePage } } = this;
    return render(elementRef, url, components, ActivePage?.pageData.name, true, this.state);
  }

}

class HardBody extends React.PureComponent {

  static propTypes = propTypes;

  render() {
    return null;
  }

}

const Body = canScrollRestore ? SoftBody : HardBody;

export default Body;