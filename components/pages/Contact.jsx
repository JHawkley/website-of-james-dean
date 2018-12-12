import Page from "components/Page";
import ContactForm from "components/ContactForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";

const $contact = "contact";
const { Fragment } = React;

export default class Contact extends Page($contact) {

  content() {
    return (
      <Fragment>
        <h2 className="major">Contact</h2>
        <ContactForm displayed={this.isCurrentPage} />
        <ul className="icons">
          <li><a href="https://www.linkedin.com/in/james-dean-7b96aa169/">
            <FontAwesomeIcon icon={faLinkedin} />
          </a></li>
          <li><a href="https://github.com/JHawkley">
            <FontAwesomeIcon icon={faGithub} />
          </a></li>
        </ul>
      </Fragment>
    );
  }

}