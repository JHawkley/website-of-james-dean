import React, { Fragment } from "react";
import PropTypes from "prop-types";
import RouterContext from "common/RouterContext";
import Background from "components/Background";
import { timespan } from "tools/css";
import styleVars from "styles/vars.json";

const articleTransition = timespan(styleVars["duration"]["article"]);

class Inner extends React.PureComponent {

  static displayName = ".Page";

  static propTypes = {
    routerContext: PropTypes.shape({
      router: PropTypes.any,
      upLevel: PropTypes.func,
      upToIndex: PropTypes.func
    }).isRequired,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node
  };

  upLevel = () => this.props.routerContext.upLevel();

  upToIndex = () => this.props.routerContext.upToIndex();

  render() {
    const { id, className, style, children } = this.props;

    return (
      <article id={id} className={className} style={style}>
        <div onClick={this.upLevel} className="back"></div>
        <div onClick={this.upToIndex} className="close"></div>
        {children}
      </article>
    );
  }

}

const Page = (props) => (
  <RouterContext.Consumer>
    {router => <Inner {...props} routerContext={router} />}
  </RouterContext.Consumer>
);

Page.transition = {
  exitDelay: articleTransition,
  // eslint-disable-next-line react/display-name
  render: (Component, props, exitDelay, stage = "entered") => (
    <Fragment>
      <div key="content" className={`page ${stage}`}><Component {...props} /></div>
      <Background key="background" className="blur" />
    </Fragment>
  )
};

export default Page;