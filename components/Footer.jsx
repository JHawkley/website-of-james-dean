import PropTypes from "prop-types";

/**
 * A footer for the front-page of the application.
 * 
 * @export
 * @param {Object} props The props for the component.
 * @param {*} [props.children] The component's children.
 * @param {string} [props.className] A custom class for the root `footer#footer` element.
 * @param {Object} [props.style] A style to apply to the root `footer#footer` element.
 * @returns A DOM-tree fragment.
 */
const Footer = ({children, className, style}) =>
  <footer id="footer" className={className} style={style}>{children}</footer>;

Footer.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object
};

export default Footer;
