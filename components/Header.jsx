import PropTypes from "prop-types";
import Jump from "components/Jump";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode } from "@fortawesome/free-solid-svg-icons/faCode";
import { color } from "tools/css";
import styleVars from "styles/vars.json";

import $intro from "pages/intro?route";
import $work from "pages/work/index?route";
import $questions from "pages/questions?route";
import $contact from "pages/contact?route";

const bgColor = color(styleVars["palette"]["bg"]).transparentize(0.15).asRgba();

const Header = ({className}) => (
  <header id="header" className={className}>
    <div className="logo">
      <FontAwesomeIcon icon={faCode} transform="grow-18" />
    </div>
    <div className="content">
      <div className="inner">
        <h1>A Programmer's Place</h1>
        <p>My name is James Dean; this is a place to get to know me<br />
        and get more information on the works I've done.</p>
      </div>
    </div>
    <nav>
      <ul>
        <li><Jump href={$intro}>Intro</Jump></li>
        <li><Jump href={$work}>Work</Jump></li>
        <li><Jump href={$questions}>Q&amp;A</Jump></li>
        <li><Jump href={$contact}>Contact</Jump></li>
      </ul>
    </nav>
    <style jsx>
      {`
        #header {
          border-radius: 4px;
          padding: 1.5rem;
          background-color: ${bgColor};
        }
      `}
    </style>
  </header>
);

Header.propTypes = {
  className: PropTypes.string
};

export default Header;
