import React from "react";
import PropTypes from "prop-types";
import { is } from "tools/common";
import { memoize } from "tools/functions";
import { extensions as numEx } from "tools/numbers";
import ReactLightbox from "react-image-lightbox";

class LightboxDisplayer extends React.PureComponent {

  static propTypes = {
    appElement: PropTypes.func.isRequired,
    onCloseRequest: PropTypes.func.isRequired,
    images: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({ i: PropTypes.string, d: PropTypes.string })
      ])
    ),
    initialIndex: PropTypes.number
  };

  static defaultProps = {
    initialIndex: 0
  };

  static getDerivedStateFromProps(props, state) {
    const shouldBeOpen = Boolean(props.images);
    if (state.isOpen === shouldBeOpen) return null;
    return {
      isOpen: shouldBeOpen,
      index: props.initialIndex
    };
  }

  state = {
    isOpen: Boolean(this.props.images),
    index: this.props.initialIndex
  };

  getModalProps = memoize((appElement) => ({ appElement: appElement() }));

  onMovePrevRequest = () => {
    const { images } = this.props;
    if (!images) return;
    this.setState(({index}) => ({ index: (index - 1)::numEx.reflowBy(images) }));
  }

  onMoveNextRequest = () => {
    const { images } = this.props;
    if (!images) return;
    this.setState(({index}) => ({ index: (index + 1)::numEx.reflowBy(images) }));
  }

  render() {
    const {
      props: { appElement, onCloseRequest, images },
      state: { index: galleryIndex }
    } = this;

    if (!images) return null;

    const image = (index) => images[index]::is.object() ? images[index].i : images[index];
    const desc = (index) => images[index]::is.object() ? (<p>{images[index].d}</p>) : null;

    return (
      <ReactLightbox
        mainSrc={image(galleryIndex)}
        nextSrc={image((galleryIndex + 1)::numEx.reflowBy(images))}
        prevSrc={image((galleryIndex - 1)::numEx.reflowBy(images))}
        imageCaption={desc(galleryIndex)}
        onCloseRequest={onCloseRequest}
        onMovePrevRequest={this.onMovePrevRequest}
        onMoveNextRequest={this.onMoveNextRequest}
        animationOnKeyInput={true}
        enableZoom={false}
        reactModalProps={this.getModalProps(appElement)}
      />
    );
  }

}

export default LightboxDisplayer;