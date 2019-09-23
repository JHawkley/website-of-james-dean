import { hashScroll } from "patch/client-router";

import { Fragment } from "react";
import App, { createUrl } from "next/app";
import Head from "next/head";
import { getUrl } from "next-server/dist/lib/utils";
import { css } from "styled-jsx/css";

import ImagePreloadError from "components/ImageMedia/ImagePreloadError";
import BadArgumentError from "lib/BadArgumentError";
import RouterContext, { create as createRouter } from "lib/RouterContext";
import BackgroundContext, { create as createBackground } from "lib/BackgroundContext";

import { is, dew } from "tools/common";
import { timespan } from "tools/css";
import { Task, wait } from "tools/async";
import { extensions as maybe } from "tools/maybe";
import { memoize } from "tools/functions";
import { canScrollRestore as hostCanScrollRestore } from "tools/scrollRestoration";
import styleVars from "styles/vars.json";

import Preloader from "components/Preloader";
import Transition from "components/Transition";
import AppRoot from "components/AppRoot";
import Wrapper from "components/Wrapper";
import LoadingSpinner from "components/LoadingSpinner";
import Page from "components/Page";
import Background from "components/Background";

// Only controls the behavior of the component; not used for rendering.
const scrollRestoreSupported = process.browser && hostCanScrollRestore;

class ScrollRestoringApp extends App {

  // Properties.

  state = {
    loading: true,
    routeChanging: false,
    transitionsSupported: true,
    pageHidden: true,
    bgClassName: null
  };

  didUnmount = false;

  originalScrollRestorationValue = "auto";

  scrollRestoreData = null;

  scrollRestoreEntry = 0;

  hashBlockID = null;

  routerContext = createRouter(this.props.router);

  backgroundContext = createBackground({
    onUpdated: ({ className: bgClassName }) => {
      if (this.didUnmount) return;
      this.setState({ bgClassName });
    }
  });

  doLoadingTask = dew(() => {
    const doLoading = async (stopSignal, preloadPromise) => {
      try {
        // Wait for preloading to finish...
        // ...or at least wait some amount of time before we load anyways.
        // Things registered with the app's preloadSync are considered low-priority.
        const timerPromise = wait(Page.transition.exitDelay * 5, stopSignal);

        await Promise.race([preloadPromise, timerPromise]);
      }
      // TODO: Add error-handling.
      finally {
        if (!this.didUnmount)
          this.setState({ loading: false });
      }
    };

    return new Task(doLoading);
  });

  buildPage = memoize((Component, pageProps, router, routeChanging) => {
    if (!Component)
      throw new BadArgumentError("a page-component was not provided to the app", "Component", Component);

    if (hostCanScrollRestore && routeChanging)
      return null;
  
    return {
      ...Page.transition, ...Component.transition, Component,
      props: { url: createUrl(router), ...pageProps }
    };
  });

  // Constructor.

  constructor(props) {
    super(props);

    if (scrollRestoreSupported) {
      this.originalScrollRestorationValue = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      this.recallScrollRestoreData();
    }
  }

  // Callbacks.

  onPreloadPromise = (preloadPromise) => {
    this.doLoadingTask.stop();
    if (preloadPromise == null || !this.state.loading) return;
    this.doLoadingTask.start(preloadPromise);
  }

  onPreloadError = (preloadError) => {
    // Ignore image preload errors.
    return preloadError::is.instanceOf(ImagePreloadError);
  }

  onPageHidden = () => {
    if (this.didUnmount) return;
    this.setState({ pageHidden: true });
  }

  onPageShown = () => {
    if (this.didUnmount) return;
    this.setState({ pageHidden: false });
    this.restoreScrollPosition();
  }

  optionsForEntryId = (oldOptions) => {
    let newOptions = oldOptions;
    let entryId = oldOptions?.entryId;
    if (entryId == null) {
      // We need to truncate the scroll-restore data.
      this.scrollRestoreData = this.scrollRestoreData.slice(0, this.scrollRestoreEntry + 1);
      entryId = this.scrollRestoreData.length;
      newOptions = Object.assign({}, oldOptions, { entryId });
    }
    this.scrollRestoreEntry = entryId;
    return newOptions;
  }

  optionsForEntryScroll = (oldOptions) => {
    return Object.assign({}, oldOptions, { didEntryScroll: true });
  }

  onBeforeMajorChange = () => {
    if (!scrollRestoreSupported) return;
    this.updateScrollPosition();
    this.persistScrollRestoreData();
  }

  onAfterMajorChange = () => {
    if (!scrollRestoreSupported) {
      this.restoreScrollPosition();
      return;
    }

    updateHistoryState(this.optionsForEntryId);
    this.persistScrollRestoreData();
  }

  onRouteChangeStart = () => {
    if (this.didUnmount) return;
    if (this.state.routeChanging) return;
    this.onBeforeMajorChange();
    this.setState({ routeChanging: true });
  }

  scrollToHash = () => {
    let { hash } = window.location;
    hash = hash ? hash.substring(1) : false;
    if (!hash) return false;

    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView();
      return true;
    }

    const nameEl = document.getElementsByName(hash)[0];
    if (nameEl) {
      nameEl.scrollIntoView();
      return true;
    }

    return false;
  }

  // Methods.

  restoreScrollPosition() {
    if (scrollRestoreSupported) {
      let scrollPosition = this.scrollRestoreData[this.scrollRestoreEntry];
      if (scrollPosition == null) {
        if (this.scrollToHash()) return;
        scrollPosition = [0, 0];
      }
      
      const [scrollX, scrollY] = scrollPosition;
      window.scrollTo(scrollX, scrollY);
    }
    else if (!getHistoryState("didEntryScroll")) {
      updateHistoryState(this.optionsForEntryScroll);
      if (this.scrollToHash()) return;
      window.scrollTo(0, 0);
    }
  }

  updateScrollPosition() {
    const scrollX = window.pageXOffset | 0;
    const scrollY = window.pageYOffset | 0;
    this.scrollRestoreData[this.scrollRestoreEntry] = [scrollX, scrollY];
  }

  persistScrollRestoreData() {
    window.sessionStorage.setItem("scrollRestoreData", JSON.stringify(this.scrollRestoreData));
  }

  recallScrollRestoreData() {
    const json = window.sessionStorage?.getItem("scrollRestoreData");
    this.scrollRestoreData = json::maybe.tryMap(JSON.parse) ?? [];
    const options = window.history.state?.options;
    this.scrollRestoreEntry = options?.entryId ?? this.scrollRestoreData.length;
  }

  // React life-cycle methods.

  componentDidMount() {
    // Do not run this method on the server.
    if (!process.browser) return;

    // If the host does not support scroll-restore, this will force a re-render
    // to swap-in the transition-less version of the site after rehydration.
    // Related: https://github.com/facebook/react/issues/13260
    if (!hostCanScrollRestore) this.setState({
      transitionsSupported: false,
      pageHidden: false
    });

    const { router } = this.props;
    
    this.hashBlockID = hashScroll.block();
    window.addEventListener("beforeunload", this.onBeforeMajorChange);
    router.events.on("routeChangeStart", this.onRouteChangeStart);
    router.events.on("hashChangeComplete", this.scrollToHash);

    this.onAfterMajorChange();
    this.doLoadingTask.start();
  }

  componentDidUpdate(prevProps) {
    const { Component } = this.props;
    if (Component !== prevProps.Component)
      this.setState({ routeChanging: false }, this.onAfterMajorChange);
  }

  componentWillUnmount() {
    this.didUnmount = true;

    // Do not run this method on the server.
    if (!process.browser) return;

    const { router } = this.props;

    window.removeEventListener("beforeunload", this.onBeforeMajorChange);
    router.events.off("routeChangeStart", this.onRouteChangeStart);
    router.events.off("hashChangeComplete", this.scrollToHash);
    if (this.hashBlockID != null) hashScroll.release(this.hashBlockID);

    if (scrollRestoreSupported) {
      this.persistScrollRestoreData();
      window.history.scrollRestoration = this.originalScrollRestorationValue;
    }
  }

  renderAppComponents() {
    const { loading, bgClassName } = this.state;

    return (
      <Fragment>
        <Background className={bgClassName} />
        <LoadingSpinner
          fadeTime={throbberCss.fadeTime}
          size="3x"
          show={loading}
          className={throbberCss.className}
          fixed
        />
      </Fragment>
    );
  }

  renderNoTransitions() {
    const {
      props: { Component, pageProps, router },
      state: { loading, routeChanging }
    } = this;

    const { render, props, exitDelay } =
      this.buildPage(Component, pageProps, router, routeChanging);

    return (
      <AppRoot className={globalCss.className} loading={loading} routeChanging={routeChanging}>
        <Wrapper>
          {render(Component, props, exitDelay, "entered")}
        </Wrapper>
        {this.renderAppComponents()}
        <LoadingSpinner
          delay={exitDelay}
          fadeTime={throbberCss.fadeTime}
          hPos="right" vPos="bottom" size="2x"
          show={loading ? false : routeChanging}
          className={throbberCss.className}
          fixed
        />
      </AppRoot>
    );
  }

  renderWithTransitions() {
    const {
      props: { Component, pageProps, router },
      state: { loading, routeChanging, pageHidden }
    } = this;

    const page = this.buildPage(Component, pageProps, router, routeChanging);

    return (
      <AppRoot className={globalCss.className} loading={loading} routeChanging={routeChanging}>
        <Wrapper>
          <Transition
            content={page}
            onExited={this.onPageHidden}
            onEntering={this.onPageShown}
            wait={loading}
          />
        </Wrapper>
        {this.renderAppComponents()}
        <LoadingSpinner
          delay={100}
          fadeTime={throbberCss.fadeTime}
          size="3x"
          show={!loading && pageHidden}
          className={throbberCss.className}
          background
          fixed
        />
      </AppRoot>
    );
  }

  render() {
    const { transitionsSupported } = this.state;

    return (
      <Fragment>
        <Head><title>A Programmer's Place</title></Head>
        <RouterContext.Provider value={this.routerContext}>
          <BackgroundContext.Provider value={this.backgroundContext}>
            <Preloader promise={this.onPreloadPromise} onError={this.onPreloadError} display="naked" once>
              {transitionsSupported ? this.renderWithTransitions() : this.renderNoTransitions()}
              {globalCss.styles}
              {throbberCss.styles}
            </Preloader>
          </BackgroundContext.Provider>
        </RouterContext.Provider>
      </Fragment>
    );
  }

}

const globalCss = css.resolve`
  * :global(.span-across) {
    display: inline-block;
    width: 100%;
    max-width: 100%;
    margin: 0 0 ${styleVars["size"]["element-margin"]} 0;
  }
`;

const throbberCss = dew(() => {
  const fadeTime = timespan(styleVars["duration"]["modal"]);
  const { className, styles } = css.resolve`* { z-index: 3; }`;

  return { fadeTime, className, styles };
});

const updateHistoryState = (fn) => {
  const { url = getUrl(), as = url, options: oldOptions = {} } = window.history.state ?? {};
  const newOptions = fn(oldOptions) ?? oldOptions;
  if (newOptions === oldOptions) return;
  window.history.replaceState({ url, as, options: newOptions }, null, as);
};

const getHistoryState = (key) => window.history.state?.options?.[key];

export default ScrollRestoringApp;