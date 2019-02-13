import React from "react";
import PropTypes from "prop-types";
import { dew } from "tools/common";
import { extensions as propTypeEx } from "tools/propTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const strictChildren = (value) => {
  const children = React.Children.toArray(value);
  if (children.length !== 2)
    return "must have only two children, a `Header.Content` followed by a `Header.Nav`";
  if (children[0].type !== Header.Content)
    return "first child must be a `Header.Content` component";
  if (children[1].type !== Header.Nav)
    return "second child must be a `Header.Nav` component";
  return true;
};

const Header = ({children, className, logo}) => {
  return (
    <header id="header" className={className}>
      <div className="logo">
        <FontAwesomeIcon icon={logo} transform="grow-18" />
      </div>
      {children}
    </header>
  );
};

Header.propTypes = {
  children: PropTypes.node::propTypeEx.predicate(strictChildren),
  className: PropTypes.string,
  logo: PropTypes.any
};

Header.Content = dew(() => {
  const HeaderContent = ({children, className: customClass}) => {
    const className = ["content", customClass].filter(Boolean).join(" ");

    return (
      <div className={className}>
        <div className="inner">
          {children}
        </div>
      </div>
    );
  };

  HeaderContent.displayName = "Header.Content";

  HeaderContent.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
  };

  return HeaderContent;
});

Header.Nav = dew(() => {
  const childLister = (child, i) => <li key={i}>{child}</li>;

  const HeaderNav = ({children, className}) => (
    <nav className={className}>
      <ul>
        {React.Children.toArray(children).map(childLister)}
      </ul>
    </nav>
  );

  HeaderNav.displayName = "Header.Nav";

  HeaderNav.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
  };

  return HeaderNav;
});

export default Header;
