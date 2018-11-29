import PropTypes from "prop-types";
import Jump from "./Jump";

const Footer = ({timeout}) => (
  <footer id="footer" style={timeout ? {display: 'none'} : null}>
    <p className="copyright">Template: &copy; <Jump href="https://github.com/codebushi/nextjs-starter-dimension" target="_blank" icon="none">Next.js Starter - Dimension</Jump>.  Content: &copy; James Dean</p>
    <p className="copyright">Design: <Jump href="https://html5up.net" target="_blank" icon="none">HTML5 UP</Jump>.  Built with: <Jump href="https://github.com/zeit/next.js" target="_blank" icon="none">Next.js</Jump></p>
  </footer>
);

Footer.propTypes = {
  timeout: PropTypes.bool
};

export default Footer;
