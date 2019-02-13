import PropTypes from "prop-types";

const Footer = ({children, className}) =>
  <footer id="footer" className={className}>{children}</footer>;

Footer.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

export default Footer;
