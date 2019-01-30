import React from "react";
import PropTypes from "prop-types";

class DynamicLoader extends React.PureComponent {

  static propTypes = {
    onError: PropTypes.func,
    onPastDelay: PropTypes.func
  };

  static bindCallbacks({onError, onPastDelay}) {
    const BoundLoader = (props) => <DynamicLoader {...props} onError={onError} onPastDelay={onPastDelay} />;
    return BoundLoader;
  }

  callError({ error, retry, onError }) {
    onError?.(error, retry) ?? throw error;
  }

  callTimeout({ onError }) {
    const error = new Error("dynamic component failed to load due to a timeout");
    error.statusCode = 408;
    onError?.(error) ?? throw error;
  }

  callPastDelay({ onPastDelay }) {
    onPastDelay?.();
  }

  componentDidMount() {
    const curProps = this.props;

    if (curProps.error != null)
      this.callError(curProps);
    else if (curProps.timeout)
      this.callTimeout(curProps);
    else if (curProps.pastDelay)
      this.callPastDelay(curProps);
  }

  componentDidUpdate(prevProps) {
    const curProps = this.props;

    if (curProps.error != null && curProps.error !== prevProps.error)
      this.callError(curProps);
    else if (curProps.timeout && curProps.timeout !== prevProps.timeout)
      this.callTimeout(curProps);
    else if (curProps.pastDelay && curProps.pastDelay !== prevProps.pastDelay)
      this.callPastDelay(curProps);
  }

  render() { return null; }

}

export default DynamicLoader;