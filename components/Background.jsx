import PropTypes from "prop-types";
import Preloadable from "components/Preloadable";
import { extensions as asyncEx, Future, preloadImage } from "tools/async";
import { dequote } from "tools/css";
import styleVars from "styles/vars.json";

const bgImageSrc = dequote(styleVars["misc"]["bg-image"]);
const imgOverlaySrc = dequote(styleVars["misc"]["img-overlay"]);

class Background extends Preloadable {

  static propTypes = {
    className: PropTypes.string
  };

  whenUnmounted = new Future();

  componentDidMount() {
    super.componentDidMount();

    const options = { abortSignal: this.whenUnmounted.promise };
    const imgPromise = preloadImage(bgImageSrc, options);
    const overlayPromise = preloadImage(imgOverlaySrc, options);

    Promise.all([imgPromise, overlayPromise])
      .then(this.handlePreloaded)
      ::asyncEx.voidOnAbort()
      .catch(this.handlePreloadError);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.whenUnmounted.resolve();
  }

  render() {
    return <div id="bg" className={this.props.className} />;
  }

}

export default Background;