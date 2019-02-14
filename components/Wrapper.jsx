import React from "react";
import PropTypes from "prop-types";
import { dew } from "tools/common";
import { memoize } from "tools/functions";
import ScrollLockedContext from "common/ScrollLockedContext";
import { resolveScrollCss } from "styles/jsx/components/Wrapper";

class Wrapper extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node
  };

  static contextType = ScrollLockedContext;

  getScroll = dew(() => {
    let current = null;
    let previous = null;

    const restore = () => {
      if (current) return;
      if (!previous) return;
      window.scrollTo(previous.x, previous.y);
      previous = null;
    };

    const _getScroll = memoize((preventScroll) => {
      current = preventScroll ? { x: window.scrollX, y: window.scrollY } : null;
      if (current) previous = current;
      const { className, styles } = resolveScrollCss(current);
      return { restore, className, styles };
    });

    return () => _getScroll(this.context);
  });

  componentDidUpdate() {
    this.getScroll().restore();
  }

  render() {
    const { children } = this.props;
    const { className, styles } = this.getScroll();

    return (
      <div id="wrapper" className={className}>
        {children}
        {styles}
      </div>
    );
  }

}

export default Wrapper;