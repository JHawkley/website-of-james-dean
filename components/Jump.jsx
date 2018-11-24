import Link from "next/link";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faImage from "@fortawesome/fontawesome-free-regular/faImage";
import { faExternalLinkAlt, faFilm, faImages } from "@fortawesome/free-solid-svg-icons";
import { extensions as objEx, dew } from "tools/common";
import { extensions as maybe, nothing } from "tools/maybe";

const buildIcon = (props) => {
  const icon = dew(() => {
    switch (props.icon) {
      case "none": return nothing;
      case "image": return faImage;
      case "images": return faImages;
      case "movie": return faFilm;
      case "link": return faExternalLinkAlt;
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

const Jump = (props) => {
  const linkProps = {};
  const anchorProps = {};
  props::objEx.forOwnProps((value, key) => {
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