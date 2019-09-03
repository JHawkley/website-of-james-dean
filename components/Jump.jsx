import PropTypes from "prop-types";
import Link from "next/link";
import url from "url";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-regular-svg-icons/faImage";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
import { faFilm } from "@fortawesome/free-solid-svg-icons/faFilm";
import { faImages } from "@fortawesome/free-solid-svg-icons/faImages";
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

const isExternal = (href, as, target) =>
  Boolean(!as && target !== "_blank" && href && url.parse(href).host);

const decomposeProps = (props) => {
  const { children, target, rel, opener, scroll, icon, ...restProps } = props;
  const jumpProps = { children, target, rel, opener, scroll, icon };

  const { href, as, prefetch, replace, shallow, passHref, ...anchorProps } = restProps;
  const linkProps = { href, as, prefetch, replace, shallow, passHref };

  return { jumpProps, linkProps, anchorProps };
};

const renderAsAnchor = (jumpProps, anchorProps) => (
  <a {...anchorProps} target={jumpProps.target} rel={determineRel(jumpProps)}>
    {jumpProps.children}
    {buildIcon(jumpProps)}
  </a>
);

const renderAsLink = (jumpProps, linkProps, anchorProps) => (
  <Link {...linkProps} scroll={jumpProps.scroll}>
    {renderAsAnchor(jumpProps, anchorProps)}
  </Link>
);

const Jump = (props) => {
  const { jumpProps, linkProps, anchorProps } = decomposeProps(props);
  const { target } = jumpProps;
  const { href, as } = linkProps;

  if (isExternal(href, as, target))
    return renderAsAnchor(jumpProps, { href, ...anchorProps });
  else
    return renderAsLink(jumpProps, linkProps, anchorProps);
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

const importWrapper = (route, exportedAs) => {
  const ImportedJump = ({anchorTo, ...props}) => {
    const href = anchorTo ? `${route}#${anchorTo}` : route;
    const asPath = anchorTo ? `${exportedAs}#${anchorTo}` : exportedAs;
    return <Jump {...props} href={href} as={asPath} />;
  };

  ImportedJump.propTypes = { anchorTo: PropTypes.string };
  ImportedJump.displayName = `jumpTo("${route}")`;
  ImportedJump.navigateTo = (router) => router.navigateTo(route, exportedAs);

  return ImportedJump;
}

export default Jump;
export { importWrapper };