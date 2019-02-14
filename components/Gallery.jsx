import PropTypes from "prop-types";
import { faImages } from "@fortawesome/free-solid-svg-icons/faImages";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LightboxContext from "lib/LightboxContext";
import GalleryContext from "lib/GalleryContext";

const manage = (Component) => {
  const managed = (props) => (
    <LightboxContext.Consumer>
      {lightbox => (
        <GalleryContext.Consumer>
          {gallery => {
            const galleryOpener = (index) => lightbox.open(gallery, index);
            return <Component {...props} galleryOpener={galleryOpener} />;
          }}
        </GalleryContext.Consumer>
      )}
    </LightboxContext.Consumer>
  );

  managed.displayName = `managed(${Component.displayName || Component.name || "[anonymous]"})`;

  return managed;
};

const Span = ({children, galleryOpener, className: customClass, style, index = 0}) => {
  const className = customClass ? `${customClass} javascript-link` : "javascript-link";
  const openGalleryFn = () => galleryOpener(index);

  return (
    <span className={className} style={style} onClick={openGalleryFn}>
      {children}
    </span>
  );
};

Span.displayName = "Gallery.Span";

Span.propTypes = {
  children: PropTypes.node,
  galleryOpener: PropTypes.func.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  index: PropTypes.number
};

const Gallery = ({children, galleryOpener, index = 0}) => {
  const openGalleryFn = () => galleryOpener(index);

  return (
    <a className="javascript-link" onClick={openGalleryFn}>
      {children}
      <span>
        &nbsp;
        <FontAwesomeIcon icon={faImages} size="sm" />
        <span>&nbsp;</span>
        <style jsx>
          {`
            span { white-space: nowrap; }
            span > span { width: 0px; display: inline-block; }
          `}
        </style>
      </span>
    </a>
  );
};

Gallery.propTypes = {
  children: PropTypes.node,
  galleryOpener: PropTypes.func.isRequired,
  index: PropTypes.number
};

const ManagedGallery = manage(Gallery);

ManagedGallery.Span = manage(Span);

export default ManagedGallery;