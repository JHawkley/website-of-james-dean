import React from "react";

import { route as $indexRoute, asPath as $indexAs } from "pages/index?jump";

const RouterContext = React.createContext(null);

const create = (router) => {

  const navigateTo = (route, asPath = route) => {
    if (router.route === route) return;
    try { router.push(route, asPath); }
    catch { void 0; }
  };

  const navigateToIndex = () => navigateTo($indexRoute, $indexAs);

  const back = () => process.browser && history.back();

  const reload = () => process.browser && location.reload();

  return { router, navigateTo, navigateToIndex, back, reload };
};

export default RouterContext;
export { create };