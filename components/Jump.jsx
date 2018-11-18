import Link from "next/link";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faImage from "@fortawesome/fontawesome-free-regular/faImage";
import { faExternalLinkAlt, faFilm, faImages } from "@fortawesome/free-solid-svg-icons";

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
  for (const key of Object.keys(props)) {
    if (key === "children") continue;
    if (key === "icon") continue;
    if (key in Link.propTypes)
      linkProps[key] = props[key];
    else
      anchorProps[key] = props[key];
  }
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