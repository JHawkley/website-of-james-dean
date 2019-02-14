import React from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * A header for the front-page of the application.  Designed to have at least two children, a `Header.Content`
 * component, followed by one-or-more `Header.Nav` components.
 * 
 * @export
 * @param {Object} props The props for the component.
 * @param {*} [props.children] The component's children.
 * @param {string} [props.className] A custom class for the root `header#header` element.
 * @param {Object} [props.style] A style to apply to the root `header#header` element.
 * @param {*} [props.logo] A Font-Awesome icon to affix to the header as header.
 * @returns A DOM-tree fragment.
 */
const Header = ({children, className, style, logo}) => {
  return (
    <header id="header" className={className} style={style}>
      {logo && (
        <div className="logo">
          <FontAwesomeIcon icon={logo} transform="grow-18" />
        </div>
      )}
      {children}
    </header>
  );
};

Header.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  logo: PropTypes.any
};


/**
 * A component that provides the content for the header.
 * 
 * @param {Object} props The props for the component.
 * @param {*} [props.children] The component's children.
 * @param {string} [props.id] A custom ID to apply to the root `div.content` element.
 * @param {string} [props.className] A custom class to add to the root `div.content` element.
 * @param {Object} [props.style] A style to apply to the root `div.content` element.
 * @returns A DOM-tree fragment.
 */
Header.Content = ({children, id, className: customClass, style}) => {
  const className = ["content", customClass].filter(Boolean).join(" ");

  return (
    <div id={id} className={className} style={style}>
      <div className="inner">
        {children}
      </div>
    </div>
  );
};

Header.Content.displayName = "Header.Content";

Header.Content.propTypes = {
  children: PropTypes.node,
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object
};

const navChildLister = (child, i) => <li key={i}>{child}</li>;

/**
 * A component that provides a main navigation bar for the header.
 * 
 * @param {Object} props The props for the component.
 * @param {*} [props.children] The component's children; should all be some form of clickable link.
 * @param {string} [props.id] A custom ID to apply to the root `nav` element.
 * @param {string} [props.className] A custom class for the root `nav` element.
 * @param {Object} [props.style] A style to apply to the root `nav` element.
 * @returns A DOM-tree fragment.
 */
Header.Nav = ({children, id, className, style}) => (
  <nav id={id} className={className} style={style}>
    <ul>
      {React.Children.toArray(children).map(navChildLister)}
    </ul>
  </nav>
);

Header.Nav.displayName = "Header.Nav";

Header.Nav.propTypes = {
  children: PropTypes.node,
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object
};

export default Header;
