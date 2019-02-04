import React from "react";
import PropTypes from "prop-types";
import { extensions as objEx, is, dew, compareOwnProps } from "tools/common";
import { CallSync, AbortedError, Task } from "tools/async";
import { abortable, wait, frameSync } from "tools/async";
import { extensions as propTypesEx } from "tools/propTypes";

const isDev = process.env.NODE_ENV !== 'production';

const mustBePositive = (v) => v >= 0 ? true : "must be a positive number";

const $exiting = "exiting";
const $exited = "exited";
const $entered = "entered";

const $componentUnmounted = "component unmounted";

class Transition extends React.Component {

  static propTypes = {
    page: PropTypes.shape({
      Component: PropTypes.func.isRequired,
      props: PropTypes.object,
      render: PropTypes.func,
      exitDelay: PropTypes.number::propTypesEx.predicate(mustBePositive)
    }),
    onBegin: PropTypes.func,
    onEnd: PropTypes.func,
    wait: PropTypes.bool,
    asap: PropTypes.bool
  };

  static defaultProps = {
    wait: false,
    asap: false
  };

  static getDerivedStateFromProps({page}, {exiting, entering}) {
    if (!page)
      return transitionToUnresolved(exiting, entering);
    if (entering && entering.Component === page.Component)
      return updateEntering(entering, page);
    if (exiting && exiting.Component === page.Component)
      return cancelExiting(exiting, page);
    return transitionToResolved(exiting, entering, page);
  }

  state = this.props::objEx.map(({page, asap}) => {
    const entering = page ? createTransition(page) : null;
    const stage = asap || !page ? $exited : $entered;

    return { exiting: null, error: null, entering, stage };
  });

  transitioning = false;
  
  didUnmount = false;

  updatedSync = new CallSync();

  transitionTask = dew(() => {
    const transition = async (stopSignal) => {
      // No transition if we're unmounted.
      if (this.didUnmount) return;
      // Do not proceed if another transition is already happening.
      if (this.transitioning) return;

      try {
        // If we're already exited, just announce the beginning of a transition.
        // This state is common after the component first mounts.
        if (this.state.stage === $exited) {
          this.props.onBegin?.();
        }
        // If we're in the `$entered` state, but there is nothing exiting, then
        // this transition was probably triggered inappropriately.
        else if (this.state.stage === $entered && !this.state.exiting) {
          if (isDev) console.warn("a transition was started with no exiting page");
          return;
        }
        // Otherwise, we have a outro to perform.
        else {
          this.props.onBegin?.();

          // If there is an `exitDelay` on the exiting page, carry it out.
          if (this.state.exiting) {
            const { exitDelay } = this.state.exiting;
            if (exitDelay > 0) {
              await this.promiseState({ stage: $exiting });
              await wait(exitDelay, stopSignal);
            }
          }

          await this.promiseState({ stage: $exited });
        }
      
        while (this.mustHold || this.state.exiting) {
          // Hold up until we're no longer told to `wait` and we have an `entering` page.
          while (this.mustHold) await this.nextUpdate(stopSignal);
          
          if (this.state.exiting) {
            // Show the entering page by dismissing the exiting page.
            await this.promiseState({ exiting: null });
            // Allow the entering page to render in the `$exited` state for a frame
            // to give it time to setup for its intro animation.
            await frameSync(stopSignal);
          }
        }
      
        // Finish the transition.
        await this.promiseState({ stage: $entered });
        this.props.onEnd?.();
      }
      catch (error) {
        if (this.didUnmount) return;
        if (error instanceof AbortedError) return;
        this.setState({ error });
      }
    };

    return new Task(transition);
  });

  get mustHold() {
    return this.props.wait || !this.state.entering;
  }

  nextUpdate(abortSignal) {
    return abortable(this.updatedSync.sync, abortSignal);
  }

  promiseState(newState) {
    return new Promise((resolve, reject) => {
      if (this.didUnmount) return reject(new AbortedError($componentUnmounted));
      this.setState(newState, resolve);
    });
  }

  componentDidMount() {
    if (this.state.stage !== $entered)
      this.transitionTask.start();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { props, state } = this;

    // We don't care about the callback props `onBegin` and `onEnd`; they're not related to
    // rendering or state-keeping.  Also `asap` is only relevant during initialization.

    switch (true) {
      case props === nextProps: break;
      case props.wait !== nextProps.wait: return true;
      case !props.page::is.defined() && !nextProps.page::is.defined(): break;
      case props.page::is.object() !== nextProps.page::is.object(): return true;
      case !compareOwnProps(props.page, nextProps.page): return true;
    }
    
    if (!compareOwnProps(state, nextState)) return true;

    return false;
  }

  componentDidUpdate(prevProps, prevState) {
    const { exiting, error } = this.state;

    if (error !== prevState.error && error)
      throw error;
    
    if (exiting && !prevState.exiting)
      this.transitionTask.start();

    this.updatedSync.resolve();
  }

  componentWillUnmount() {
    // Cancel async operations.
    this.transitionTask.stop($componentUnmounted);
  }

  render() {
    const { exiting, entering, stage, error } = this.state;
    const page = exiting || entering;

    if (!page) return null;
    if (error) return null;

    return page.render(page.Component, page.props, page.exitDelay, stage);
  }

}

const defaultRender = (Component, props, exitDelay, stage) => {
  return (
    <div className={`transition ${stage}`}>
      <Component {...props} />
      <style jsx>
        {`
          .transition { transform: opacity ${exitDelay} ease-in-out; }
          .transition.exiting, .transition.exited { opacity: 0; }
          .transition.exited { visibility: hidden; }
          .transition.entered { opacity: 1; }
        `}
      </style>
    </div>
  );
};

const transitionToUnresolved = (exiting, entering) => {
  if (!entering) return null;
  if (exiting) return { entering: null };
  return { exiting: entering, entering: null };
};

const updateEntering = (entering, page) => {
  const updated = assignProps(entering, page);
  if (updated === entering) return null;
  return { entering: updated };
};

const cancelExiting = (exiting, page) => {
  return { exiting: null, entering: assignProps(exiting, page) };
};

const transitionToResolved = (exiting, entering, page) => {
  if (exiting) return { entering: createTransition(page) };
  return { exiting: entering, entering: createTransition(page) };
};

const fixRender = (render) => render::is.func() ? render : defaultRender;
const fixExitDelay = (exitDelay) => exitDelay::is.NaN() ? 0 : Math.max(exitDelay, 0);

const createTransition = ({Component, props, render, exitDelay}) => {
  return {
    Component, props,
    render: fixRender(render),
    exitDelay: fixExitDelay(exitDelay)
  };
};

const assignProps = (transition, page) => {
  const props = page.props;
  const render = fixRender(page.render);
  const exitDelay = fixExitDelay(page.exitDelay);

  switch (true) {
    case transition.props !== props:
    case transition.render !== render:
    case transition.exitDelay !== exitDelay:
      return { Component: transition.Component, props, render, exitDelay };
    default:
      return transition;
  }
};

export default Transition;