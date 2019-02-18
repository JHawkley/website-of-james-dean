import { hashScroll } from "patch/client-router";

import { Fragment } from "react";
import App, { createUrl } from "next/app";
import Head from "next/head";
import { getUrl } from "next-server/dist/lib/utils";
import { css } from "styled-jsx/css";
import { config as faConfig } from "@fortawesome/fontawesome-svg-core";

import BadArgumentError from "lib/BadArgumentError";
import RouterContext, { create as createRouterContext } from "lib/RouterContext";
import PreloadContext from "lib/PreloadContext";

import { dew } from "tools/common";
import { timespan } from "tools/css";
import { iterExtensions as asyncIterEx } from "tools/async";
import { Task, wait } from "tools/async";
import { extensions as maybe } from "tools/maybe";
import { memoize } from "tools/functions";
import { canScrollRestore as transitionsSupported } from "tools/scrollRestoration";
import styleVars from "styles/vars.json";

import PreloadSync from "components/Preloader/PreloadSync";
import Transition from "components/Transition";
import AppRoot from "components/AppRoot";
import Wrapper from "components/Wrapper";
import LoadingSpinner from "components/LoadingSpinner";
import Page from "components/Page";

faConfig.autoAddCss = false;

const scrollRestoreSupported = process.browser && transitionsSupported;

class ScrollRestoringApp extends App {

  // Properties.

  state = {
    loading: true,
    routeChanging: false,
    pageHidden: transitionsSupported
  };

  originalScrollRestorationValue = "auto";

  scrollRestoreData = null;

  scrollRestoreEntry = 0;

  hashBlockID = null;

  routerContext = createRouterContext(this.props.router, () => this.onRouteChangeStart());

  preloadContext = new PreloadSync();

  doLoadingTask = dew(() => {
    const doLoading = async (stopSignal) => {
      try {
        const { preloadContext: preloadSync } = this;
        const $$preloaded = PreloadSync.states.preloaded;

        // Tell the preloadSync we've rendered the page.  If nothing registered for preloading,
        // this will tell it to advance to the `$$preloaded` state.
        preloadSync.rendered();

        // Wait for preloading to finish...
        const preloadPromise = preloadSync.updates::asyncIterEx.first($$preloaded, stopSignal);
        // ...or at least wait some amount of time before we load anyways.
        // Things registered with the app's preloadSync are considered low-priority.
        const timerPromise = wait(Page.transition.exitDelay * 5, stopSignal);

        await Promise.race([preloadPromise, timerPromise]);
      }
      finally {
        this.setState({ loading: false });
      }
    };

    return new Task(doLoading);
  });

  buildPage = memoize((Component, pageProps, router, routeChanging) => {
    if (!Component)
      throw new BadArgumentError("a page-component was not provided to the app", "Component", Component);

    if (transitionsSupported && routeChanging)
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

  onPageHidden = () => {
    this.setState({ pageHidden: true });
  }

  onPageShown = () => {
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
    if (!scrollRestoreSupported) return;
    updateHistoryState(this.optionsForEntryId);
    this.persistScrollRestoreData();
  }

  onRouteChangeStart = () => {
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
    const scrollX = window.scrollX | 0;
    const scrollY = window.scrollY | 0;
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
    // Do not run this method on the server.
    if (!process.browser) return;

    const { router } = this.props;

    this.doLoadingTask.stop();

    window.removeEventListener("beforeunload", this.onBeforeMajorChange);
    router.events.off("routeChangeStart", this.onRouteChangeStart);
    router.events.off("hashChangeComplete", this.scrollToHash);
    if (this.hashBlockID != null) hashScroll.release(this.hashBlockID);

    if (scrollRestoreSupported) {
      this.persistScrollRestoreData();
      window.history.scrollRestoration = this.originalScrollRestorationValue;
    }
  }

  renderAppLoader() {
    const { loading } = this.state;

    return (
      <LoadingSpinner
        fadeTime={throbberCss.fadeTime}
        size="3x"
        show={loading}
        className={throbberCss.className}
        fixed
      />
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
      <AppRoot loading={loading} routeChanging={routeChanging}>
        <Wrapper>
          {render(Component, props, exitDelay, "entered")}
        </Wrapper>
        {this.renderAppLoader()}
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
      <AppRoot loading={loading} routeChanging={routeChanging}>
        <Wrapper>
          <Transition
            content={page}
            onExited={this.onPageHidden}
            onEntering={this.onPageShown}
            wait={loading}
          />
        </Wrapper>
        {this.renderAppLoader()}
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
    return (
      <Fragment>
        <Head><title>A Programmer's Place</title></Head>
        <RouterContext.Provider value={this.routerContext}>
          <PreloadContext.Provider value={this.preloadContext}>
            {transitionsSupported ? this.renderWithTransitions() : this.renderNoTransitions()}
            {throbberCss.styles}
          </PreloadContext.Provider>
        </RouterContext.Provider>
      </Fragment>
    );
  }

}

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