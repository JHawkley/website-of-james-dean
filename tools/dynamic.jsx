import nextDynamic from "next/dynamic";
import { Loader } from "components/Dynamic";
import { noop } from "tools/common";
import { extensions as fnEx } from "tools/functions";

const defaultRender = (props, ImportedComponent) => {
  return <ImportedComponent {...props} />;
}

export function dynamic(importTarget, loaderOptions) {
  const { onError, onPastDelay, onLoad, render = defaultRender, ...restOptions } = loaderOptions;

  const onLoadOnce = onLoad ? onLoad::fnEx.callableOnce() : noop;

  // I don't know why I can't use `{ ...restOptions, loading: **, render: ** }` here instead, but
  // using the spread operator causes `react-loadable-plugin` to have a fit.  So, we're just gonna
  // use `Object.assign` instead.
  const options = Object.assign({}, restOptions, {
    modules: [importTarget],
    webpack: () => [require.resolveWeak(importTarget)],
    loading: Loader.bindCallbacks(onError, onPastDelay),
    render: (props, { ImportedComponent }) => {
      onLoadOnce();
      return render(props, ImportedComponent);
    }
  });
  
  return nextDynamic(() => import(importTarget), options);
}