import PropTypes from "prop-types";
import { Fragment } from "react";
import Background from "components/Background";
import Header from "components/Header";
import Footer from "components/Footer";

const Index = ({className}) => (
  <Fragment>
    <Header className={className} />
    <Footer className={className} />
  </Fragment>
);

Index.transition = {
  // eslint-disable-next-line react/display-name
  render: (Component, {className: customClass}, exitDelay, stage = "entered") => {
    const className = customClass ? `${customClass} ${stage}` : stage;
    return (
      <Fragment>
        <Component className={className} />
        <Background key="background" className={stage !== "entered" ? "blur" : null} />
      </Fragment>
    );
  }
};

Index.propTypes = {
  className: PropTypes.string
};

export default Index;