import React from "react";
import { noop } from "tools/common";

const RouterContext = React.createContext(null);

const create = (router, onRouteChangeStart = noop) => {
  const upToIndex = () => {
    if (router.route === "/") return;
    try { router.push("/", "/"); }
    catch { void 0; }
  };

  const upLevel = async () => {
    if (router.route === "/") return;
    
    const routeParts = router.route.split("/");
    routeParts.pop();

    if (routeParts.length > 1) {
      onRouteChangeStart();

      while (routeParts.length > 1) {
        const newRoute = routeParts.join("/") || "/";

        try {
          // This will throw an error if the route is invalid.
          await router.fetchComponent(newRoute, newRoute);
          // And if it was successful, this should be nearly instantaneous, since the
          // fetched page was cached.
          router.push(newRoute, newRoute);
          return;
        }
        catch (error) {
          // Another route has started to be loaded by the router.
          // This is likely caused by the user hitting the `back` button in the browser.
          if (error.cancelled) return;
        }
        routeParts.pop();
      }
    }

    upToIndex();
  };

  return { router, upToIndex, upLevel };
};

export default RouterContext;
export { create };