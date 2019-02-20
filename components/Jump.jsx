import PropTypes from "prop-types";
import { withRouter } from "next/router";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-regular-svg-icons/faImage";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
import { faFilm } from "@fortawesome/free-solid-svg-icons/faFilm";
import { faImages } from "@fortawesome/free-solid-svg-icons/faImages";
import { extensions as objEx, dew } from "tools/common";
import { extensions as maybe } from "tools/maybe";

const $none = "none";
const $image = "image";
const $images = "images";
const $movie = "movie";
const $link = "link";

const buildIcon = (props) => {
  const icon = dew(() => {
    switch (props.icon) {
      case $none: return null;
      case $image: return faImage;
      case $images: return faImages;
      case $movie: return faFilm;
      case $link: return faExternalLinkAlt;
      default: return faExternalLinkAlt::maybe.when(props.target === "_blank");
    }
  });

  return icon::maybe.map(icon => (
    <span style={{'whiteSpace': 'nowrap'}}>
      &nbsp;
      <FontAwesomeIcon icon={icon} size="sm" />
      <span style={{'width': '0', 'display': 'inline-block'}}>&nbsp;</span>
    </span>
  ));
};

const ownPropKeys = new Set(["children", "icon", "href", "router"]);
const linkPropKeys = new Set(["as", "prefetch", "replace", "shallow", "scroll", "passHref"]);

const Jump = (props) => {
  const linkProps = {};
  const anchorProps = {};
  props::objEx.forOwnProps((value, key) => {
    if (ownPropKeys.has(key)) return;
    const pool = linkPropKeys.has(key) ? linkProps : anchorProps;
    pool[key] = value;
  });

  const href = props.href;

  return (
    <Link {...linkProps} href={href}>
      <a {...anchorProps}>
        {props.children}
        {buildIcon(props)}
      </a>
    </Link>
  );
};

Jump.propTypes = {
  children: PropTypes.node,
  scroll: PropTypes.bool,
  icon: PropTypes.oneOf([$none, $image, $images, $movie, $link]),
  href: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  router: PropTypes.any.isRequired
};

Jump.defaultProps = {
  scroll: false
};

export default withRouter(Jump);