import PropTypes from "prop-types";
import Jump from "./Jump";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faGem from "@fortawesome/fontawesome-free-regular/faGem";

const Header = (props) => (
  <header id="header" style={props.timeout ? {display: 'none'} : {}}>
    <div className="logo">
      {/*<span className="icon fa-diamond"></span>*/}
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
        <li><Jump href="#intro">Intro</Jump></li>
        <li><Jump href="#work">Work</Jump></li>
        <li><Jump href="#about">About</Jump></li>
        <li><Jump href="#questions">Q&amp;A</Jump></li>
      </ul>
    </nav>
    <nav>
      <ul>
        <li><Jump href="#contact">Contact</Jump></li>
      </ul>
    </nav>
  </header>
);

Header.propTypes = {
  timeout: PropTypes.bool
};

export default Header;
