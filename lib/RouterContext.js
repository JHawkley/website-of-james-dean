import React from "react";

import $index from "pages/index?route";

const RouterContext = React.createContext(null);

const create = (router) => {

  const navigateToRoute = (route, as = route) => {
    if (router.route === route) return;
    try { router.push(route, as); }
    catch { void 0; }
  };

  const navigateToIndex = () => navigateToRoute($index);

  const back = () => process.browser && history.back();

  const reload = () => process.browser && location.reload();

  return { router, navigateToRoute, navigateToIndex, back, reload };
};

export default RouterContext;
export { create };