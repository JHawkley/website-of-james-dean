import PropTypes from "prop-types";
import Jump from "./Jump";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faGem from "@fortawesome/fontawesome-free-regular/faGem";

import Intro from "./pages/Intro";
import Work from "./pages/Work";
import Questions from "./pages/Questions";
import Contact from "./pages/Contact";

const Header = ({timeout}) => (
  <header id="header" style={timeout ? {display: 'none'} : null}>
    <div className="logo">
      <FontAwesomeIcon icon={faGem} transform="grow-18" />
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
        <li><Jump page={Intro}>Intro</Jump></li>
        <li><Jump page={Work}>Work</Jump></li>
        <li><Jump page={Questions}>Q&amp;A</Jump></li>
        <li><Jump page={Contact}>Contact</Jump></li>
      </ul>
    </nav>
  </header>
);

Header.propTypes = {
  timeout: PropTypes.bool
};

export default Header;
