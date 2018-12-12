import PropTypes from "prop-types";
import { dew } from "tools/common";
import { extensions as numEx } from "tools/numbers";
import { extensions as fnEx } from "tools/functions";
import { extensions as maybe, nothing } from "tools/maybe";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImages } from "@fortawesome/free-solid-svg-icons";
import BaseLightbox from "react-image-lightbox";

const galleries = new Map();
const openFns = new Set();
const closeFns = new Set();

const KEYS = {
  ARROW_UP: { code: 38, key: "ArrowUp" },
  ARROW_DOWN: { code: 40, key: "ArrowDown" }
}

const reactModalProps = {
  parentSelector: () => document.getElementById("__next"),
  appElement: void 0
};

class ReactLightbox extends BaseLightbox {
  handleKeyInput(event) {
    const key = event.key ?? dew(() => {
      switch (event.which ?? event.keyCode) {
        case KEYS.ARROW_UP.code: return KEYS.ARROW_UP.key;
        case KEYS.ARROW_DOWN.code: return KEYS.ARROW_DOWN.key;
        default: return "Unidentified";
      }
    });

    switch (key) {
      case KEYS.ARROW_UP.key:
      case KEYS.ARROW_DOWN.key:
        event.stopPropagation();
        event.preventDefault();
        break;
      default: super.handleKeyInput(event);
    }
  }
}

class Lightbox extends React.Component {

  /**
   * Creates a new gallery, producing a `Gallery` component that will make links that will open the gallery.
   *
   * @static
   * @param {string} galleryName The name of the gallery.
   * @param {Array<string | {i: string, d: string}>} galleryData The data describing the gallery.
   * @returns {(props: *) => *} A functional component.
   * @memberof Lightbox
   */
  static makeGallery(galleryName, galleryData) {
    galleries.set(galleryName, galleryData);

    const Gallery = ({children, index = 0}) => {
      return (
        <a href="javascript:;" onClick={Gallery.openCallback(index)}>
          {children}
          <span style={{"whiteSpace": "nowrap"}}>
            &nbsp;
            <FontAwesomeIcon icon={faImages} size="sm" />
            <span style={{"width": "0", "display": "inline-block"}}>&nbsp;</span>
          </span>
        </a>
      );
    };

    Gallery.forceOpen = (index) => {
      for (const fn of openFns) fn(galleryName, index);
    };

    Gallery.openCallback = ((index) => () => Gallery.forceOpen(index))::fnEx.memoize();

    Gallery.propTypes = {
      index: PropTypes.number,
      children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
      ]),
    };

    return Gallery;
  }

  static forceClose() {
    for (const fn of closeFns) fn();
  }

  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
      galleryName: "",
      galleryIndex: 0
    };
  }

  componentDidMount() {
    openFns.add(this.doOpenLightbox);
    closeFns.add(this.doCloseLightbox);
  }

  componentWillUnmount() {
    openFns.delete(this.doOpenLightbox);
    closeFns.delete(this.doCloseLightbox);
  }

  onCloseRequest = () => {
    this.setState({ isOpen: false });
  }

  onMovePrevRequest = () => {
    const { galleryIndex, galleryName } = this.state;
    const images = galleries.get(galleryName);
    if (images::maybe.isEmpty()) return;

    this.setState({
      galleryIndex: (galleryIndex - 1)::numEx.reflowBy(images)
    });
  }

  onMoveNextRequest = () => {
    const { galleryIndex, galleryName } = this.state;
    const images = galleries.get(galleryName);
    if (images::maybe.isEmpty()) return;

    this.setState({
      galleryIndex: (galleryIndex + 1)::numEx.reflowBy(images)
    });
  }

  doOpenLightbox = (galleryName, galleryIndex) => {
    const images = galleries.get(galleryName);
    const isOpen = images::maybe.isDefined();
    galleryIndex = isOpen ? galleryIndex::numEx.reflowBy(images) : 0;
    this.setState({ isOpen, galleryName, galleryIndex });
  }

  doCloseLightbox = () => {
    this.onCloseRequest();
  }

  render() {
    const { isOpen, galleryIndex, galleryName } = this.state;
    if (!isOpen) return nothing;
    const images = galleries.get(galleryName);
    if (images::maybe.isEmpty()) return nothing;

    const image = (index) => typeof images[index] === "object" ? images[index].i : images[index];
    const desc = (index) => typeof images[index] === "object" ? (<p>{images[index].d}</p>) : nothing;
    return (
      <ReactLightbox
        reactModalProps={reactModalProps}
        mainSrc={image(galleryIndex)}
        nextSrc={image((galleryIndex + 1) % images.length)}
        prevSrc={image((galleryIndex + images.length - 1) % images.length)}
        imageCaption={desc(galleryIndex)}
        onCloseRequest={this.onCloseRequest}
        onMovePrevRequest={this.onMovePrevRequest}
        onMoveNextRequest={this.onMoveNextRequest}
        animationOnKeyInput={true}
        enableZoom={false}
      />
    );
  }

}

export default Lightbox;