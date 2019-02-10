import PropTypes from "prop-types";
import Jump from "./Jump";

const Footer = ({className}) => (
  <footer id="footer" className={className}>
    <p className="copyright">Template: &copy; <Jump href="https://github.com/codebushi/nextjs-starter-dimension" icon="none">Next.js Starter - Dimension</Jump>.  Content: &copy; James Dean</p>
    <p className="copyright">Design: <Jump href="https://html5up.net" icon="none">HTML5 UP</Jump>.  Built with: <Jump href="https://github.com/zeit/next.js" icon="none">Next.js</Jump></p>
  </footer>
);

Footer.propTypes = {
  className: PropTypes.string
};

export default Footer;
