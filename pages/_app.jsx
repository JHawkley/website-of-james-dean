import { hashScroll } from "patch/router";

import App, { createUrl } from "next/app";
import Modal from "react-modal";

export default class PaginatedApp extends App {

  // TODO:
  // Instead of storing the `scrollPosition` on the `options`, instead store it in local storage.
  // Create a unique session ID.
  // Give each history entry this session ID as well as an entry ID to identify it uniquely.
  // If we keep track of the last entry ID encountered, we should be able to know which entry in
  // local storage we need to update the `scrollPosition` during the `beforePopState` router callback.

  state = {
    currentPage: ""
  };

  canScrollRestore = typeof window === "undefined" ? false : typeof window.history.scrollRestoration === "string";

  hashBlockID = null;

  onRouteChangeStart = () => {
    if (!this.canScrollRestore) return;

    // Save scroll position data before the route changes.
    const { url, as, options: oldOptions } = window.history.state;
    const { scrollY, scrollX } = window;
    const newOptions = Object.assign({}, oldOptions, { scrollPosition: { top: scrollY, left: scrollX } });

    window.history.replaceState({ url, as, options: newOptions }, null, as);
  }

  onRouteChangeComplete = () => {
    const { state: { currentPage }, props: { router } } = this;
    const newPage = router.query?.page ?? "";

    if (newPage === currentPage) {
      // No page change, however the hash may have changed.
      this.scrollToHash();
    }
    else {
      // Set the new current page.
      this.setState({ currentPage: newPage });
    }
  }

  restoreScrollPosition = () => {
    let scrollPosition = window.history.state?.options?.scrollPosition;
    if (!scrollPosition) {
      if (this.scrollToHash()) return;
      if (!this.canScrollRestore) return;
      scrollPosition = { left: 0, top: 0 };
    }
    
    const { left, top } = scrollPosition;
    window.scrollTo(left, top);
  }

  componentDidMount() {
    const { router } = this.props;
    if (this.canScrollRestore) window.history.scrollRestoration = "manual";
    
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