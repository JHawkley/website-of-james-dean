import SingletonRouter, { Router as NextRouter } from "next/router";
import { noop } from "tools/common";

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

  // Disable the `scrollToHash` method.  The application will handle this instead.
  NextRouter.prototype.scrollToHash = noop;

  SingletonRouter.ready(() => {
    // Restore the original `changeState` method after the router has initialized.
    SingletonRouter.router.changeState = oldChangeState;
  });
  
}
