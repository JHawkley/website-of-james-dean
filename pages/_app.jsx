import { hashScroll } from "patch/router";

import App, { createUrl } from "next/app";
import { getUrl } from "next/dist/lib/utils";
import Modal from "react-modal";
import { dew } from "tools/common";
import { extensions as maybe } from "tools/maybe";

const updateState = (fn) => {
  const { url = getUrl(), as = url, options: oldOptions = {} } = window.history.state ?? {};
  const newOptions = fn(oldOptions) ?? oldOptions;
  if (newOptions === oldOptions) return;
  window.history.replaceState({ url, as, options: newOptions }, null, as);
};

const getState = (key) => window.history.state?.options?.[key];

export default class PaginatedApp extends App {

  canScrollRestore = dew(() => {
    if (typeof window === "undefined") return false;
    if (typeof window.sessionStorage === "undefined") return false;
    return typeof window.history.scrollRestoration === "string";
  });

  originalScrollRestorationValue = "auto";

  scrollRestoreData = null;

  scrollRestoreEntry = 0;

  hashBlockID = null;

  constructor(props) {
    super(props);
    const initialPage = props.router.query?.page ?? "";
    this.state = { currentPage: initialPage };
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
    if (this.canScrollRestore) {
      let scrollPosition = this.scrollRestoreData[this.scrollRestoreEntry];
      if (scrollPosition == null) {
        if (this.scrollToHash()) return;
        scrollPosition = [0, 0];
      }
      
      const [scorllX, scrollY] = scrollPosition;
      window.scrollTo(scorllX, scrollY);
    }
    else if (!getState("didEntryScroll")) {
      updateState(this.optionsForEntryScroll);
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
    const { state: { currentPage }, props: { router } } = this;
    const newPage = router.query?.page ?? "";

    if (this.canScrollRestore) {
      updateState(this.optionsForEntryId);
      this.persistScrollRestoreData();
    }

    if (newPage === currentPage) {
      // No page change, however the hash may have changed.
      this.scrollToHash();
    }
    else {
      // Set the new current page.
      this.setState({ currentPage: newPage });
    }
  }

  componentDidMount() {
    const { router } = this.props;
    if (this.canScrollRestore) {
      this.originalScrollRestorationValue = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      this.recallScrollRestoreData();
    }
    
    Modal.setAppElement('#__next');
    this.hashBlockID = hashScroll.block();
    window.addEventListener("beforeunload", this.onRouteChangeStart);
    router.events.on("routeChangeStart", this.onRouteChangeStart);
    router.events.on("routeChangeComplete", this.onRouteChangeComplete);
    router.events.on("hashChangeComplete", this.restoreScrollPosition);

    // Set the correct page.
    this.onRouteChangeComplete();
  }

  componentWillUnmount() {
    const { router } = this.props;
    window.removeEventListener("beforeunload", this.onRouteChangeStart);
    router.events.off("routeChangeStart", this.onRouteChangeStart);
    router.events.off("routeChangeComplete", this.onRouteChangeComplete);
    router.events.off("hashChangeComplete", this.restoreScrollPosition);
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

  scrollToHash() {
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

  render() {
    const { router, Component, pageProps } = this.props;
    const { currentPage } = this.state;
    return (
      <Component {...pageProps}
        url={createUrl(router)}
        page={currentPage}
        notifyPageReady={this.restoreScrollPosition}
        transitionsSupported={this.canScrollRestore}
      />
    );
  }

}