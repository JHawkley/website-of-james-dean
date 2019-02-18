import React from "react";
import { frameSync } from "tools/async";
import { join } from "tools/extensions/iterables";

const BackgroundContext = React.createContext(null);

const create = ({onUpdated}) => {
  const componentsToClassName = new Map();
  let queuedUpdate = null;

  const queueUpdate = () => {
    if (queuedUpdate) return;
    queuedUpdate = frameSync().then(() => {
      queuedUpdate = null;

      const classNames = new Set();
      for (const className of componentsToClassName.values())
        for (const splitClass of className.split(" "))
          if (splitClass) classNames.add(splitClass);

      onUpdated({ className: classNames::join(" ") || null });
    });
  };

  const updateClassName = (component, className) => {
    if (className) componentsToClassName.set(component, className);
    else componentsToClassName.delete(component);
    queueUpdate();
  };

  const reset = () => {
    componentsToClassName.clear();
    queueUpdate();
  };

  return { updateClassName, reset };
};

export default BackgroundContext;
export { create };