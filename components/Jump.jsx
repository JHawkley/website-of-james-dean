import Link from "next/link";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faImage from "@fortawesome/fontawesome-free-regular/faImage";
import { faExternalLinkAlt, faFilm, faImages } from "@fortawesome/free-solid-svg-icons";
import { forOwnProps } from "/tools/common";

const buildIcon = (props) => {
  function _icon() {
    switch (props.icon) {
      case "none": return null;
      case "image": return faImage;
      case "images": return faImages;
      case "movie": return faFilm;
      case "link": return faExternalLinkAlt;
      default: return props.target === "_blank" ? faExternalLinkAlt : null;
    }
  }
  const icon = _icon();
  if (icon === null) return null;
  return (
    <span style={{'whiteSpace': 'nowrap'}}>
      &nbsp;
      <FontAwesomeIcon icon={icon} size="sm" />
      <span style={{'width': '0', 'display': 'inline-block'}}>&nbsp;</span>
    </span>
  );
};

const Jump = (props) => {
  const linkProps = {};
  const anchorProps = {};
  props::forOwnProps((value, key) => {
    if (key === "children") return;
    if (key === "icon") return;
    if (key in Link.propTypes)
      linkProps[key] = value;
    else
      anchorProps[key] = value;
  });

  return (
    <Link {...linkProps}>
      <a {...anchorProps}>
        {props.children}
        {buildIcon(props)}
      </a>
    </Link>
  );
}

export default Jump;