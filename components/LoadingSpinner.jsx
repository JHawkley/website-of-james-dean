import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons/faSpinner";
import { dew, is } from "tools/common";
import { extensions as maybe } from "tools/maybe";
import { color } from "tools/css";
import { extensions as asyncEx, CallSync, wait } from "tools/async";
import styleVars from "styles/vars.json";

const bgColor = color(styleVars.palette.bg).transparentize(0.15).asRgba();

const $left = "left";
const $center = "center";
const $right = "right";
const $top = "top";
const $middle = "middle";
const $bottom = "bottom";

class LoadingSpinner extends React.PureComponent {

  static propTypes = {
    fixed: PropTypes.bool,
    hPos: PropTypes.oneOf([$center, $left, $right]),
    hOffset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    vPos: PropTypes.oneOf([$middle, $top, $bottom]),
    vOffset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    style: PropTypes.object,
    size: PropTypes.oneOf(["xs", "sm", "lg", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
    background: PropTypes.bool,
    delay: PropTypes.number,
    fadeTime: PropTypes.number,
    show: PropTypes.bool
  };

  static defaultProps = {
    fixed: false,
    hPos: $center,
    hOffset: "2rem",
    vPos: $middle,
    vOffset: "2rem",
    size: "1x",
    background: false,
    delay: 0,
    show: true
  };

  static getDerivedStateFromProps(props, state) {
    return !props.show && state.shown ? { shown: false, vanishing: true } : null;
  }

  cancelAsync = new CallSync();

  constructor(props) {
    super(props);

    this.state = {
      shown: props.delay === 0 ? props.show : false,
      vanishing: false
    };
  }

  async delayShow() {
    if (this.state.shown) return;
    
    if (this.state.vanishing) {
      this.cancelAsync.resolve();
      this.setState({ shown: true, vanishing: false });
    }
    else {
      const waited = await wait(this.props.delay, this.cancelAsync.sync);
      if (waited::asyncEx.isAborted()) return;
      if (this.state.shown) return;
      this.setState({ shown: true });
    }
  }

  async clearVanish() {
    if (!this.state.vanishing) return;
    const waited = await wait(this.props.fadeTime, this.cancelAsync.sync);
    if (waited::asyncEx.isAborted()) return;
    if (!this.state.vanishing) return;
    this.setState({ vanishing: false });
  }

  componentDidMount() {
    this.delayShow();
  }

  componentDidUpdate(prevProps, prevState) {
    const { props: { show, delay }, state: { shown, vanishing } } = this;
    let doShow = show !== prevProps.show && show && !shown;

    if (delay !== prevProps.delay) {
      this.cancelAsync.resolve();
      doShow = doShow || (show && !shown);
    }

    if (vanishing !== prevState.vanishing && vanishing) this.clearVanish();
    if (doShow) this.delayShow();
  }

  componentWillUnmount() {
    // Cancel asynchronous activities.
    this.cancelAsync.resolve();
  }

  render() {
    const {
      props: { style: customStyle, size, fixed, background, fadeTime, show },
      state: { shown, vanishing }
    } = this;

    const klass = ["root"];
    if (background) klass.push("bg");

    const style = {
      ...customStyle,
      opacity: shown ? 1 : 0,
      display: show || shown || vanishing ? "block" : "none"
    };

    const transform = dew(() => {
      const { hPos, vPos } = this.props;
      if (hPos !== $center && vPos !== $middle) return "none";
      const xTrans = hPos === $center ? "-50%" : "0%";
      const yTrans = vPos === $middle ? "-50%" : "0%";
      return `translate(${xTrans}, ${yTrans})`;
    });

    const [horizAttr, horizVal] = dew(() => {
      const { hPos, hOffset } = this.props;
      const offset = hOffset::is.string() ? hOffset : `${hOffset}px`;
      switch (hPos) {
        case $left: return [$left, offset];
        case $right: return [$right, offset];
        default: return [$left, "50%"];
      }
    });

    const [vertAttr, vertVal] = dew(() => {
      const { vPos, vOffset } = this.props;
      const offset = vOffset::is.string() ? vOffset : `${vOffset}px`;
      switch (vPos) {
        case $top: return [$top, offset];
        case $bottom: return [$bottom, offset];
        default: return [$top, "50%"];
      }
    });

    return (
      <div className={klass.join(" ")} style={style}>
        <FontAwesomeIcon icon={faSpinner} size={size === "1x" ? null : size} spin />
        <style jsx>
          {`
            .root {
              pointer-events: none;
              opacity: 0;
            }
            .bg {
              border-radius: 4px;
              padding: 1.5rem;
              background-color: ${bgColor};
            }
          `}
        </style>
        <style jsx>
          {`
            .root {
              position: ${fixed ? "fixed" : "absolute"};
              ${fadeTime::maybe.map(n => `transition: opacity ${n}ms ease-in-out;`) ?? ""}
              transform: ${transform};
              ${horizAttr}: ${horizVal};
              ${vertAttr}: ${vertVal};
            }
          `}
        </style>
      </div>
    );
  }

}

export default LoadingSpinner;