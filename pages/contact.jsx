import React from "react";
import PropTypes from "prop-types";
import Page from "components/Page";
import css from "styled-jsx/css";
import styleVars from "styles/vars.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons/faLinkedin";
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";

const ContactItem = ({icon, title, href}) => (
  <a href={href} className={contactItemCss.className}>
    <dl><dt><FontAwesomeIcon icon={icon} /></dt><dd>{title}</dd></dl>
  </a>
);

ContactItem.propTypes = {
  icon: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired
};

const ContactPage = (props) => (
  <Page {...props}>
    <h2 className="major">Contact</h2>
    <p>Any of the places below are fine points of contact.  I look forward to hearing from you.</p>
    <ContactItem icon={faLinkedin} title="LinkedIn" href="https://www.linkedin.com/in/james-dean-7b96aa169/" />
    <ContactItem icon={faGithub} title="Github" href="https://github.com/JHawkley" />
    {contactItemCss.styles}
  </Page>
);

const contactItemCss = css.resolve`
  a {
    display: block;
    border-radius: 4px;
    border: solid 1px #fff;
    margin: 0 auto 2rem auto;
    text-align: center;
    max-width: 70%;
  }

  a:hover {
    background-color: ${styleVars["palette"]["border-bg"]};
  }

  a :global(dl) {
    margin: 0.25rem;
    font-weight: ${styleVars["font"]["weight-bold"]};
    font-size: 2.25rem;
    line-height: 2.25rem;

    // Creating an isolated stacking context for the icon.
    position: relative;
    z-index: 0;
  }

  a :global(dl > dt) {
    margin: 0;
    font-weight: inherit;
    opacity: 70%;

    // Pull the icon out of flow and keep it vertically centered.
    position: absolute;
    left: 0;
    top: 50%;
    translate: 0% -50%;
  }

  a :global(dl > dd) {
    font-variant-caps: small-caps;
    margin-left: 0;
  }
`;

export default ContactPage;