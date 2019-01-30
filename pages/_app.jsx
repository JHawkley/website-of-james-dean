// Polyfills.
import 'core-js/es6/symbol';
import 'core-js/es7/symbol';
import 'core-js/es6/array';
import 'core-js/es7/array';
import 'core-js/web/immediate';

import React, { Fragment } from "react";
import { hashScroll } from "patch/client-router";

import App, { createUrl } from "next/app";
import Head from "next/head";
import { getUrl, loadGetInitialProps, loadGetRenderProps } from "next/dist/lib/utils";

import Modal from "react-modal";
import { config as faConfig, dom as faDom } from "@fortawesome/fontawesome-svg-core";
import { dew, is } from "tools/common";
import { extensions as maybe } from "tools/maybe";

faConfig.autoAddCss = false;

const updateHistoryState = (fn) => {
  const { url = getUrl(), as = url, options: oldOptions = {} } = window.history.state ?? {};
  const newOptions = fn(oldOptions) ?? oldOptions;
  if (newOptions === oldOptions) return;
  window.history.replaceState({ url, as, options: newOptions }, null, as);
};

const getHistoryState = (key) => window.history.state?.options?.[key];

export const canScrollRestore = dew(() => {
  if (typeof window === "undefined") return false;
  if (typeof window.sessionStorage === "undefined") return false;
  return window.history.scrollRestoration::is.string();
});

export default class ScrollRestoringApp extends App {

  static async getInitialProps({ Component, ctx }) {
    const initialPageProps = await loadGetInitialProps(Component, ctx);
    return { initialPageProps };
  }

  static async getRenderProps(props, { Component, ctx }, ssr) {
    const { initialPageProps: oldProps } = props;
    const newProps = await loadGetRenderProps(Component, oldProps, ctx, ssr);
    if (oldProps === newProps) return props;
    return { ...props, initialPageProps: newProps };
  }

  originalScrollRestorationValue = "auto";

  scrollRestoreData = null;

  scrollRestoreEntry = 0;

  hashBlockID = null;

  constructor(props) {
    super(props);
    this.state = { pageProps: props.initialPageProps ?? {} };
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

  restoreScrollPosition = () => {
    if (canScrollRestore) {
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

  onBeforeMajorChange = () => {
    if (!canScrollRestore) return;
    this.updateScrollPosition();
    this.persistScrollRestoreData();
  }

  onRouteChangeStart = () => {
    this.onBeforeMajorChange();
    const { props: { Component }, state: { pageProps: oldProps } } = this;
    const newProps = Component.getRouteChangeProps?.(oldProps) ?? oldProps;
    if (newProps !== oldProps)
      this.setState({ pageProps: newProps });
  }

  onRouteChangeComplete = () => {
    if (!canScrollRestore) return;
    updateHistoryState(this.optionsForEntryId);
    this.persistScrollRestoreData();
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

  componentDidMount() {
    const { router } = this.props;
    if (canScrollRestore) {
      this.originalScrollRestorationValue = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      this.recallScrollRestoreData();
    }
    
    this.hashBlockID = hashScroll.block();
    window.addEventListener("beforeunload", this.onBeforeMajorChange);
    router.events.on("routeChangeStart", this.onRouteChangeStart);
    router.events.on("routeChangeComplete", this.onRouteChangeComplete);
    router.events.on("hashChangeComplete", this.scrollToHash);

    this.onRouteChangeComplete();
  }

  componentDidUpdate(prevProps) {
    if (this.props.initialPageProps !== prevProps.initialPageProps)
      this.setState({ pageProps: this.props.initialPageProps });
  }

  componentWillUnmount() {
    const { router } = this.props;
    window.removeEventListener("beforeunload", this.onBeforeMajorChange);
    router.events.off("routeChangeStart", this.onRouteChangeStart);
    router.events.off("routeChangeComplete", this.onRouteChangeComplete);
    router.events.off("hashChangeComplete", this.scrollToHash);
    if (this.hashBlockID != null) hashScroll.release(this.hashBlockID);
    if (canScrollRestore) {
      this.persistScrollRestoreData();
      window.history.scrollRestoration = this.originalScrollRestorationValue;
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

  render() {
    const { props: { router, Component }, state: { pageProps } } = this;
    return (
      <Fragment>
        <Head><style dangerouslySetInnerHTML={{ __html: faDom.css() }} /></Head>
        <Component {...pageProps}
          elementRef={Modal.setAppElement}
          url={createUrl(router)}
          notifyPageReady={this.restoreScrollPosition}
        />
      </Fragment>
    );
  }

}