import React from "react";
import PropTypes from "prop-types";
import { is } from "tools/common";
import { extensions as numEx } from "tools/numbers";
import { extensions as fnEx } from "tools/functions";
import { extensions as maybe, nothing } from "tools/maybe";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImages } from "@fortawesome/free-solid-svg-icons/faImages";
import ReactLightbox from "react-image-lightbox";

const reactModalProps = {
  parentSelector: () => document.getElementById("__next"),
  appElement: void 0
};

class Lightbox extends React.PureComponent {

  /**
   * Creates a new gallery, producing a `Gallery` component that will make links that will open the gallery.
   *
   * @static
   * @param {string} galleryName The name of the gallery.
   * @param {Array<string | {i: string, d: string}>} galleryData The data describing the gallery.
   * @returns {(props: *) => *} A functional component.
   * @memberof Lightbox
   */
  static makeGallery(galleryData, openLightbox, closeLightbox) {
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

    Gallery.openCallback = ((index) => () => openLightbox(galleryData, index))::fnEx.memoize();

    Gallery.close = closeLightbox;

    Gallery.propTypes = {
      index: PropTypes.number,
      children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
      ])
    };

    return Gallery;
  }

  static propTypes = {
    images: PropTypes.array,
    initialIndex: PropTypes.number.isRequired,
    onCloseRequest: PropTypes.func.isRequired
  };

  static getDerivedStateFromProps(props, state) {
    const shouldBeOpen = props.images::maybe.isDefined();
    if (state.isOpen === shouldBeOpen) return null;
    return {
      isOpen: shouldBeOpen,
      index: props.initialIndex
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      isOpen: props.images::maybe.isDefined(),
      index: props.initialIndex
    };
  }

  onMovePrevRequest = () => {
    const { props: { images }, state: { index } } = this;
    if (images::maybe.isEmpty()) return;
    this.setState({ index: (index - 1)::numEx.reflowBy(images) });
  }

  onMoveNextRequest = () => {
    const { props: { images }, state: { index } } = this;
    if (images::maybe.isEmpty()) return;
    this.setState({ index: (index + 1)::numEx.reflowBy(images) });
  }

  render() {
    const { props: { images, onCloseRequest }, state: { index: galleryIndex } } = this;
    if (images::maybe.isEmpty()) return nothing;
    const image = (index) => images[index]::is.object() ? images[index].i : images[index];
    const desc = (index) => images[index]::is.object() ? (<p>{images[index].d}</p>) : nothing;
    return (
      <ReactLightbox
        reactModalProps={reactModalProps}
        mainSrc={image(galleryIndex)}
        nextSrc={image((galleryIndex + 1)::numEx.reflowBy(images))}
        prevSrc={image((galleryIndex - 1)::numEx.reflowBy(images))}
        imageCaption={desc(galleryIndex)}
        onCloseRequest={onCloseRequest}
        onMovePrevRequest={this.onMovePrevRequest}
        onMoveNextRequest={this.onMoveNextRequest}
        animationOnKeyInput={true}
        enableZoom={false}
      />
    );
  }

}

export default Lightbox;