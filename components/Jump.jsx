import PropTypes from "prop-types";
import { withRouter } from "next/router";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-regular-svg-icons/faImage";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
import { faFilm } from "@fortawesome/free-solid-svg-icons/faFilm";
import { faImages } from "@fortawesome/free-solid-svg-icons/faImages";
import { extensions as objEx } from "tools/common";
import iconLinksCss from "styles/jsx/lib/iconLinks";

const $none = "none";
const $image = "image";
const $images = "images";
const $movie = "movie";
const $link = "link";

const determineIcon = ({icon, target}) => {
  switch (icon) {
    case $none: return null;
    case $image: return faImage;
    case $images: return faImages;
    case $movie: return faFilm;
    case $link: return faExternalLinkAlt;
    default: return target === "_blank" ? faExternalLinkAlt : null;
  }
};

const buildIcon = (props) => {
  const icon = determineIcon(props);
  if (!icon) return null;

  return (
    <span className="link-icon">
      &nbsp;
      <FontAwesomeIcon icon={icon} size="sm" />
      <span className="link-space">&nbsp;</span>
      <style jsx>{iconLinksCss}</style>
    </span>
  );
};

const determineRel = ({target, rel, opener}) => {
  if (opener || target !== "_blank") return rel;
  if (!rel) return "noopener";
  const relSet = new Set(rel.split(" ").filter(Boolean));
  relSet.add("noopener");
  return [...relSet].join(" ");
};

const ownPropKeys = new Set(["children", "target", "rel", "opener", "scroll", "icon"]);
const linkPropKeys = new Set(["href", "as", "prefetch", "replace", "shallow", "passHref"]);

const Jump = (props) => {
  const linkProps = {};
  const anchorProps = {};
  props::objEx.forOwnProps((value, key) => {
    if (ownPropKeys.has(key)) return;
    const pool = linkPropKeys.has(key) ? linkProps : anchorProps;
    pool[key] = value;
  });

  return (
    <Link {...linkProps} scroll={props.scroll}>
      <a {...anchorProps} target={props.target} rel={determineRel(props)}>
        {props.children}
        {buildIcon(props)}
      </a>
    </Link>
  );
};

Jump.propTypes = {
  children: PropTypes.node,
  target: PropTypes.string,
  rel: PropTypes.string,
  opener: PropTypes.bool,
  scroll: PropTypes.bool,
  icon: PropTypes.oneOf([$none, $image, $images, $movie, $link])
};

Jump.defaultProps = {
  scroll: false
};

export default withRouter(Jump);