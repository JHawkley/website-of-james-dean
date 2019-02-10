import React from "react";
import PropTypes from "prop-types";
import ScrollLockedContext from "common/ScrollLockedContext";

class Inner extends React.PureComponent {

  static displayName = ".Wrapper";

  static propTypes = {
    children: PropTypes.node,
    preventScroll: PropTypes.bool
  };

  static getDerivedStateFromProps(props, state) {
    if (!process.browser) return null;
    
    const preventScroll = Boolean(props.preventScroll);
    const scrollLocked = Boolean(state.scroll);
    
    if (preventScroll === scrollLocked) return null;

    const scroll = preventScroll ? { x: window.scrollX, y: window.scrollY } : null;
    return { scroll };
  }

  state = { scroll: null };

  componentDidUpdate(prevProps, prevState) {
    if (!process.browser) return;
    if (this.state.scroll === prevState.scroll) return;
    if (!prevState.scroll) return;

    const { x, y } = prevState.scroll;
    window.scrollTo(x, y);
  }

  render() {
    const { props: { children }, state: { scroll } } = this;

    if (!scroll)
      return <div id="wrapper">{children}</div>;

    return (
      <div id="wrapper">
        {children}
        <style jsx>
          {`
            #wrapper {
              margin-top: -${scroll.y}px;
            }
          `}
        </style>
        <style jsx global>
          {`
            .ReactModal__Body--open {
              position: fixed;
              width: 100%;
              height: 100%;
            }
          `}
        </style>
      </div>
    );
  }

}

const Wrapper = (props) => (
  <ScrollLockedContext.Consumer>
    {scrollLocked => <Inner {...props} preventScroll={scrollLocked} />}
  </ScrollLockedContext.Consumer>
);

export default Wrapper;