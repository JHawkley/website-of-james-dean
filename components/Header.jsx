import PropTypes from "prop-types";
import { Goto } from "components/Page";
import { ImageSync } from "components/AsyncImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode } from "@fortawesome/free-solid-svg-icons";

import $intro from "pages/articles/intro?name";
import $work from "pages/articles/work?name";
import $questions from "pages/articles/questions?name";
import $contact from "pages/articles/contact?name";

const Header = ({timeout}) => (
  <header id="header" style={timeout ? {display: 'none'} : null}>
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
        <li><Goto page={$intro}>Intro</Goto></li>
        <li><Goto page={$work}>Work</Goto></li>
        <li><Goto page={$questions}>Q&amp;A</Goto></li>
        <li><Goto page={$contact}>Contact</Goto></li>
      </ul>
    </nav>
  </header>
);

Header.propTypes = {
  timeout: PropTypes.bool,
  imageSync: PropTypes.instanceOf(ImageSync)
};

export default Header;
