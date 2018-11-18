import PropTypes from "prop-types";
import Jump from "./Jump";

const Footer = (props) => (
  <footer id="footer" style={props.timeout ? {display: 'none'} : {}}>
    <p className="copyright">&copy; Next.js Starter - Dimension. Design: <Jump href="https://html5up.net">HTML5 UP</Jump>. Built with: <a href="https://github.com/zeit/next.js">Next.js</a></p>
  </footer>
);

Footer.propTypes = {
  timeout: PropTypes.bool
};

export default Footer;
