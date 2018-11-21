import PropTypes from "prop-types";
import { boundedBy } from "/tools/numbers";
import { memoize } from "/tools/functions";
import ReactLightbox from "react-image-lightbox";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import { faImages } from "@fortawesome/free-solid-svg-icons";

const galleries = new Map();
const openFns = new Set();
const closeFns = new Set();

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

    Gallery.openCallback = ((index) => () => Gallery.forceOpen(index))::memoize();

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

    this.onCloseRequest = ::this.onCloseRequest;
    this.onMovePrevRequest = ::this.onMovePrevRequest;
    this.onMoveNextRequest = ::this.onMoveNextRequest;
    this.doOpenLightbox = ::this.doOpenLightbox;
    this.doCloseLightbox = ::this.doCloseLightbox;
  }

  componentDidMount() {
    openFns.add(this.doOpenLightbox);
    closeFns.add(this.doCloseLightbox);
  }

  componentWillUnmount() {
    openFns.delete(this.doOpenLightbox);
    closeFns.delete(this.doCloseLightbox);
  }

  onCloseRequest() {
    this.setState({ isOpen: false });
  }

  onMovePrevRequest() {
    const { galleryIndex, galleryName } = this.state;
    const images = galleries.get(galleryName);
    if (!images) return null;

    this.setState({
      galleryIndex: (galleryIndex - 1)::boundedBy(images)
    });
  }

  onMoveNextRequest() {
    const { galleryIndex, galleryName } = this.state;
    const images = galleries.get(galleryName);
    if (!images) return null;

    this.setState({
      galleryIndex: (galleryIndex + 1)::boundedBy(images)
    });
  }

  doOpenLightbox(galleryName, galleryIndex) {
    const images = galleries.get(galleryName);
    const isOpen = images != null;
    galleryIndex = isOpen ? galleryIndex::boundedBy(images) : 0;
    this.setState({ isOpen, galleryName, galleryIndex });
  }

  doCloseLightbox() {
    this.onCloseRequest();
  }

  render() {
    const { isOpen, galleryIndex, galleryName } = this.state;
    if (!isOpen) return null;
    const images = galleries.get(galleryName);
    if (!images) return null;
    const image = (index) => (typeof images[index] === "object") ? images[index].i : images[index];
    const desc = (index) => (typeof images[index] === "object") ? (<p>{images[index].d}</p>) : null;
    return (
      <ReactLightbox
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