import React from "react";
import PropTypes from "prop-types";
import { extensions as objEx, is, dew } from "tools/common";
import { CallSync, AbortedError, Task } from "tools/async";
import { abortable, wait as asyncWaitFn, frameSync } from "tools/async";
import { extensions as propTypesEx } from "tools/propTypes";

const mustBePositive = (v) => v >= 0 ? true : "must be a positive number";
const mustBeFinite = (v) => v::is.finite() ? true : "must be a finite number";

const $exiting = "exiting";
const $exited = "exited";
const $entering = "entering";
const $entered = "entered";

const $componentUnmounted = "component unmounted";

class Transition extends React.PureComponent {

  static propTypes = {
    content: PropTypes.shape({
      Component: PropTypes.func.isRequired,
      props: PropTypes.object,
      render: PropTypes.func,
      exitDelay: PropTypes.number
        ::propTypesEx.predicate(mustBePositive)
        ::propTypesEx.predicate(mustBeFinite)
    }),
    onExiting: PropTypes.func,
    onCanceled: PropTypes.func,
    onExited: PropTypes.func,
    onEntering: PropTypes.func,
    onEntered: PropTypes.func,
    wait: PropTypes.bool,
    asap: PropTypes.bool
  };

  static defaultProps = {
    wait: false,
    asap: false
  };

  static getDerivedStateFromProps(props, state) {
    const { exiting, entering, contentShown, stage } = state;
    const newStage = updateStage(exiting, entering, contentShown);
    if (newStage === stage) return null;
    return { stage: newStage };
  }

  state = this.props::objEx.map(({content, asap}) => {
    const entering = content ? createTransition(content) : null;
    const contentShown = asap && entering != null;
    const stage = updateStage(null, entering, contentShown);

    return { exiting: null, entering, contentShown, stage, error: null };
  });
  
  didUnmount = false;

  whenCanceled = new CallSync();

  whenUpdated = new CallSync();

  transitionTask = dew(() => {
    const transition = async (stopSignal) => {
      // No transition if we're unmounted.
      if (this.didUnmount) return;
      // Or if we're already in the `$entered` stage.
      if (this.state.stage === $entered) return;

      // Track whether the outro has already been performed.  During the loop, certain steps
      // will be skipped to prevent callback spam and waiting when it is unnecessary.
      // Immediately after initialization, it is possible for the transition to not be in the
      // `$exiting` stage, which means there is no outro to perform.
      let outroPerformed = this.state.stage !== $exiting;

      try {
        while (this.state.stage !== $entered) {
          const { props: { wait }, state: { exiting, entering, stage } } = this;

          switch (true) {
            case stage === $exiting && outroPerformed:
              await this.promiseState({ contentShown: false }, stopSignal);
              break;
            case stage === $exiting:
              outroPerformed = true;
              await asyncWaitFn(exiting.exitDelay, stopSignal);
              await this.promiseState({ contentShown: false }, stopSignal);
              break;
            case Boolean(wait || !entering):
              // Hold up until we're no longer told to `wait` and we have some `entering` content.
              await this.nextUpdate(stopSignal);
              break;
            case Boolean(exiting):
              // Render the entering content by dismissing the exiting content.
              await this.promiseState({ exiting: null }, stopSignal);
              // Allow the entering content to render in the `$entering` state for a frame
              // to give it time to setup for its intro animation.
              await frameSync(stopSignal);
              break;
            default:
              await this.promiseState({ contentShown: true }, stopSignal);
              break;
          }
        }
      }
      catch (error) {
        if (this.didUnmount) return;
        if (error instanceof AbortedError) return;
        this.setState({ error });
      }
    };

    return new Task(transition);
  });

  nextUpdate(abortSignal) {
    return abortable(this.whenUpdated.sync, abortSignal);
  }

  promiseState(newState, abortSignal) {
    const promise = new Promise((resolve) => {
      if (this.didUnmount) return;
      this.setState(newState, resolve);
    });
    return abortable(promise, abortSignal);
  }

  onStageChanged(stage, canceled) {
    switch(true) {
      case stage === $exiting:
        this.props.onExiting?.();
        this.transitionTask.start(this.whenCanceled.sync);
        return;
      case stage === $exited:
        this.props.onExited?.();
        return;
      case stage === $entering:
        this.props.onEntering?.();
        return;
      case canceled:
        this.whenCanceled.resolve();
        this.props.onCanceled?.();
        break;
      default:
        this.whenCanceled.discard();
        break;
    }

    this.props.onEntered?.();
  }

  componentDidMount() {
    const { props: { onExiting, onExited, onEntering }, state: { stage } } = this;

    // Immediately after initialization, it is possible for the transition to not be in
    // the `$entered` stage; just run through the callbacks up to this point.
    if (stage !== $entered) {
      onExiting?.();
      onExited?.();
      if (stage === $entering)
        onEntering?.();
    }

    if (stage !== $entered)
      this.transitionTask.start(this.whenCanceled.sync);
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      props: { content },
      state: { exiting, entering, stage, error }
    } = this;

    if (error !== prevState.error && error)
      throw error;
    
    if (content !== prevState.content) {
      const newState = determineNewState(exiting, entering, content);
      if (newState) this.setState(newState);
    }
    
    if (stage !== prevState.stage) {
      let canceling = false;

      if (stage === $entered && prevProps.exiting && entering) {
        const prevComp = prevProps.exiting.Component;
        const curComp = entering.Component;
        canceling = Object.is(prevComp, curComp);
      }
      
      this.onStageChanged(stage, canceling);
    }

    this.whenUpdated.resolve();
  }

  componentWillUnmount() {
    // Cancel async operations.
    this.transitionTask.stop($componentUnmounted);
  }

  render() {
    const { exiting, entering, stage, error } = this.state;
    const content = exiting || entering;

    if (!content) return null;
    if (error) return null;

    return content.render(content.Component, content.props, content.exitDelay, stage);
  }

}

const defaultRender = (Component, props, exitDelay, stage) => {
  return (
    <div className={`transition ${stage}`}>
      <Component {...props} />
      <style jsx>
        {`
          .transition {
            opacity: 0;
            visibility: hidden;
            transform: opacity ${exitDelay} ease-in-out;
          }
          .exiting, .entered {
            visibility: unset;
          }
          .entered {
            opacity: 1;
          }
        `}
      </style>
    </div>
  );
};

const determineNewState = (exiting, entering, content) => {
  if (!content)
    return transitionToUnresolved(exiting, entering);
  if (entering && Object.is(entering.Component, content.Component))
    return updateEntering(entering, content);
  if (exiting && Object.is(exiting.Component, content.Component))
    return cancelExiting(exiting, content);
  return transitionToResolved(exiting, entering, content);
};

const transitionToUnresolved = (exiting, entering) => {
  if (!entering) return null;
  if (exiting) return { entering: null };
  return { exiting: entering, entering: null };
};

const updateEntering = (entering, content) => {
  const updated = assignProps(entering, content);
  if (updated === entering) return null;
  return { entering: updated };
};

const cancelExiting = (exiting, content) => {
  return { exiting: null, entering: assignProps(exiting, content) };
};

const transitionToResolved = (exiting, entering, content) => {
  if (exiting || !entering) return { entering: createTransition(content) };
  return { exiting: entering, entering: createTransition(content) };
};

const fixRender = (render) => render::is.func() ? render : defaultRender;
const fixExitDelay = (exitDelay) => exitDelay::is.finite() ? Math.max(exitDelay, 0) : 0;

const createTransition = ({Component, props, render, exitDelay}) => {
  return {
    Component, props,
    render: fixRender(render),
    exitDelay: fixExitDelay(exitDelay)
  };
};

const assignProps = (transition, content) => {
  const props = content.props;
  const render = fixRender(content.render);
  const exitDelay = fixExitDelay(content.exitDelay);

  switch (true) {
    case !Object.is(transition.props, props):
    case !Object.is(transition.render, render):
    case !Object.is(transition.exitDelay, exitDelay):
      return { Component: transition.Component, props, render, exitDelay };
    default:
      return transition;
  }
};

const updateStage = (exiting, entering, contentShown) => {
  if (exiting) return contentShown ? $exiting : $exited;
  if (entering) return contentShown ? $entered : $entering;
  return $exited;
};

export default Transition;