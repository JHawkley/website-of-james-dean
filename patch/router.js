import SingletonRouter, { Router as NextRouter } from "next/router";

const scrollBlockRegistrar = new Set();
let nextRegistrationID = 0;
let doneOnce = false;

if (!doneOnce) {
  doneOnce = true;

  // Patch the `changeState` method so it does not destroy history state information.  In particular,
  // the `options` object is used to store scroll restoration parameters.  The Router's constructor
  // haphazardly destroys this information while it initializes.
  const oldChangeState = NextRouter.prototype.changeState;

  const patch_changeState = function(method, url, as, options) {
    const initialOptions = options ?? window?.history?.state?.options;
    return this::oldChangeState(method, url, as, initialOptions);
  }

  NextRouter.prototype.changeState = patch_changeState;

  // Patch the `scrollToHash` method so that it can be disabled.  Use `hashScroll.block` to begin
  // blocking.  Use `hashScroll.release` to restore normal functionality.  These should be called
  // in your component's `componentDidMount` and `componentWillUnmount` methods, respectively.
  const oldScrollToHash = NextRouter.prototype.scrollToHash;

  const patch_scrollToHash = function(as) {
    if (scrollBlockRegistrar.size > 0) return;
    return this::oldScrollToHash(as);
  }

  NextRouter.prototype.scrollToHash = patch_scrollToHash;

  SingletonRouter.ready(() => {
    // Restore the original `changeState` method after the router has initialized.
    SingletonRouter.router.changeState = oldChangeState;
  });
  
}

export const hashScroll = {
  block() {
    const id = nextRegistrationID;
    scrollBlockRegistrar.add(id);
    nextRegistrationID += 1;
    return id;
  },
  release(id) {
    if (!scrollBlockRegistrar.has(id))
      throw new Error(`the ID \`${id}\` was not found in the scroll-block registrar`);
    scrollBlockRegistrar.delete(id);
  }
};