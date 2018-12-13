import PropTypes from "prop-types";
import Link from "next/link";
import { parse as parseUrl } from "url";
import { ImageSync } from "./AsyncImage";
import { extensions as maybe, nothing } from "tools/maybe";

const attachPageQuery = (urlObj, page) => {
  if (typeof urlObj.query === "string") {
    if (urlObj.query.length > 0)
      urlObj.query += "&";
    urlObj.query += `page=${page}`;
    return urlObj;
  }

  urlObj.query = Object.assign(urlObj.query ?? {}, { page });
  return urlObj;
};

class Page extends React.PureComponent {

  static propTypes = {
    id: PropTypes.string.isRequired,
    parent: PropTypes.string,
    active: PropTypes.bool,
    imageSync: PropTypes.instanceOf(ImageSync),
    children: PropTypes.node
  };

  static defaultProps = {
    active: false
  };

  static hrefFor(href = nothing, page = nothing) {
    if (page::maybe.isDefined() && typeof page !== "string")
      throw new Error(`could not build \`href\` for a page; \`${page}\` is not a string`);
  
    if (href::maybe.isEmpty()) {
      if (page::maybe.isEmpty())
        throw new Error("expected an `href` and/or `page` property, but got neither");
      return `?page=${page}`;
    }
  
    if (typeof href === "string") {
      if (page::maybe.isEmpty()) return href;
      return attachPageQuery(parseUrl(href, true), page);
    }
  
    if (typeof href === "object") {
      if (page::maybe.isEmpty()) return href;
      return attachPageQuery(href, page);
    }
  }

  render() {
    const { active, id, parent, children } = this.props;

    const back = parent::maybe.isDefined()
      ? (<Link href={Page.hrefFor(null, parent)} scroll={false}><div className="back"></div></Link>)
      : nothing;
    
    const close = <Link href="./" scroll={false}><div className="close"></div></Link>;
    
    const klass = "active"::maybe.when(active);
    
    return (
      <article id={id} className={klass}>
        {back}
        {close}
        {children}
      </article>
    );
  }

}

export default Page;