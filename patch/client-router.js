import { Router as NextRouter } from "next/router";

const scrollBlockRegistrar = new Set();
let nextRegistrationID = 0;

// Patch the `scrollToHash` method so that it can be disabled.  Use `hashScroll.block` to begin
// blocking.  Use `hashScroll.release` to restore normal functionality.  These should be called
// in your component's `componentDidMount` and `componentWillUnmount` methods, respectively.
const oldScrollToHash = NextRouter.prototype.scrollToHash;

const patch_scrollToHash = function(as) {
  if (scrollBlockRegistrar.size > 0) return;
  return this::oldScrollToHash(as);
}

NextRouter.prototype.scrollToHash = patch_scrollToHash;

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