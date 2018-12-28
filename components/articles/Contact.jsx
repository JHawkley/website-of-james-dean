import Article from "components/Article";
import ContactForm from "components/ContactForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons/faLinkedin";
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";

const Contact = (props) => (
  <Article {...props}>
    <h2 className="major">Contact</h2>
    <ContactForm displayed={props.active} />
    <ul className="icons">
      <li><a href="https://www.linkedin.com/in/james-dean-7b96aa169/">
        <FontAwesomeIcon icon={faLinkedin} />
      </a></li>
      <li><a href="https://github.com/JHawkley">
        <FontAwesomeIcon icon={faGithub} />
      </a></li>
    </ul>
  </Article>
);

export default Contact;