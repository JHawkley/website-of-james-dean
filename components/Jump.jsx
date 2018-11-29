import { withRouter } from "next/router";
import Link from "next/link";
import Page from "components/Page";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faImage from "@fortawesome/fontawesome-free-regular/faImage";
import { parse as parseUrl } from "url";
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

const getLocationOrigin = () => {
  const { protocol, hostname, port } = window.location;
  return `${protocol}//${hostname}${port ? ":" + port : ""}`;
}

const buildHref = (props) => {
  const { href = nothing, page = nothing } = props;
  return Page.hrefFor(href, page);
};

const doesItScroll = (href, router) => {
  const parsedHref = parseUrl(href);
  if (parsedHref.host::maybe.isDefined()) {
    if (typeof window === "undefined") return void 0;
    const parsedOrigin = parseUrl(getLocationOrigin());
    if (parsedHref.protocol !== parsedOrigin.protocol) return void 0;
    if (parsedHref.host !== parsedOrigin.host) return void 0;
  }
  
  if (parsedHref.pathname::maybe.isEmpty()) return false;
  const resolvedHref = parseUrl(router.pathname).resolveObject(parsedHref);
  if (resolvedHref.pathname === router.pathname) return false;
  return true;
};

const Jump = (props) => {
  const linkProps = {};
  const anchorProps = {};
  props::objEx.forOwnProps((value, key) => {
    if (key === "children") return;
    if (key === "icon") return;
    if (key === "page") return;
    if (key === "href") return;
    if (key === "scroll") return;
    if (key === "router") return;
    if (key in Link.propTypes)
      linkProps[key] = value;
    else
      anchorProps[key] = value;
  });

  const href = buildHref(props);
  const shouldScroll = props.scroll ?? doesItScroll(href, props.router);

  return (
    <Link {...linkProps} href={href} scroll={shouldScroll}>
      <a {...anchorProps}>
        {props.children}
        {buildIcon(props)}
      </a>
    </Link>
  );
};

export default withRouter(Jump);