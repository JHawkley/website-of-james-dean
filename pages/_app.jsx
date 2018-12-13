import { hashScroll } from "patch/router";

import App, { createUrl } from "next/app";
import { getUrl } from "next/dist/lib/utils";

import Modal from "react-modal";
import { dew } from "tools/common";
import { extensions as maybe } from "tools/maybe";

const updateHistoryState = (fn) => {
  const { url = getUrl(), as = url, options: oldOptions = {} } = window.history.state ?? {};
  const newOptions = fn(oldOptions) ?? oldOptions;
  if (newOptions === oldOptions) return;
  window.history.replaceState({ url, as, options: newOptions }, null, as);
};

const getHistoryState = (key) => window.history.state?.options?.[key];

export default class ScrollRestoringApp extends App {

  canScrollRestore = dew(() => {
    if (typeof window === "undefined") return false;
    if (typeof window.sessionStorage === "undefined") return false;
    return typeof window.history.scrollRestoration === "string";
  });

  originalScrollRestorationValue = "auto";

  scrollRestoreData = null;

  scrollRestoreEntry = 0;

  hashBlockID = null;

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
    if (this.canScrollRestore) {
      let scrollPosition = this.scrollRestoreData[this.scrollRestoreEntry];
      if (scrollPosition == null) {
        if (this.scrollToHash()) return;
        scrollPosition = [0, 0];
      }
      
      const [scorllX, scrollY] = scrollPosition;
      window.scrollTo(scorllX, scrollY);
    }
    else if (!getHistoryState("didEntryScroll")) {
      updateHistoryState(this.optionsForEntryScroll);
      if (this.scrollToHash()) return;
      window.scrollTo(0, 0);
    }
  }

  onRouteChangeStart = () => {
    if (!this.canScrollRestore) return;
    this.updateScrollPosition();
    this.persistScrollRestoreData();
  }

  onRouteChangeComplete = () => {
    if (!this.canScrollRestore) return;
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
    if (this.canScrollRestore) {
      this.originalScrollRestorationValue = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      this.recallScrollRestoreData();
    }
    
    this.hashBlockID = hashScroll.block();
    window.addEventListener("beforeunload", this.onRouteChangeStart);
    router.events.on("routeChangeStart", this.onRouteChangeStart);
    router.events.on("routeChangeComplete", this.onRouteChangeComplete);
    router.events.on("hashChangeComplete", this.scrollToHash);

    this.onRouteChangeComplete();
  }

  componentWillUnmount() {
    const { router } = this.props;
    window.removeEventListener("beforeunload", this.onRouteChangeStart);
    router.events.off("routeChangeStart", this.onRouteChangeStart);
    router.events.off("routeChangeComplete", this.onRouteChangeComplete);
    router.events.off("hashChangeComplete", this.scrollToHash);
    if (this.hashBlockID != null) hashScroll.release(this.hashBlockID);
    if (this.canScrollRestore) {
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
    const { router, Component, pageProps } = this.props;
    return (
      <Component {...pageProps}
        elementRef={Modal.setAppElement}
        url={createUrl(router)}
        notifyPageReady={this.restoreScrollPosition}
        transitionsSupported={this.canScrollRestore}
      />
    );
  }

}